import { createClient } from "./supabase/server";
import { computePortfolio } from "./portfolio";
import type {
  Account,
  Instrument,
  PortfolioSummary,
  Price,
  Transaction,
} from "./types";

// Lädt alle Portfolio-Daten des angemeldeten Nutzers und berechnet die
// aggregierten Depot- und Gesamtwerte.
export async function getPortfolio(): Promise<PortfolioSummary> {
  const supabase = await createClient();

  const [accountsRes, instrumentsRes, transactionsRes, pricesRes, fxRes] =
    await Promise.all([
      supabase.from("accounts").select("*"),
      supabase.from("instruments").select("*"),
      supabase.from("transactions").select("*"),
      supabase.from("prices").select("*"),
      supabase.from("fx_rates").select("*"),
    ]);

  const accounts = (accountsRes.data ?? []) as Account[];
  const instruments = (instrumentsRes.data ?? []) as Instrument[];
  const transactions = (transactionsRes.data ?? []) as Transaction[];
  const prices = (pricesRes.data ?? []) as Price[];

  const fxRates: Record<string, number> = {};
  for (const row of fxRes.data ?? []) {
    fxRates[(row as { quote: string }).quote] = (row as { rate: number }).rate;
  }

  return computePortfolio({
    accounts,
    instruments,
    transactions,
    prices,
    fxRates,
  });
}
