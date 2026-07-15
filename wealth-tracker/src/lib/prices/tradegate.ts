// Kursquelle: Tradegate (deutsche Börse). Liefert für praktisch jede an
// deutschen Börsen handelbare Aktie/ETF einen Live-Kurs — in EURO — inkl.
// Tagesveränderung. Gratis, kein API-Key, keine Länderbeschränkung.
//
// Endpunkt (JSON):  https://www.tradegate.de/refresh.php?isin=<ISIN>
// Beispielantwort:  { "bid": "1 554,20", "delta": 2.79, "last": "1 560,00",
//                     "close": 1517.6, ... }
// Zahlen kommen teils als deutsche Strings ("1 560,00"), teils als echte
// JSON-Zahlen (42.905). "./." bedeutet "kein Wert".

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36";

export interface TradegateQuote {
  price: number; // aktueller Kurs in EUR
  changePct: number | null; // Tagesveränderung in %
  prevClose: number | null; // Vortagesschluss in EUR
}

// Wandelt einen Tradegate-Wert (Zahl oder deutscher String) in eine Zahl.
function parseNum(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  let s = v.trim().replace(/\s/g, "");
  if (!s || s === "./." ) return null;
  // Komma vorhanden -> deutsches Format (Punkt = Tausender, Komma = Dezimal)
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

interface RefreshJson {
  bid?: unknown;
  ask?: unknown;
  last?: unknown;
  close?: unknown;
  delta?: unknown;
}

function quoteFromJson(j: RefreshJson): TradegateQuote | null {
  const last = parseNum(j.last);
  const bid = parseNum(j.bid);
  const ask = parseNum(j.ask);
  const close = parseNum(j.close);

  // Aktueller Kurs: bevorzugt letzter Handel, sonst Mittel aus Bid/Ask,
  // sonst Vortagesschluss (z. B. wenn heute noch kein Umsatz war).
  let price = last;
  if (price == null) {
    if (bid != null && ask != null) price = (bid + ask) / 2;
    else if (bid != null) price = bid;
    else price = close;
  }
  if (price == null) return null;

  let changePct = parseNum(j.delta);
  if (changePct == null && close != null && close !== 0) {
    changePct = ((price - close) / close) * 100;
  }

  return { price, changePct, prevClose: close };
}

// Holt einen einzelnen Kurs über die ISIN. Ein Versuch (ohne Retry).
async function fetchOnce(isin: string): Promise<TradegateQuote | null> {
  const res = await fetch(
    `https://www.tradegate.de/refresh.php?isin=${encodeURIComponent(isin)}`,
    { headers: { "User-Agent": UA }, cache: "no-store" },
  );
  if (!res.ok) return null;
  const text = await res.text();
  let json: RefreshJson;
  try {
    json = JSON.parse(text) as RefreshJson;
  } catch {
    return null;
  }
  return quoteFromJson(json);
}

// Holt einen Kurs über die ISIN, mit einem Wiederholungsversuch
// (Tradegate antwortet gelegentlich kurz leer).
export async function fetchTradegateQuote(
  isin: string,
): Promise<TradegateQuote | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const q = await fetchOnce(isin);
      if (q) return q;
    } catch {
      // nächster Versuch
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

// Läuft eine Liste mit begrenzter Parallelität ab (schont die Quelle).
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const cur = idx++;
      out[cur] = await fn(items[cur]);
    }
  });
  await Promise.all(workers);
  return out;
}

// Holt viele Kurse anhand ihrer ISINs. Rückgabe: Map ISIN -> Quote.
export async function fetchTradegateQuotes(
  isins: string[],
): Promise<Map<string, TradegateQuote>> {
  const result = new Map<string, TradegateQuote>();
  const unique = [...new Set(isins.filter(Boolean))];
  const quotes = await mapWithConcurrency(unique, 6, async (isin) => {
    try {
      return [isin, await fetchTradegateQuote(isin)] as const;
    } catch {
      return [isin, null] as const;
    }
  });
  for (const [isin, q] of quotes) {
    if (q) result.set(isin, q);
  }
  return result;
}
