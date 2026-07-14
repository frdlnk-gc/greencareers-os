// Ableitung der Handelswährung aus der Börsen-Endung des Yahoo-Symbols.
// (US-Symbole ohne Endung notieren in USD.)

const CURRENCY: Record<string, string> = {
  "": "USD", // USA
  AS: "EUR", // Amsterdam
  BR: "EUR", // Brüssel
  CO: "DKK", // Kopenhagen
  HE: "EUR", // Helsinki
  ST: "SEK", // Stockholm
  PA: "EUR", // Paris
  L: "GBP", // London (Achtung: teils Pence, siehe fmp.ts)
  DE: "EUR", // Xetra
  SW: "CHF", // Schweiz
  TO: "CAD", // Toronto
  HK: "HKD", // Hongkong
  T: "JPY", // Tokio
  NZ: "NZD", // Neuseeland
};

export function currencyForSymbol(yahooSymbol: string): string {
  const dot = yahooSymbol.lastIndexOf(".");
  const suf = dot === -1 ? "" : yahooSymbol.slice(dot + 1).toUpperCase();
  return CURRENCY[suf] ?? "USD";
}
