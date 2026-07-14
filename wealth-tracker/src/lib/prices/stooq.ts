// Aktienkurse über Stooq (gratis, ohne API-Key, von Servern erreichbar).
// Liefert Schlusskurse in Landeswährung. Symbole werden aus den
// Yahoo-Symbolen abgeleitet (andere Börsen-Endungen).

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36";

// Yahoo-Börsenendung -> { Stooq-Endung, Währung }.
const EXCHANGE: Record<string, { suffix: string; currency: string }> = {
  "": { suffix: "us", currency: "USD" }, // ohne Endung = USA
  AS: { suffix: "nl", currency: "EUR" }, // Amsterdam
  BR: { suffix: "be", currency: "EUR" }, // Brüssel
  CO: { suffix: "dk", currency: "DKK" }, // Kopenhagen
  HE: { suffix: "fi", currency: "EUR" }, // Helsinki
  ST: { suffix: "se", currency: "SEK" }, // Stockholm
  PA: { suffix: "fr", currency: "EUR" }, // Paris
  L: { suffix: "uk", currency: "GBP" }, // London
  DE: { suffix: "de", currency: "EUR" }, // Xetra
  SW: { suffix: "ch", currency: "CHF" }, // Schweiz
  TO: { suffix: "ca", currency: "CAD" }, // Toronto
  HK: { suffix: "hk", currency: "HKD" }, // Hongkong
  T: { suffix: "jp", currency: "JPY" }, // Tokio
  NZ: { suffix: "nz", currency: "NZD" }, // Neuseeland
};

export interface StooqSymbol {
  stooq: string; // z. B. "asml.nl"
  currency: string; // z. B. "EUR"
}

// Wandelt ein Yahoo-Symbol in ein Stooq-Symbol um (oder null, wenn Börse
// unbekannt).
export function toStooqSymbol(yahooSymbol: string): StooqSymbol | null {
  const dot = yahooSymbol.lastIndexOf(".");
  const base = dot === -1 ? yahooSymbol : yahooSymbol.slice(0, dot);
  const suf = dot === -1 ? "" : yahooSymbol.slice(dot + 1).toUpperCase();
  const ex = EXCHANGE[suf];
  if (!ex) return null;
  return { stooq: `${base.toLowerCase()}.${ex.suffix}`, currency: ex.currency };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Ruft Schlusskurse für viele Stooq-Symbole ab (Map: kleingeschriebenes
// Symbol -> Kurs). Funktioniert auch für FX-Paare wie "eurusd".
export async function fetchStooqCloses(
  symbols: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (symbols.length === 0) return out;

  for (const group of chunk(symbols, 20)) {
    const url = `https://stooq.com/q/l/?s=${group.join(",")}&f=sd2t2ohlcv&h&e=csv`;
    let res: Response;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
    } catch {
      continue;
    }
    if (!res.ok) continue;

    const text = await res.text();
    const lines = text.trim().split(/\r?\n/);
    // Kopfzeile: Symbol,Date,Time,Open,High,Low,Close,Volume
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length < 7) continue;
      const sym = cols[0].trim().toLowerCase();
      const close = parseFloat(cols[6]);
      if (sym && Number.isFinite(close) && close > 0) out.set(sym, close);
    }
  }
  return out;
}

// Wechselkurse über Stooq: Map Währung -> (Einheiten pro 1 EUR).
export async function fetchStooqEurRates(
  currencies: string[],
): Promise<Map<string, number>> {
  const rates = new Map<string, number>([["EUR", 1]]);
  const needed = currencies.filter((c) => c && c !== "EUR");
  if (needed.length === 0) return rates;

  const symbols = needed.map((c) => `eur${c.toLowerCase()}`);
  const closes = await fetchStooqCloses(symbols);
  for (const c of needed) {
    const r = closes.get(`eur${c.toLowerCase()}`);
    if (r && r > 0) rates.set(c, r);
  }
  return rates;
}
