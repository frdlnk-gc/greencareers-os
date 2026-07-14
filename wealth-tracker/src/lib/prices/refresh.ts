import type { SupabaseClient } from "@supabase/supabase-js";
import { toStooqSymbol, fetchStooqCloses, fetchStooqEurRates } from "./stooq";
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

  // --- Aktien/ETFs über Stooq ---
  const mapped = stocks.map((i) => ({
    i,
    m: toStooqSymbol(i.yahoo_symbol as string),
  }));
  for (const x of mapped) {
    if (!x.m) failed.push(`${x.i.yahoo_symbol} (Börse?)`);
  }
  const withSym = mapped.filter(
    (x): x is { i: InstrumentRow; m: NonNullable<typeof x.m> } => x.m !== null,
  );

  const closes = await fetchStooqCloses(withSym.map((x) => x.m.stooq));
  const currencies = new Set<string>();
  for (const x of withSym) if (x.m.currency !== "EUR") currencies.add(x.m.currency);
  const fx = await fetchStooqEurRates([...currencies]);

  let stockUpdated = 0;
  for (const { i, m } of withSym) {
    const close = closes.get(m.stooq);
    if (close === undefined) {
      failed.push(i.yahoo_symbol as string);
      continue;
    }
    const rate = fx.get(m.currency);
    if (!rate) {
      failed.push(`${i.yahoo_symbol} (FX ${m.currency}?)`);
      continue;
    }
    rows.push({
      instrument_id: i.id,
      price: close / rate,
      currency: "EUR",
      change_pct_1d: null, // Tagesveränderung folgt (Stooq liefert sie nicht direkt)
      as_of: now,
      source: "stooq",
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
