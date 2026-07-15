import { createClient } from "./supabase/server";
import { computePortfolio } from "./portfolio";
import {
  PERIODS,
  computePeriod,
  computeValueSeries,
  type HistoryMap,
  type Period,
  type PeriodResult,
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

  const [accountsRes, instrumentsRes, transactionsRes, pricesRes, fxRes] =
    await Promise.all([
      supabase.from("accounts").select("*"),
      supabase.from("instruments").select("*"),
      supabase.from("transactions").select("*"),
      supabase.from("prices").select("*"),
      supabase.from("fx_rates").select("*"),
    ]);

  const accounts = (accountsRes.data ?? []) as Account[];
  const instruments = (instrumentsRes.data ?? []) as Instrument[];
  const transactions = (transactionsRes.data ?? []) as Transaction[];
  const prices = (pricesRes.data ?? []) as Price[];

  const fxRates: Record<string, number> = {};
  for (const row of fxRes.data ?? []) {
    fxRates[(row as { quote: string }).quote] = (row as { rate: number }).rate;
  }

  return computePortfolio({
    accounts,
    instruments,
    transactions,
    prices,
    fxRates,
  });
}

export interface PeriodPerformance {
  total: Record<Period, PeriodResult>;
  byAccount: Record<string, Record<Period, PeriodResult>>;
  totalSeries: [number, number][];
  seriesByAccount: Record<string, [number, number][]>;
}

// Berechnet die Wertentwicklung über alle Zeiträume – gesamt und je Depot.
export async function getPeriodPerformance(): Promise<PeriodPerformance> {
  const supabase = await createClient();
  const portfolio = await getPortfolio();

  // Historie laden (kann fehlen, falls Tabelle noch nicht angelegt ist).
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
    // keine Historie -> nur 1T verfügbar
  }

  const now = new Date();
  const emptyMap = () =>
    Object.fromEntries(
      PERIODS.map((p) => [p, { pct: null, changeEur: null, covered: false }]),
    ) as Record<Period, PeriodResult>;

  const holdingsOf = (positions: typeof portfolio.accounts[number]["positions"]) =>
    positions.map((p) => ({
      instrumentId: p.instrument.id,
      quantity: p.quantity,
      currentPriceEur: p.quantity > 0 ? p.valueEur / p.quantity : 0,
      changePct1d: p.changePct1d,
    }));

  const allHoldings = portfolio.accounts.flatMap((a) => holdingsOf(a.positions));
  const total = emptyMap();
  for (const p of PERIODS) total[p] = computePeriod(p, allHoldings, history, now);
  const totalSeries = computeValueSeries(allHoldings, history);

  const byAccount: Record<string, Record<Period, PeriodResult>> = {};
  const seriesByAccount: Record<string, [number, number][]> = {};
  for (const a of portfolio.accounts) {
    const holdings = holdingsOf(a.positions);
    const map = emptyMap();
    for (const p of PERIODS) map[p] = computePeriod(p, holdings, history, now);
    byAccount[a.account.id] = map;
    seriesByAccount[a.account.id] = computeValueSeries(holdings, history);
  }

  return { total, byAccount, totalSeries, seriesByAccount };
}

export interface InstrumentDetail {
  accountId: string;
  accountName: string;
  position: import("./types").Position;
  priceSeries: [number, number][]; // [ms, EUR]
  periods: Record<Period, PeriodResult>;
  transactions: {
    id: string;
    type: string;
    trade_date: string;
    quantity: number | null;
    price: number | null;
    amount: number | null;
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

  const [histRes, txRes] = await Promise.all([
    supabase
      .from("price_history")
      .select("as_of,price_eur")
      .eq("instrument_id", instrumentId)
      .order("as_of", { ascending: true }),
    supabase
      .from("transactions")
      .select("id,type,trade_date,quantity,price,amount")
      .eq("account_id", accountId)
      .eq("instrument_id", instrumentId)
      .order("trade_date", { ascending: false }),
  ]);

  const priceSeries: [number, number][] = (histRes.data ?? []).map((r) => [
    new Date((r as { as_of: string }).as_of).getTime(),
    Number((r as { price_eur: number }).price_eur),
  ]);

  const history: HistoryMap = new Map([[instrumentId, priceSeries]]);
  const holding = [
    {
      instrumentId,
      quantity: position.quantity,
      currentPriceEur:
        position.quantity > 0 ? position.valueEur / position.quantity : 0,
      changePct1d: position.changePct1d,
    },
  ];
  const now = new Date();
  const periods = Object.fromEntries(
    PERIODS.map((p) => [p, computePeriod(p, holding, history, now)]),
  ) as Record<Period, PeriodResult>;

  return {
    accountId,
    accountName: account.account.name,
    position,
    priceSeries,
    periods,
    transactions: (txRes.data ?? []) as InstrumentDetail["transactions"],
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
}

// Lädt Dividenden (aus Transaktionen vom Typ 'dividend') und bereitet sie auf:
// Jahressummen, Monatskalender, Historie und eine einfache Prognose.
export async function getDividends(): Promise<DividendSummary> {
  const supabase = await createClient();
  const [txRes, instRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("trade_date,amount,instrument_id,type")
      .eq("type", "dividend")
      .order("trade_date", { ascending: false }),
    supabase.from("instruments").select("id,name"),
  ]);

  const nameById = new Map(
    (instRes.data ?? []).map((i) => [i.id as string, i.name as string]),
  );
  const txns = (txRes.data ?? []) as {
    trade_date: string;
    amount: number | null;
    instrument_id: string | null;
  }[];

  const thisYear = new Date().getFullYear();
  const byYearMap = new Map<number, number>();
  const byMonthThisYear = new Array(12).fill(0);
  const byInstrumentMap = new Map<string, number>();
  let totalAllTime = 0;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  let last12 = 0;

  for (const t of txns) {
    const amount = t.amount ?? 0;
    if (amount === 0) continue;
    const d = new Date(t.trade_date);
    const year = d.getFullYear();
    totalAllTime += amount;
    byYearMap.set(year, (byYearMap.get(year) ?? 0) + amount);
    if (year === thisYear) byMonthThisYear[d.getMonth()] += amount;
    if (d >= cutoff) last12 += amount;
    const name = t.instrument_id
      ? (nameById.get(t.instrument_id) ?? "Unbekannt")
      : "Sonstige";
    byInstrumentMap.set(name, (byInstrumentMap.get(name) ?? 0) + amount);
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
    recent: txns.slice(0, 20).map((t) => ({
      date: t.trade_date,
      amount: t.amount ?? 0,
      instrument: t.instrument_id
        ? (nameById.get(t.instrument_id) ?? "Unbekannt")
        : "Sonstige",
    })),
    byInstrument,
  };
}
