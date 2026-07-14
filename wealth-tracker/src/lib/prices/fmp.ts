// Aktienkurse über Financial Modeling Prep (FMP).
// Vom Server (Vercel) erreichbar; braucht einen kostenlosen API-Key.
// Ein Batch-Abruf liefert viele Symbole auf einmal, inkl. Tagesveränderung.

export interface FmpQuote {
  price: number; // in Landeswährung
  changePct: number | null; // Tagesveränderung in %
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Ruft Kurse für viele Symbole ab (Map: Symbol -> Kurs/Änderung).
export async function fetchFmpQuotes(
  symbols: string[],
  apiKey: string,
): Promise<Map<string, FmpQuote>> {
  const out = new Map<string, FmpQuote>();
  if (symbols.length === 0 || !apiKey) return out;

  for (const group of chunk(symbols, 40)) {
    const url =
      `https://financialmodelingprep.com/api/v3/quote/${group.join(",")}` +
      `?apikey=${encodeURIComponent(apiKey)}`;

    let res: Response;
    try {
      res = await fetch(url, { cache: "no-store" });
    } catch {
      continue;
    }
    if (!res.ok) continue;

    const json = await res.json().catch(() => null);
    if (!Array.isArray(json)) continue;

    for (const q of json) {
      if (typeof q?.symbol === "string" && typeof q?.price === "number") {
        out.set(q.symbol, {
          price: q.price,
          changePct:
            typeof q.changesPercentage === "number" ? q.changesPercentage : null,
        });
      }
    }
  }
  return out;
}
