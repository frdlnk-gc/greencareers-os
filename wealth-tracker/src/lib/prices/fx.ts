// Live-Wechselkurse (EZB-Referenz über Frankfurter, gratis, ohne Key) mit
// Server-Cache. Basis EUR: rate = Einheiten der Währung pro 1 EUR
// (z. B. USD 1,08 => 1 EUR = 1,08 US$). Damit werden Einstandskosten und
// Dividenden in Fremdwährung korrekt in EUR umgerechnet.

// Häufigste Handelswährungen für deutsche Anleger (Auswahl im UI).
export const TRADE_CURRENCIES = [
  "EUR",
  "USD",
  "CAD",
  "GBP",
  "CHF",
  "JPY",
  "HKD",
  "SEK",
  "DKK",
  "NOK",
  "AUD",
  "NZD",
  "SGD",
  "CNY",
  "PLN",
  "CZK",
  "ZAR",
];

// Statischer Notnagel – nur, falls die Live-Abfrage scheitert UND die
// fx_rates-Tabelle nichts liefert. Grobe Richtwerte, werden von Live/DB
// überschrieben, sobald verfügbar.
export const FX_FALLBACK: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  CAD: 1.47,
  GBP: 0.85,
  CHF: 0.95,
  JPY: 170,
  HKD: 8.5,
  SEK: 11.3,
  DKK: 7.46,
  NOK: 11.6,
  AUD: 1.63,
  NZD: 1.78,
  SGD: 1.45,
  CNY: 7.8,
  PLN: 4.3,
  CZK: 25,
  ZAR: 20,
};

let cache: { rates: Record<string, number>; at: number } | null = null;
let inflight: Promise<Record<string, number>> | null = null;
const TTL = 60 * 60 * 1000; // 1 Stunde – Kurse ändern sich nur langsam

// Liefert alle verfügbaren EZB-Kurse (Einheiten pro 1 EUR), inkl. EUR = 1.
// Server-seitig gecacht (pro Lambda-Instanz), damit nicht jede Anfrage die
// externe API trifft. Fällt bei Fehlern auf den letzten Cache zurück.
export async function getLiveFxRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.at < TTL) return cache.rates;
  if (inflight) return inflight;
  inflight = fetch("https://api.frankfurter.app/latest?from=EUR", {
    cache: "no-store",
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { rates?: Record<string, number> } | null) => {
      inflight = null;
      const rates: Record<string, number> = { EUR: 1 };
      for (const [k, v] of Object.entries(j?.rates ?? {})) {
        if (typeof v === "number" && v > 0) rates[k] = v;
      }
      if (Object.keys(rates).length > 1) {
        cache = { rates, at: Date.now() };
        return rates;
      }
      return cache?.rates ?? {};
    })
    .catch(() => {
      inflight = null;
      return cache?.rates ?? {};
    });
  return inflight;
}

// Rechnet einen Betrag aus einer Fremdwährung in EUR um.
export function toEur(
  amount: number,
  currency: string | null | undefined,
  fxRates: Record<string, number>,
): number {
  if (!currency || currency === "EUR") return amount;
  const rate = fxRates[currency];
  if (!rate || rate <= 0) return amount; // unbekannte Währung: 1:1 (kein Absturz)
  return amount / rate;
}

// Baut die zu verwendende Kurstabelle: Fallback < DB-Seed < Live (Live gewinnt).
export function mergeFxRates(
  dbRows: { quote: string; rate: number }[] | null | undefined,
  live: Record<string, number>,
): Record<string, number> {
  const rates: Record<string, number> = { ...FX_FALLBACK };
  for (const row of dbRows ?? []) {
    if (row?.quote && typeof row.rate === "number" && row.rate > 0) {
      rates[row.quote] = row.rate;
    }
  }
  Object.assign(rates, live);
  return rates;
}
