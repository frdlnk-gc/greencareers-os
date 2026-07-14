// Gemeinsame Typen für Datenbank-Zeilen und abgeleitete Portfolio-Werte.

export type AccountType = "broker" | "crypto" | "cash" | "other";
export type InstrumentKind = "stock" | "etf" | "crypto" | "cash";
export type TransactionType =
  | "buy"
  | "sell"
  | "dividend"
  | "deposit"
  | "withdrawal"
  | "fee";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  sort_order: number;
}

export interface Instrument {
  id: string;
  kind: InstrumentKind;
  name: string;
  display_symbol: string | null;
  yahoo_symbol: string | null;
  coingecko_id: string | null;
  currency: string;
  exchange: string | null;
  logo_url: string | null;
}

export interface Transaction {
  id: string;
  account_id: string;
  instrument_id: string | null;
  type: TransactionType;
  trade_date: string;
  quantity: number | null;
  price: number | null;
  amount: number | null;
  fees: number;
  currency: string;
}

export interface Price {
  instrument_id: string;
  price: number;
  currency: string;
  change_pct_1d: number | null;
  as_of: string;
}

// --- Abgeleitete (berechnete) Werte -----------------------------------------

// Eine Position = ein Instrument in einem Depot, aus Transaktionen berechnet.
export interface Position {
  instrument: Instrument;
  quantity: number; // Nettostückzahl (Käufe − Verkäufe)
  investedEur: number; // eingesetztes Kapital in EUR
  valueEur: number; // aktueller Marktwert in EUR
  changePct1d: number | null; // Tagesveränderung in %
  gainEur: number; // Wertzuwachs seit Kauf in EUR
  gainPct: number | null; // Wertzuwachs seit Kauf in %
}

// Ein Depot inkl. aggregierter Positionen und Summen.
export interface AccountSummary {
  account: Account;
  positions: Position[];
  valueEur: number;
  investedEur: number;
  gainEur: number;
  gainPct: number | null;
  changeEur1d: number; // Tagesveränderung in EUR
  changePct1d: number | null; // Tagesveränderung in %
}

// Gesamtvermögen über alle Depots.
export interface PortfolioSummary {
  accounts: AccountSummary[];
  totalValueEur: number;
  totalInvestedEur: number;
  totalGainEur: number;
  totalGainPct: number | null;
  changeEur1d: number;
  changePct1d: number | null;
}
