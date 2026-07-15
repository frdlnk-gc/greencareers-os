import { createClient } from "./supabase/server";
import { computePortfolio } from "./portfolio";
import { getLiveFxRates, mergeFxRates, toEur } from "./prices/fx";
import { ensureHistory } from "./prices/refresh";
import { fetchBfDividends } from "./prices/boersefrankfurt";
import { isinForSymbol } from "./prices/isins";
import {
  computeScopeSeries,
  type HistoryMap,
  type ScopeSeries,
} from "./history";
import type {
  Account,
  Instrument,
  PortfolioSummary,
  Price,
  Transaction,
} from "./types";

// Lädt alle Portfolio-Daten des angemeldeten Nutzers und berechnet die
// aggregierten Depot- und Gesamtwerte.
export async function getPortfolio(): Promise<PortfolioSummary> {
  const supabase = await createClient();

  const [accountsRes, instrumentsRes, transactionsRes, pricesRes, fxRes, liveFx] =
    await Promise.all([
      supabase.from("accounts").select("*"),
      supabase.from("instruments").select("*"),
      supabase.from("transactions").select("*"),
      supabase.from("prices").select("*"),
      supabase.from("fx_rates").select("quote,rate"),
      getLiveFxRates(),
    ]);

  const accounts = (accountsRes.data ?? []) as Account[];
  const instruments = (instrumentsRes.data ?? []) as Instrument[];
  const transactions = (transactionsRes.data ?? []) as Transaction[];
  const prices = (pricesRes.data ?? []) as Price[];

  // Live-Kurse (EZB) haben Vorrang, DB-Seed als Baseline, statischer Fallback.
  const fxRates = mergeFxRates(
    fxRes.data as { quote: string; rate: number }[] | null,
    liveFx,
  );

  return computePortfolio({
    accounts,
    instruments,
    transactions,
    prices,
    fxRates,
  });
}

export interface WealthScope {
  id: string; // "total" oder Depot-ID
  name: string; // "Gesamt" oder Depotname
  series: ScopeSeries; // value / twr / invested je Tag
  dayChangePct: number | null; // Tagesveränderung (heute)
  currentValueEur: number; // aktueller Wert
}
export interface WealthData {
  scopes: WealthScope[]; // [Gesamt, ...Depots]
}

// Lädt die Vermögens-Zeitreihen (wie getquin) für die Übersicht/Depots:
// pro Scope (Gesamt + je Depot) den Wert- und den Performance-Verlauf (TWR).
export async function getWealthSeries(): Promise<WealthData> {
  const supabase = await createClient();
  const [portfolio, txRes, liveFx, fxRes] = await Promise.all([
    getPortfolio(),
    supabase
      .from("transactions")
      .select(
        "account_id,instrument_id,type,trade_date,quantity,price,fees,currency",
      ),
    getLiveFxRates(),
    supabase.from("fx_rates").select("quote,rate"),
  ]);
  const fxRates = mergeFxRates(
    fxRes.data as { quote: string; rate: number }[] | null,
    liveFx,
  );

  // Historie laden.
  const history: HistoryMap = new Map();
  try {
    const { data } = await supabase
      .from("price_history")
      .select("instrument_id,as_of,price_eur");
    for (const row of data ?? []) {
      const id = (row as { instrument_id: string }).instrument_id;
      const ts = new Date((row as { as_of: string }).as_of).getTime();
      const price = Number((row as { price_eur: number }).price_eur);
      const arr = history.get(id) ?? [];
      arr.push([ts, price]);
      history.set(id, arr);
    }
    for (const arr of history.values()) arr.sort((a, b) => a[0] - b[0]);
  } catch {
    // keine Historie
  }

  // Fehlende Historie sofort nachladen (Börse Frankfurt / CoinGecko).
  const positionsInstruments = portfolio.accounts.flatMap((a) =>
    a.positions.map((p) => p.instrument),
  );
  const missing = positionsInstruments.filter(
    (inst) => (history.get(inst.id)?.length ?? 0) < 2,
  );
  if (missing.length > 0) {
    const filled = await ensureHistory(
      supabase,
      missing.map((inst) => ({
        id: inst.id,
        kind: inst.kind,
        yahoo_symbol: inst.yahoo_symbol,
        coingecko_id: inst.coingecko_id,
      })),
    );
    for (const [id, series] of filled) {
      const arr = history.get(id) ?? [];
      const merged = [...arr, ...series];
      merged.sort((a, b) => a[0] - b[0]);
      history.set(id, merged);
    }
  }

  // Aktuelle EUR-Kurse je Instrument (aus den Positionen).
  const currentPriceEur = new Map<string, number>();
  for (const a of portfolio.accounts) {
    for (const p of a.positions) {
      if (p.quantity > 0) currentPriceEur.set(p.instrument.id, p.valueEur / p.quantity);
    }
  }

  const now = new Date();
  const allTx = (txRes.data ?? []) as {
    account_id: string;
    instrument_id: string | null;
    type: string;
    trade_date: string;
    quantity: number | null;
    price: number | null;
    fees: number | null;
    currency: string | null;
  }[];

  const investmentAccountIds = new Set(
    portfolio.accounts.map((a) => a.account.id),
  );

  const scopes: WealthScope[] = [];

  // Gesamt (alle Investment-Depots zusammen).
  scopes.push({
    id: "total",
    name: "Gesamt",
    series: computeScopeSeries(
      allTx.filter((t) => investmentAccountIds.has(t.account_id)),
      history,
      currentPriceEur,
      fxRates,
      now,
    ),
    dayChangePct: portfolio.changePct1d,
    currentValueEur: portfolio.investmentsValueEur,
  });

  // Je Depot.
  for (const a of portfolio.accounts) {
    scopes.push({
      id: a.account.id,
      name: a.account.name,
      series: computeScopeSeries(
        allTx.filter((t) => t.account_id === a.account.id),
        history,
        currentPriceEur,
        fxRates,
        now,
      ),
      dayChangePct: a.changePct1d,
      currentValueEur: a.valueEur,
    });
  }

  return { scopes };
}

