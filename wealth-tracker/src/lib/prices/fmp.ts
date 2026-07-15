// Aktienkurse über Financial Modeling Prep (FMP), neuer "stable"-Endpunkt.
// Gratis-Tarif: nur US-Aktien, ein Symbol pro Abruf. Internationale Symbole
// und Batch sind zahlungspflichtig (liefern 402) und werden übersprungen.

import { mapWithConcurrency, safe } from "./pool";

export interface FmpQuote {
  price: number; // in Landeswährung (US = USD)
  changePct: number | null; // Tagesveränderung in %
}

async function fetchOne(
  symbol: string,
  apiKey: string,
): Promise<FmpQuote | null> {
  const url =
    `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}` +
    `&apikey=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null; // 402 = im Gratis-Tarif nicht verfügbar (z. B. Ausland)

  const json = await res.json().catch(() => null);
  const q = Array.isArray(json) ? json[0] : null;
  if (!q || typeof q.price !== "number") return null;

  return {
    price: q.price,
    changePct:
      typeof q.changePercentage === "number" ? q.changePercentage : null,
  };
}

// Historische Tagesschlusskurse (US-Aktien, Gratis-Tarif) in USD.
// Rückgabe: [Datum 'YYYY-MM-DD', Schlusskurs USD], neueste zuerst begrenzt.
export async function fetchFmpHistory(
  symbol: string,
  apiKey: string,
  maxDays = 800,
): Promise<[string, number][]> {
  if (!apiKey) return [];
  const url =
    `https://financialmodelingprep.com/api/v3/historical-price-full/${encodeURIComponent(symbol)}` +
    `?serietype=line&apikey=${encodeURIComponent(apiKey)}`;
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const json = (await res.json().catch(() => null)) as {
    historical?: { date: string; close: number }[];
  } | null;
  const hist = json?.historical ?? [];
  return hist
    .slice(0, maxDays)
    .filter((h) => typeof h.close === "number")
    .map((h) => [h.date, h.close] as [string, number]);
}

// Ruft Kurse für viele Symbole ab (Map: Symbol -> Kurs/Änderung).
export async function fetchFmpQuotes(
  symbols: string[],
  apiKey: string,
): Promise<Map<string, FmpQuote>> {
  const out = new Map<string, FmpQuote>();
  if (symbols.length === 0 || !apiKey) return out;

  const results = await mapWithConcurrency(symbols, 6, async (s) => ({
    s,
    q: await safe(() => fetchOne(s, apiKey)),
  }));
  for (const { s, q } of results) if (q) out.set(s, q);
  return out;
}
