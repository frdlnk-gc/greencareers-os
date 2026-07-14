// Kursabruf über die (inoffizielle) Yahoo-Finance-Chart-API.
// Liefert aktuellen Kurs in Landeswährung + Tagesveränderung.

const YAHOO_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36";

export interface YahooQuote {
  price: number; // Kurs in `currency`
  currency: string; // z. B. "USD", "EUR", "GBP"
  changePct: number | null; // Tagesveränderung in %
}

// Ruft einen einzelnen Kurs ab. Wirft bei Netzfehler; gibt null bei
// unbrauchbarer Antwort zurück.
export async function fetchYahooQuote(symbol: string): Promise<YahooQuote | null> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=1d&interval=1d`;

  const res = await fetch(url, {
    headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") return null;

  const raw = meta.regularMarketPrice as number;
  const prevRaw =
    typeof meta.previousClose === "number"
      ? meta.previousClose
      : typeof meta.chartPreviousClose === "number"
        ? meta.chartPreviousClose
        : null;

  // Prozent-Veränderung ist skaleninvariant → aus Rohwerten rechnen.
  const changePct =
    prevRaw && prevRaw > 0 ? ((raw - prevRaw) / prevRaw) * 100 : null;

  // Londoner Werte notieren in Pence (GBp/GBX) → in Pfund normalisieren.
  let price = raw;
  let currency: string = meta.currency ?? "USD";
  if (currency === "GBp" || currency === "GBX") {
    price = raw / 100;
    currency = "GBP";
  }

  return { price, currency, changePct };
}

// Wechselkurs: wie viele Einheiten von `currency` entsprechen 1 EUR.
// (Yahoo-Symbol EURUSD=X liefert USD pro 1 EUR.)
export async function fetchEurRate(currency: string): Promise<number | null> {
  if (currency === "EUR") return 1;
  const q = await fetchYahooQuote(`EUR${currency}=X`);
  return q && q.price > 0 ? q.price : null;
}