export interface InstrumentDetail {
  accountId: string;
  accountName: string;
  position: import("./types").Position;
  series: ScopeSeries; // value / twr / invested je Tag (für den Chart)
  dayChangePct: number | null;
  currentValueEur: number;
  transactions: {
    id: string;
    type: string;
    trade_date: string;
    quantity: number | null;
    price: number | null;
    amount: number | null;
    currency: string | null;
    fees: number | null;
  }[];
}

// Lädt Detaildaten zu einer Position (in einem Depot): Kurs-Historie,
// Zeitraum-Entwicklung und Transaktionen.
export async function getInstrumentDetail(
  accountId: string,
  instrumentId: string,
): Promise<InstrumentDetail | null> {
  const supabase = await createClient();
  const portfolio = await getPortfolio();
  const account = [...portfolio.accounts, ...portfolio.otherAccounts].find(
    (a) => a.account.id === accountId,
  );
  const position = account?.positions.find(
    (p) => p.instrument.id === instrumentId,
  );
  if (!account || !position) return null;

  const [histRes, txRes, liveFx, fxRes] = await Promise.all([
    supabase
      .from("price_history")
      .select("as_of,price_eur")
      .eq("instrument_id", instrumentId)
      .order("as_of", { ascending: true }),
    supabase
      .from("transactions")
      .select("id,type,trade_date,quantity,price,amount,currency,fees")
      .eq("account_id", accountId)
      .eq("instrument_id", instrumentId)
      .order("trade_date", { ascending: false }),
    getLiveFxRates(),
    supabase.from("fx_rates").select("quote,rate"),
  ]);
  const fxRates = mergeFxRates(
    fxRes.data as { quote: string; rate: number }[] | null,
    liveFx,
  );

  let priceSeries: [number, number][] = (histRes.data ?? []).map((r) => [
    new Date((r as { as_of: string }).as_of).getTime(),
    Number((r as { price_eur: number }).price_eur),
  ]);

  // Historie fehlt noch? Sofort von Börse Frankfurt / CoinGecko holen.
  if (priceSeries.length < 2) {
    const filled = await ensureHistory(supabase, [
      {
        id: instrumentId,
        kind: position.instrument.kind,
        yahoo_symbol: position.instrument.yahoo_symbol,
        coingecko_id: position.instrument.coingecko_id,
      },
    ]);
    const s = filled.get(instrumentId);
    if (s && s.length >= 2) priceSeries = s;
  }

  const history: HistoryMap = new Map([[instrumentId, priceSeries]]);
  const currentPriceEur = new Map<string, number>([
    [
      instrumentId,
      position.quantity > 0 ? position.valueEur / position.quantity : 0,
    ],
  ]);
  const now = new Date();

  const transactions = (txRes.data ?? []) as InstrumentDetail["transactions"];
  const series = computeScopeSeries(
    transactions.map((t) => ({
      instrument_id: instrumentId,
      type: t.type,
      trade_date: t.trade_date,
      quantity: t.quantity,
      price: t.price,
      fees: t.fees,
      currency: t.currency,
    })),
    history,
    currentPriceEur,
    fxRates,
    now,
  );

  return {
    accountId,
    accountName: account.account.name,
    position,
    series,
    dayChangePct: position.changePct1d,
    currentValueEur: position.valueEur,
    transactions,
  };
}

