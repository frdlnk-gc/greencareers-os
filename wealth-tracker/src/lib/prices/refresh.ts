import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchFmpQuotes } from "./fmp";
import { fetchFrankfurterRates } from "./frankfurter";
import { currencyForSymbol } from "./exchanges";
import { fetchCoinGeckoPrices } from "./coingecko";

export interface RefreshResult {
  updated: number;
  stockUpdated: number;
  cryptoUpdated: number;
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

  // --- Aktien/ETFs über FMP, Umrechnung via Frankfurter ---
  const apiKey = process.env.FMP_API_KEY ?? "";
  const quotes = await fetchFmpQuotes(
    stocks.map((i) => i.yahoo_symbol as string),
    apiKey,
  );

  const currencies = new Set<string>();
  for (const i of stocks) {
    const c = currencyForSymbol(i.yahoo_symbol as string);
    if (c !== "EUR") currencies.add(c);
  }
  const fx = await fetchFrankfurterRates([...currencies]);

  let stockUpdated = 0;
  for (const i of stocks) {
    const q = quotes.get(i.yahoo_symbol as string);
    if (!q) {
      failed.push(
        apiKey
          ? (i.yahoo_symbol as string)
          : `${i.yahoo_symbol} (kein FMP-Key)`,
      );
      continue;
    }
    const cur = currencyForSymbol(i.yahoo_symbol as string);
    const rate = fx.get(cur);
    if (!rate) {
      failed.push(`${i.yahoo_symbol} (FX ${cur}?)`);
      continue;
    }
    rows.push({
      instrument_id: i.id,
      price: q.price / rate,
      currency: "EUR",
      change_pct_1d: q.changePct,
      as_of: now,
      source: "fmp",
    });
    stockUpdated++;
  }

  // --- Krypto über CoinGecko (bereits in EUR, inkl. 24h-Veränderung) ---
  const cg = await fetchCoinGeckoPrices(cryptos.map((c) => c.coingecko_id as string));
  let cryptoUpdated = 0;
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
    cryptoUpdated++;
  }

  // --- Speichern ---
  if (rows.length > 0) {
    const { error: upErr } = await supabase
      .from("prices")
      .upsert(rows, { onConflict: "instrument_id" });
    if (upErr) throw new Error("Kurse speichern: " + upErr.message);
  }

  return { updated: rows.length, stockUpdated, cryptoUpdated, failed };
}
