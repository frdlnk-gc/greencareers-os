// Kursabruf über Yahoo Finance.
// Wichtig für Server-/Cloud-Umgebungen (z. B. Vercel): Yahoo verlangt ein
// gültiges Consent-Cookie + "Crumb"-Token, sonst werden Anfragen abgewiesen.
// Wir holen deshalb zuerst eine Session und fragen dann gebündelt ab.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36";

export interface YahooQuote {
  price: number;
  currency: string;
  changePct: number | null;
}

interface YahooSession {
  cookie: string;
  crumb: string;
}

// Holt Cookie + Crumb. Gibt null zurück, wenn das nicht klappt (dann wird
// ohne Crumb versucht — funktioniert manchmal trotzdem).
async function getYahooSession(): Promise<YahooSession | null> {
  try {
    const r1 = await fetch("https://finance.yahoo.com/", {
      headers: { "User-Agent": UA, Accept: "text/html" },
      cache: "no-store",
    });
    const setCookies =
      (r1.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ??
      [];
    const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
    if (!cookie) return null;

    const r2 = await fetch(
      "https://query1.finance.yahoo.com/v1/test/getcrumb",
      {
        headers: { "User-Agent": UA, Cookie: cookie, Accept: "text/plain" },
        cache: "no-store",
      },
    );
    if (!r2.ok) return null;
    const crumb = (await r2.text()).trim();
    if (!crumb || crumb.length > 64 || crumb.includes("<")) return null;

    return { cookie, crumb };
  } catch {
    return null;
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function normalize(
  price: number,
  currency: string,
): { price: number; currency: string } {
  if (currency === "GBp" || currency === "GBX") {
    return { price: price / 100, currency: "GBP" };
  }
  return { price, currency };
}

// Fragt viele Symbole gebündelt ab (Aktien, ETFs und FX-Symbole wie EURUSD=X).
export async function fetchYahooQuotes(
  symbols: string[],
): Promise<Map<string, YahooQuote>> {
  const out = new Map<string, YahooQuote>();
  if (symbols.length === 0) return out;

  const session = await getYahooSession();

  for (const group of chunk(symbols, 50)) {
    const params = new URLSearchParams({ symbols: group.join(",") });
    if (session?.crumb) params.set("crumb", session.crumb);

    const url = `https://query1.finance.yahoo.com/v7/finance/quote?${params.toString()}`;
    const headers: Record<string, string> = {
      "User-Agent": UA,
      Accept: "application/json",
    };
    if (session?.cookie) headers.Cookie = session.cookie;

    let res: Response;
    try {
      res = await fetch(url, { headers, cache: "no-store" });
    } catch {
      continue;
    }
    if (!res.ok) continue;

    const json = await res.json().catch(() => null);
    const results = json?.quoteResponse?.result;
    if (!Array.isArray(results)) continue;

    for (const q of results) {
      if (typeof q?.symbol !== "string" || typeof q?.regularMarketPrice !== "number") {
        continue;
      }
      const norm = normalize(q.regularMarketPrice, q.currency ?? "USD");
      out.set(q.symbol, {
        price: norm.price,
        currency: norm.currency,
        changePct:
          typeof q.regularMarketChangePercent === "number"
            ? q.regularMarketChangePercent
            : null,
      });
    }
  }

  return out;
}

// Wechselkurse: liefert Map Währung -> (Einheiten pro 1 EUR).
export async function fetchEurRates(
  currencies: string[],
): Promise<Map<string, number>> {
  const rates = new Map<string, number>([["EUR", 1]]);
  const needed = currencies.filter((c) => c && c !== "EUR");
  if (needed.length === 0) return rates;

  const symbols = needed.map((c) => `EUR${c}=X`);
  const quotes = await fetchYahooQuotes(symbols);
  for (const c of needed) {
    const q = quotes.get(`EUR${c}=X`);
    if (q && q.price > 0) rates.set(c, q.price);
  }
  return rates;
}