// Zeitpunkt der zuletzt gespeicherten Kurse (für Auto-Aktualisierung/Anzeige).
export async function getLastPriceUpdate(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prices")
    .select("as_of")
    .order("as_of", { ascending: false })
    .limit(1);
  return (data?.[0]?.as_of as string | undefined) ?? null;
}

export type DividendStatus = "paid" | "announced" | "forecast";

export interface DividendEvent {
  date: string; // YYYY-MM-DD
  amountEur: number;
  amountOrig: number | null;
  currency: string | null;
  quantity: number | null; // Stückzahl bei Zahlung (falls erfasst)
  instrumentId: string | null;
  instrumentName: string;
  accountId: string;
  status: DividendStatus; // ausgezahlt / angekündigt / Prognose
}

export interface DividendSummary {
  totalAllTime: number;
  byYear: { year: number; total: number }[];
  byMonthThisYear: number[]; // 12 Werte (Jan..Dez) für das laufende Jahr
  thisYearTotal: number;
  forecastAnnual: number; // Prognose auf Basis der letzten 12 Monate
  recent: {
    date: string;
    amount: number;
    instrument: string;
  }[];
  byInstrument: { name: string; total: number }[];
  events: DividendEvent[]; // alle Einzel-Dividenden (für die Analyse-Ansicht)
}

