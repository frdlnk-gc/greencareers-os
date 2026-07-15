// Berechnet die Wertentwicklung über Zeiträume aus der Kurs-Historie.
// Grundidee: aktueller Wert der Positionen vs. Wert derselben Stückzahlen zu
// einem früheren Datum (Kurs aus price_history). Zeiträume, für die (noch) zu
// wenig Historie vorliegt, werden als „nicht abgedeckt" markiert.

import { toEur } from "./prices/fx";

export const PERIODS = ["1T", "7T", "30T", "YTD", "1J", "3J", "5J", "10J"] as const;
export type Period = (typeof PERIODS)[number];

// --- Vermögens-Zeitreihen (wie getquin: Wert + Performance) -----------------

export interface ScopeSeries {
  value: [number, number][]; // Portfoliowert € je Tag (inkl. Zukäufe)
  twr: [number, number][]; // zeitgewichteter Rendite-Index (Start 1.0)
  invested: [number, number][]; // kumuliert eingesetztes Kapital € je Tag
}

interface TxLite {
  instrument_id: string | null;
  type: string;
  trade_date: string;
  quantity: number | null;
  price: number | null;
  fees: number | null;
  currency: string | null;
}

const DAY_MS = 86_400_000;

// Berechnet für eine Menge von Transaktionen (ein Depot, mehrere Depots oder
// eine einzelne Position) die täglichen Reihen:
//  - value:    tatsächlicher Portfoliowert (historische Stückzahl × Kurs)
//  - twr:      zeitgewichteter Rendite-Index (Zukäufe rausgerechnet)
//  - invested: kumuliert eingesetztes Kapital (Netto-Ein-/Auszahlungen)
// So kann der Chart sowohl „Performance" (twr) als auch „Portfoliowert" (value)
// darstellen und die €-Gewinne je Zeitraum ableiten.
export function computeScopeSeries(
  txs: TxLite[],
  history: HistoryMap,
  currentPriceEur: Map<string, number>,
  fxRates: Record<string, number>,
  now: Date,
): ScopeSeries {
  const trades = txs
    .filter((t) => t.instrument_id)
    .filter((t) => t.type === "buy" || t.type === "sell")
    .map((t) => ({
      instrumentId: t.instrument_id as string,
      ms: new Date(t.trade_date).getTime(),
      type: t.type,
      qty: t.quantity ?? 0,
      // Kaufkosten/Verkaufserlös in EUR (Kurs in Originalwährung -> EUR),
      // Gebühren sind in EUR erfasst.
      cashEur:
        toEur((t.price ?? 0) * (t.quantity ?? 0), t.currency, fxRates) +
        (t.type === "buy" ? t.fees ?? 0 : 0),
    }))
    .sort((a, b) => a.ms - b.ms);

  if (trades.length === 0) {
    return { value: [], twr: [], invested: [] };
  }

  const instrumentIds = [...new Set(trades.map((t) => t.instrumentId))];
  const firstMs = trades[0].ms;
  const nowMs = now.getTime();

  // Handelstage aus der Historie (nur ab dem ersten Kauf) + heute.
  const daySet = new Set<number>();
  for (const id of instrumentIds) {
    for (const [ms] of history.get(id) ?? []) {
      // Erst ab dem ersten Kauf – sonst gäbe es einen Startpunkt mit Wert 0
      // (noch nichts im Depot), der Prozent-Berechnungen verfälscht.
      if (ms >= firstMs) daySet.add(ms);
    }
  }
  for (const t of trades) daySet.add(t.ms);
  daySet.add(nowMs);
  const days = [...daySet].sort((a, b) => a - b);

  // Kurs-Zeiger je Instrument (vorwärts, Fill-Forward = letzter bekannter Kurs).
  const priceArr = new Map<string, [number, number][]>();
  const pricePtr = new Map<string, number>();
  const lastPrice = new Map<string, number>();
  for (const id of instrumentIds) {
    priceArr.set(id, history.get(id) ?? []);
    pricePtr.set(id, 0);
    lastPrice.set(id, 0);
  }

  const qty = new Map<string, number>();
  for (const id of instrumentIds) qty.set(id, 0);

  const value: [number, number][] = [];
  const twr: [number, number][] = [];
  const invested: [number, number][] = [];

  let txi = 0;
  let investedEur = 0;
  let prevV: number | null = null;
  let prevInvested = 0;
  let index = 1;

  for (const d of days) {
    // Transaktionen bis einschließlich diesem Tag anwenden.
    while (txi < trades.length && trades[txi].ms <= d) {
      const tr = trades[txi];
      if (tr.type === "buy") {
        qty.set(tr.instrumentId, (qty.get(tr.instrumentId) ?? 0) + tr.qty);
        investedEur += tr.cashEur;
      } else {
        qty.set(tr.instrumentId, (qty.get(tr.instrumentId) ?? 0) - tr.qty);
        investedEur -= tr.cashEur; // Verkaufserlös reduziert eingesetztes Kapital
      }
      txi++;
    }

    // Kurse fill-forward bis zu diesem Tag; am „Jetzt"-Punkt Live-Kurs nutzen.
    let V = 0;
    for (const id of instrumentIds) {
      const arr = priceArr.get(id)!;
      let p = pricePtr.get(id)!;
      while (p < arr.length && arr[p][0] <= d) {
        lastPrice.set(id, arr[p][1]);
        p++;
      }
      pricePtr.set(id, p);
      let px = lastPrice.get(id) ?? 0;
      if (d === nowMs) px = currentPriceEur.get(id) ?? px;
      V += (qty.get(id) ?? 0) * px;
    }

    // Zeitgewichtete Rendite: Zufluss des Tages (CF) rausrechnen.
    const cf = investedEur - prevInvested;
    if (prevV !== null && prevV > 0) {
      const r = (V - prevV - cf) / prevV;
      index *= 1 + r;
    }
    prevV = V;
    prevInvested = investedEur;

    value.push([d, V]);
    twr.push([d, index]);
    invested.push([d, investedEur]);
  }

  return { value, twr, invested };
}

