// Berechnet die Wertentwicklung über Zeiträume aus der Kurs-Historie.
// Grundidee: aktueller Wert der Positionen vs. Wert derselben Stückzahlen zu
// einem früheren Datum (Kurs aus price_history). Zeiträume, für die (noch) zu
// wenig Historie vorliegt, werden als „nicht abgedeckt" markiert.

export const PERIODS = ["1T", "7T", "30T", "YTD", "1J", "3J", "5J", "10J"] as const;
export type Period = (typeof PERIODS)[number];

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
      prev += h.changePct1d !== null ? v / (1 + h.changePct1d / 100) : v;
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