// Lädt Dividenden aus zwei Quellen und bereitet sie auf:
//  - Manuell erfasste Dividenden (haben Vorrang).
//  - Automatisch je Aktie über die ISIN von Börse Frankfurt (reale Zahlungen
//    je Aktie × gehaltene Stückzahl am Zahltag) – so muss man nichts eintippen.
//  - Prognose: letzte 12 Monate ein Jahr fortgeschrieben.
export async function getDividends(): Promise<DividendSummary> {
  const supabase = await createClient();
  const [txRes, instRes, fxRes, liveFx] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "trade_date,amount,instrument_id,type,currency,account_id,quantity",
      )
      .order("trade_date", { ascending: false }),
    supabase.from("instruments").select("id,name,yahoo_symbol,kind"),
    supabase.from("fx_rates").select("quote,rate"),
    getLiveFxRates(),
  ]);

  const fxRates = mergeFxRates(
    fxRes.data as { quote: string; rate: number }[] | null,
    liveFx,
  );

  const instruments = (instRes.data ?? []) as {
    id: string;
    name: string;
    yahoo_symbol: string | null;
    kind: string;
  }[];
  const nameById = new Map(instruments.map((i) => [i.id, i.name]));
  const allTx = (txRes.data ?? []) as {
    trade_date: string;
    amount: number | null;
    instrument_id: string | null;
    type: string;
    currency: string | null;
    account_id: string;
    quantity: number | null;
  }[];

  const todayStr = new Date().toISOString().slice(0, 10);

  // 1) Manuell erfasste Dividenden.
  const manual: DividendEvent[] = allTx
    .filter((t) => t.type === "dividend" && (t.amount ?? 0) !== 0)
    .map((t) => ({
      date: t.trade_date,
      amountEur: toEur(t.amount ?? 0, t.currency, fxRates),
      amountOrig: t.amount,
      currency: t.currency,
      quantity: t.quantity,
      instrumentId: t.instrument_id,
      instrumentName: t.instrument_id
        ? nameById.get(t.instrument_id) ?? "Unbekannt"
        : "Sonstige",
      accountId: t.account_id,
      status: t.trade_date <= todayStr ? "paid" : "announced",
    }));

  // 2) Bestände je (Instrument, Depot) über die Zeit (aus Kauf/Verkauf).
  const lotsByKey = new Map<string, { ms: number; qty: number }[]>();
  for (const t of allTx) {
    if (!t.instrument_id || (t.type !== "buy" && t.type !== "sell")) continue;
    const key = `${t.instrument_id}|${t.account_id}`;
    const arr = lotsByKey.get(key) ?? [];
    arr.push({
      ms: new Date(t.trade_date).getTime(),
      qty: (t.type === "buy" ? 1 : -1) * (t.quantity ?? 0),
    });
    lotsByKey.set(key, arr);
  }
  const qtyHeld = (instId: string, accId: string, ms: number) => {
    let q = 0;
    for (const l of lotsByKey.get(`${instId}|${accId}`) ?? []) {
      if (l.ms <= ms) q += l.qty;
    }
    return q;
  };
  const accountsForInstrument = (instId: string) => {
    const set = new Set<string>();
    for (const key of lotsByKey.keys()) {
      const sep = key.indexOf("|");
      if (key.slice(0, sep) === instId) set.add(key.slice(sep + 1));
    }
    return [...set];
  };

  // 3) Echte Dividenden je gehaltener Aktie (ISIN) von Börse Frankfurt.
  const heldStocks = instruments.filter(
    (i) =>
      i.kind !== "crypto" &&
      isinForSymbol(i.yahoo_symbol) &&
      accountsForInstrument(i.id).length > 0,
  );
  const manualKeys = new Set(
    manual.map((e) => `${e.instrumentId}|${e.accountId}|${e.date.slice(0, 7)}`),
  );
  const bfSeen = new Set<string>(); // dedup identischer BF-Zeilen (Handelsplätze)
  const bfEvents: DividendEvent[] = [];
  await Promise.all(
    heldStocks.map(async (inst) => {
      const isin = isinForSymbol(inst.yahoo_symbol) as string;
      let divs;
      try {
        divs = await fetchBfDividends(isin);
      } catch {
        return;
      }
      for (const d of divs) {
        const ms = new Date(d.date).getTime();
        for (const accId of accountsForInstrument(inst.id)) {
          const qty = qtyHeld(inst.id, accId, ms);
          if (qty <= 0) continue;
          if (manualKeys.has(`${inst.id}|${accId}|${d.date.slice(0, 7)}`))
            continue; // manuell hat Vorrang
          const seenKey = `${inst.id}|${accId}|${d.date}`;
          if (bfSeen.has(seenKey)) continue; // identische Zahlung nur einmal
          bfSeen.add(seenKey);
          bfEvents.push({
            date: d.date,
            amountEur: toEur(d.perShare * qty, d.currency, fxRates),
            amountOrig: d.perShare * qty,
            currency: d.currency,
            quantity: qty,
            instrumentId: inst.id,
            instrumentName: inst.name,
            accountId: accId,
            status: d.date <= todayStr ? "paid" : "announced",
          });
        }
      }
    }),
  );

  const combined = [...manual, ...bfEvents];

  // 4) Prognose: jede Zahlung der letzten 12 Monate ein Jahr fortschreiben.
  const now = new Date();
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const haveKey = new Set(
    combined.map(
      (e) => `${e.instrumentId}|${e.accountId}|${e.date.slice(0, 7)}`,
    ),
  );
  const forecast: DividendEvent[] = [];
  for (const e of combined) {
    if (e.status !== "paid") continue;
    const d = new Date(e.date);
    if (d < yearAgo) continue;
    const proj = new Date(d);
    proj.setFullYear(proj.getFullYear() + 1);
    if (proj <= now) continue;
    const projDate = proj.toISOString().slice(0, 10);
    const key = `${e.instrumentId}|${e.accountId}|${projDate.slice(0, 7)}`;
    if (haveKey.has(key)) continue;
    haveKey.add(key);
    forecast.push({ ...e, date: projDate, status: "forecast" });
  }

  const events: DividendEvent[] = [...combined, ...forecast];

  // 5) Aggregate aus tatsächlichen Zahlungen (ohne Prognose).
  const paidEvents = events.filter((e) => e.status !== "forecast");
  const thisYear = now.getFullYear();
  const byYearMap = new Map<number, number>();
  const byMonthThisYear = new Array(12).fill(0);
  const byInstrumentMap = new Map<string, number>();
  let totalAllTime = 0;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  let last12 = 0;
  for (const e of paidEvents) {
    const d = new Date(e.date);
    const year = d.getFullYear();
    totalAllTime += e.amountEur;
    byYearMap.set(year, (byYearMap.get(year) ?? 0) + e.amountEur);
    if (year === thisYear) byMonthThisYear[d.getMonth()] += e.amountEur;
    if (d >= cutoff && e.status === "paid") last12 += e.amountEur;
    byInstrumentMap.set(
      e.instrumentName,
      (byInstrumentMap.get(e.instrumentName) ?? 0) + e.amountEur,
    );
  }

  const byYear = [...byYearMap.entries()]
    .map(([year, total]) => ({ year, total }))
    .sort((a, b) => b.year - a.year);
  const byInstrument = [...byInstrumentMap.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  return {
    totalAllTime,
    byYear,
    byMonthThisYear,
    thisYearTotal: byYearMap.get(thisYear) ?? 0,
    forecastAnnual: last12,
    recent: paidEvents.slice(0, 20).map((e) => ({
      date: e.date,
      amount: e.amountEur,
      instrument: e.instrumentName,
    })),
    byInstrument,
    events,
  };
}
