import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchFmpQuotes } from "./fmp";
import { fetchFrankfurterRates } from "./frankfurter";
import { currencyForSymbol } from "./exchanges";
import { fetchCoinGeckoPrices, fetchCoinGeckoHistory } from "./coingecko";
import { fetchTradegateQuotes } from "./tradegate";
import { isinForSymbol } from "./isins";

export interface RefreshResult {
  updated: number;
  stockUpdated: number;
  cryptoUpdated: number;
  failed: string[];
  sources: Record<string, number>;
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
// einheitlich in EUR — in die prices-Tabelle.
//
// Quellen:
//  - Aktien/ETFs: Tradegate (deutsche Börse) über die ISIN. Liefert EUR direkt,
//    weltweit (USA, Europa, Asien), gratis. Fällt auf FMP zurück, falls für ein
//    Symbol keine ISIN hinterlegt ist.
//  - Krypto: CoinGecko (bereits in EUR, inkl. 24h-Veränderung).
export async function refreshPrices(
  supabase: SupabaseClient,
): Promise<RefreshResult> {
  const { data, error } = await supabase
    .from("instruments")
    .select("id,kind,yahoo_symbol,coingecko_id");
  if (error) throw new Error("Instrumente laden: " + error.message);

  const instruments = (data ?? []) as InstrumentRow[];
  const stocks = instruments.filter(
    (i) => i.kind !== "crypto" && i.yahoo_symbol,
  );
  const cryptos = instruments.filter(
    (i) => i.kind === "crypto" && i.coingecko_id,
  );

  const failed: string[] = [];
  const sources: Record<string, number> = {};
  const now = new Date().toISOString();
  const rows: PriceRow[] = [];

  const bump = (s: string) => {
    sources[s] = (sources[s] ?? 0) + 1;
  };

  // Aktien in "hat ISIN" (Tradegate) und "keine ISIN" (FMP) aufteilen.
  const viaTradegate = stocks.filter((i) => isinForSymbol(i.yahoo_symbol));
  const viaFmp = stocks.filter((i) => !isinForSymbol(i.yahoo_symbol));

  // --- Tradegate: Kurse per ISIN, direkt in EUR ---
  let stockUpdated = 0;
  const tgFailed: InstrumentRow[] = [];
  if (viaTradegate.length > 0) {
    const isins = viaTradegate.map(
      (i) => isinForSymbol(i.yahoo_symbol) as string,
    );
    const quotes = await fetchTradegateQuotes(isins);
    for (const i of viaTradegate) {
      const isin = isinForSymbol(i.yahoo_symbol) as string;
      const q = quotes.get(isin);
      if (!q) {
        tgFailed.push(i); // -> FMP-Fallback unten
        continue;
      }
      rows.push({
        instrument_id: i.id,
        price: q.price,
        currency: "EUR",
        change_pct_1d: q.changePct,
        as_of: now,
        source: "tradegate",
      });
      bump("tradegate");
      stockUpdated++;
    }
  }

  // --- FMP-Fallback: Symbole ohne ISIN + Tradegate-Ausfälle (via Frankfurter) ---
  const fmpList = [...viaFmp, ...tgFailed];
  if (fmpList.length > 0) {
    const apiKey = process.env.FMP_API_KEY ?? "";
    const quotes = await fetchFmpQuotes(
      fmpList.map((i) => i.yahoo_symbol as string),
      apiKey,
    );
    const currencies = new Set<string>();
    for (const i of fmpList) {
      const c = currencyForSymbol(i.yahoo_symbol as string);
      if (c !== "EUR") currencies.add(c);
    }
    const fx = await fetchFrankfurterRates([...currencies]);
    for (const i of fmpList) {
      const q = quotes.get(i.yahoo_symbol as string);
      if (!q) {
        failed.push(
          apiKey ? (i.yahoo_symbol as string) : `${i.yahoo_symbol} (kein Key)`,
        );
        continue;
      }
      const cur = currencyForSymbol(i.yahoo_symbol as string);
      const rate = cur === "EUR" ? 1 : fx.get(cur);
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
      bump("fmp");
      stockUpdated++;
    }
  }

  // --- Krypto über CoinGecko (bereits in EUR, inkl. 24h-Veränderung) ---
  const cg = await fetchCoinGeckoPrices(
    cryptos.map((c) => c.coingecko_id as string),
  );
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
    bump("coingecko");
    cryptoUpdated++;
  }

  // --- Speichern ---
  if (rows.length > 0) {
    const { error: upErr } = await supabase
      .from("prices")
      .upsert(rows, { onConflict: "instrument_id" });
    if (upErr) throw new Error("Kurse speichern: " + upErr.message);
  }

  // --- Tageskurse in die Historie schreiben (für Zeitraum-Entwicklung) ---
  // Fehlschlag (z. B. Tabelle noch nicht angelegt) darf den Refresh nicht stören.
  const today = now.slice(0, 10);
  try {
    const histRows = rows.map((r) => ({
      instrument_id: r.instrument_id,
      as_of: today,
      price_eur: r.price,
    }));
    if (histRows.length > 0) {
      await supabase
        .from("price_history")
        .upsert(histRows, { onConflict: "instrument_id,as_of" });
    }
    // Krypto einmalig aus CoinGecko rückbefüllen (max. 365 Tage).
    await backfillCryptoHistory(supabase, cryptos);
  } catch {
    // Historie optional — ignorieren, wenn Tabelle fehlt.
  }

  return { updated: rows.length, stockUpdated, cryptoUpdated, failed, sources };
}

// Füllt die Kurs-Historie für Krypto-Instrumente einmalig aus CoinGecko.
// Läuft nur für Coins, die noch (fast) keine Historie haben.
async function backfillCryptoHistory(
  supabase: SupabaseClient,
  cryptos: InstrumentRow[],
): Promise<void> {
  for (const c of cryptos) {
    const id = c.coingecko_id;
    if (!id) continue;
    const { count } = await supabase
      .from("price_history")
      .select("as_of", { count: "exact", head: true })
      .eq("instrument_id", c.id);
    if ((count ?? 0) >= 30) continue; // schon befüllt

    const series = await fetchCoinGeckoHistory(id, 365);
    if (series.length === 0) continue;
    const histRows = series.map(([day, price]) => ({
      instrument_id: c.id,
      as_of: day,
      price_eur: price,
    }));
    await supabase
      .from("price_history")
      .upsert(histRows, { onConflict: "instrument_id,as_of" });
  }
}