export interface PeriodResult {
  pct: number | null;
  changeEur: number | null;
  covered: boolean; // genug Historie vorhanden?
}

interface Holding {
  instrumentId: string;
  quantity: number;
  currentPriceEur: number;
  changePct1d: number | null;
}

// [instrumentId] -> aufsteigend sortierte [Datum(ms), Preis]-Paare
export type HistoryMap = Map<string, [number, number][]>;

function targetDate(period: Period, now: Date): Date {
  const d = new Date(now);
  switch (period) {
    case "7T": d.setDate(d.getDate() - 7); break;
    case "30T": d.setDate(d.getDate() - 30); break;
    case "YTD": return new Date(now.getFullYear(), 0, 1);
    case "1J": d.setFullYear(d.getFullYear() - 1); break;
    case "3J": d.setFullYear(d.getFullYear() - 3); break;
    case "5J": d.setFullYear(d.getFullYear() - 5); break;
    case "10J": d.setFullYear(d.getFullYear() - 10); break;
    default: break;
  }
  return d;
}

// Preis am oder kurz vor dem Zieldatum (Toleranz je nach Zeitraum).
function priceAt(
  series: [number, number][],
  targetMs: number,
  toleranceDays: number,
): number | null {
  if (!series.length) return null;
  let best: number | null = null;
  let bestDiff = Infinity;
  for (const [ts, price] of series) {
    const diff = Math.abs(ts - targetMs);
    if (ts <= targetMs + 2 * 86400000 && diff < bestDiff) {
      bestDiff = diff;
      best = price;
    }
  }
  if (best === null) return null;
  return bestDiff <= toleranceDays * 86400000 ? best : null;
}

// Tägliche Wert-Zeitreihe einer Positionsgruppe aus der Historie.
// Nimmt nur Tage, an denen mind. 90 % des heutigen Werts eine Historie haben,
// damit der Chart nicht durch Lücken verzerrt wird.
export function computeValueSeries(
  holdings: Holding[],
  history: HistoryMap,
): [number, number][] {
  const currentTotal = holdings.reduce(
    (s, h) => s + h.quantity * h.currentPriceEur,
    0,
  );
  if (currentTotal <= 0) return [];

  // Preis-Maps je Instrument + alle vorkommenden Tage sammeln.
  const priceMap = new Map<string, Map<number, number>>();
  const days = new Set<number>();
  for (const h of holdings) {
    const series = history.get(h.instrumentId);
    if (!series) continue;
    const m = new Map<number, number>();
    for (const [ms, price] of series) {
      m.set(ms, price);
      days.add(ms);
    }
    priceMap.set(h.instrumentId, m);
  }

  const out: [number, number][] = [];
  for (const d of [...days].sort((a, b) => a - b)) {
    let value = 0;
    let coveredCurrent = 0;
    for (const h of holdings) {
      const price = priceMap.get(h.instrumentId)?.get(d);
      if (price !== undefined) {
        value += h.quantity * price;
        coveredCurrent += h.quantity * h.currentPriceEur;
      }
    }
    if (coveredCurrent / currentTotal >= 0.9) out.push([d, value]);
  }
  return out;
}

export function computePeriod(
  period: Period,
  holdings: Holding[],
  history: HistoryMap,
  now: Date,
): PeriodResult {
  // 1-Tages-Entwicklung kommt aus dem Live-Tagesänderungswert.
  if (period === "1T") {
    let cur = 0;
    let prev = 0;
    for (const h of holdings) {
      const v = h.quantity * h.currentPriceEur;
      cur += v;
      const denom = h.changePct1d !== null ? 1 + h.changePct1d / 100 : 1;
      prev += denom > 0 ? v / denom : v;
    }
    const changeEur = cur - prev;
    return {
      pct: prev > 0 ? (changeEur / prev) * 100 : null,
      changeEur,
      covered: true,
    };
  }

  const tMs = targetDate(period, now).getTime();
  const tolerance = period === "7T" ? 6 : period === "30T" ? 12 : 40;

  let curCovered = 0;
  let pastCovered = 0;
  let totalCurrent = 0;
  for (const h of holdings) {
    const v = h.quantity * h.currentPriceEur;
    totalCurrent += v;
    const series = history.get(h.instrumentId);
    const past = series ? priceAt(series, tMs, tolerance) : null;
    if (past !== null && past > 0) {
      curCovered += v;
      pastCovered += h.quantity * past;
    }
  }

  // Abgedeckt, wenn mind. 60 % des heutigen Werts eine Historie haben.
  const covered = totalCurrent > 0 && curCovered / totalCurrent >= 0.6;
  if (!covered || pastCovered <= 0) {
    return { pct: null, changeEur: null, covered: false };
  }
  const changeEur = curCovered - pastCovered;
  return { pct: (changeEur / pastCovered) * 100, changeEur, covered: true };
}
