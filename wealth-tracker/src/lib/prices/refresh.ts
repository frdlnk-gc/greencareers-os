import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchYahooQuote, fetchEurRate } from "./yahoo";
import { fetchCoinGeckoPrices } from "./coingecko";
import { mapWithConcurrency, safe } from "./pool";

export interface RefreshResult {
  updated: number;
  failed: string[];
}

interface InstrumentRow {
  id: string;
  kind: string;
  yahoo_symbol: string | null;
  coingecko_id: string | null;
}

interface PriceRow {
  instrument_id: string;
  price: number;
  currency: string;
  change_pct_1d: number | null;
  as_of: string;
  source: string;
}

// Holt frische Kurse für alle sichtbaren Instrumente und schreibt sie —
// einheitlich in EUR umgerechnet — in die prices-Tabelle.
// `supabase` bestimmt über RLS, welche Instrumente sichtbar sind
// (Nutzer-Session: nur eigene; Service-Client: alle).
export async function refreshPrices(
  supabase: SupabaseClient,
): Promise<RefreshResult> {
  const { data, error } = await supabase
    .from("instruments")
    .select("id,kind,yahoo_symbol,coingecko_id");
  if (error) throw new Error("Instrumente laden: " + error.message);

  const instruments = (data ?? []) as InstrumentRow[];
  const stocks = instruments.filter((i) => i.kind !== "crypto" && i.yahoo_symbol);
  const cryptos = instruments.filter((i) => i.kind === "crypto" && i.coingecko_id);

  const failed: string[] = [];
  const now = new Date().toISOString();
  const rows: PriceRow[] = [];

  // 1) Aktien/ETFs von Yahoo (max. 8 parallel).
  const quotes = await mapWithConcurrency(stocks, 8, async (i) => ({
    i,
    q: await safe(() => fetchYahooQuote(i.yahoo_symbol as string)),
  }));

  // 2) Benötigte Wechselkurse ermitteln und abrufen.
  const currencies = new Set<string>();
  for (const { q } of quotes) {
    if (q && q.currency !== "EUR") currencies.add(q.currency);
  }
  const fx = new Map<string, number>([["EUR", 1]]);
  await Promise.all(
    [...currencies].map(async (c) => {
      const r = await safe(() => fetchEurRate(c));
      if (r) fx.set(c, r);
    }),
  );

  // 3) Aktienkurse in EUR umrechnen.
  for (const { i, q } of quotes) {
    if (!q) {
      failed.push(i.yahoo_symbol as string);
      continue;
    }
    const rate = fx.get(q.currency);
    if (!rate) {
      failed.push(`${i.yahoo_symbol} (kein FX ${q.currency})`);
      continue;
    }
    rows.push({
      instrument_id: i.id,
      price: q.price / rate,
      currency: "EUR",
      change_pct_1d: q.changePct,
      as_of: now,
      source: "yahoo",
    });
  }

  // 4) Krypto von CoinGecko (bereits in EUR).
  const cg = await fetchCoinGeckoPrices(cryptos.map((c) => c.coingecko_id as string));
  for (const i of cryptos) {
    const row = cg.get(i.coingecko_id as string);
    if (!row) {
      failed.push(i.coingecko_id as string);
      continue;
    }
    rows.push({
      instrument_id: i.id,
      price: row.priceEur,
      currency: "EUR",
      change_pct_1d: row.changePct,
      as_of: now,
      source: "coingecko",
    });
  }

  // 5) In einem Rutsch speichern.
  if (rows.length > 0) {
    const { error: upErr } = await supabase
      .from("prices")
      .upsert(rows, { onConflict: "instrument_id" });
    if (upErr) throw new Error("Kurse speichern: " + upErr.message);
  }

  return { updated: rows.length, failed };
}
