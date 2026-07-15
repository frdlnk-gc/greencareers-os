import { createClient } from "./supabase/server";
import { computePortfolio } from "./portfolio";
import { getLiveFxRates, mergeFxRates, toEur } from "./prices/fx";
import { ensureHistory } from "./prices/refresh";
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

export interface DividendEvent {
  date: string; // YYYY-MM-DD
  amountEur: number;
  amountOrig: number | null;
  currency: string | null;
  quantity: number | null; // Stückzahl bei Zahlung (falls erfasst)
  instrumentId: string | null;
  instrumentName: string;
  accountId: string;
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

// Lädt Dividenden (aus Transaktionen vom Typ 'dividend') und bereitet sie auf:
// Jahressummen, Monatskalender, Historie und eine einfache Prognose.
export async function getDividends(): Promise<DividendSummary> {
  const supabase = await createClient();
  const [txRes, instRes, fxRes, liveFx] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "trade_date,amount,instrument_id,type,currency,account_id,quantity",
      )
      .eq("type", "dividend")
      .order("trade_date", { ascending: false }),
    supabase.from("instruments").select("id,name"),
    supabase.from("fx_rates").select("quote,rate"),
    getLiveFxRates(),
  ]);

  // Dividenden können in Fremdwährung sein (z. B. US$) -> in EUR umrechnen.
  const fxRates = mergeFxRates(
    fxRes.data as { quote: string; rate: number }[] | null,
    liveFx,
  );

  const nameById = new Map(
    (instRes.data ?? []).map((i) => [i.id as string, i.name as string]),
  );
  const raw = (txRes.data ?? []) as {
    trade_date: string;
    amount: number | null;
    instrument_id: string | null;
    currency: string | null;
    account_id: string;
    quantity: number | null;
  }[];

  const events: DividendEvent[] = raw
    .filter((t) => (t.amount ?? 0) !== 0)
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
    }));

  const txns = raw.map((t) => ({
    ...t,
    amount: t.amount == null ? null : toEur(t.amount, t.currency, fxRates),
  }));

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
    events,
  };
}
