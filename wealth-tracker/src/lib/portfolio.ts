import type {
  Account,
  AccountSummary,
  Instrument,
  PortfolioSummary,
  Position,
  Price,
  Transaction,
} from "./types";

export interface PortfolioInput {
  accounts: Account[];
  instruments: Instrument[];
  transactions: Transaction[];
  prices: Price[];
  fxRates: Record<string, number>; // Währung -> (1 EUR = rate * Währung)
}

// Rechnet einen Betrag aus einer Fremdwährung in EUR um.
function toEur(amount: number, currency: string, fxRates: Record<string, number>): number {
  if (!currency || currency === "EUR") return amount;
  const rate = fxRates[currency];
  if (!rate || rate <= 0) return amount; // Fallback: unbekannte Währung 1:1
  return amount / rate;
}

// Baut aus Transaktionen + Kursen die aggregierten Depot- und Gesamtwerte.
// Positionen werden nach Durchschnittskosten bewertet.
export function computePortfolio(input: PortfolioInput): PortfolioSummary {
  const { accounts, instruments, transactions, prices, fxRates } = input;

  const instrumentById = new Map(instruments.map((i) => [i.id, i]));
  const priceByInstrument = new Map(prices.map((p) => [p.instrument_id, p]));

  const allSummaries: AccountSummary[] = accounts
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .map((account) => {
      const accountTx = transactions.filter((t) => t.account_id === account.id);

      // Transaktionen je Instrument sammeln.
      const byInstrument = new Map<string, Transaction[]>();
      let cashEur = 0;

      for (const tx of accountTx) {
        if (tx.type === "deposit") {
          cashEur += toEur(tx.amount ?? 0, tx.currency, fxRates);
          continue;
        }
        if (tx.type === "withdrawal") {
          cashEur -= toEur(tx.amount ?? 0, tx.currency, fxRates);
          continue;
        }
        if (!tx.instrument_id) continue;
        const list = byInstrument.get(tx.instrument_id) ?? [];
        list.push(tx);
        byInstrument.set(tx.instrument_id, list);
      }

      const positions: Position[] = [];

      for (const [instrumentId, txs] of byInstrument) {
        const instrument = instrumentById.get(instrumentId);
        if (!instrument) continue;

        let buyQty = 0;
        let buyCostEur = 0; // Kaufkosten inkl. Gebühren in EUR
        let netQty = 0;

        for (const tx of txs) {
          const q = tx.quantity ?? 0;
          if (tx.type === "buy") {
            const costEur =
              toEur((tx.price ?? 0) * q, tx.currency, fxRates) +
              toEur(tx.fees ?? 0, tx.currency, fxRates);
            buyQty += q;
            buyCostEur += costEur;
            netQty += q;
          } else if (tx.type === "sell") {
            netQty -= q;
          }
        }

        if (netQty <= 0.0000001) continue; // keine offene Position mehr

        const avgCostEur = buyQty > 0 ? buyCostEur / buyQty : 0;
        const investedEur = avgCostEur * netQty;

        const price = priceByInstrument.get(instrumentId);
        const priceEur = price
          ? toEur(price.price, price.currency, fxRates)
          : avgCostEur; // ohne Kurs: mit Einstand bewerten
        const valueEur = priceEur * netQty;

        const changePct1d = price?.change_pct_1d ?? null;
        const changeEur1d =
          changePct1d !== null
            ? valueEur - valueEur / (1 + changePct1d / 100)
            : 0;

        const gainEur = valueEur - investedEur;
        const gainPct = investedEur > 0 ? (gainEur / investedEur) * 100 : null;

        positions.push({
          instrument,
          quantity: netQty,
          investedEur,
          valueEur,
          changePct1d,
          gainEur,
          gainPct,
        });
      }

      positions.sort((a, b) => b.valueEur - a.valueEur);

      const investedEur =
        positions.reduce((s, p) => s + p.investedEur, 0) + Math.max(cashEur, 0);
      const valueEur = positions.reduce((s, p) => s + p.valueEur, 0) + cashEur;
      const changeEur1d = positions.reduce(
        (s, p) =>
          s +
          (p.changePct1d !== null
            ? p.valueEur - p.valueEur / (1 + p.changePct1d / 100)
            : 0),
        0,
      );
      const prevValue = valueEur - changeEur1d;
      const changePct1d = prevValue > 0 ? (changeEur1d / prevValue) * 100 : null;
      const gainEur = valueEur - investedEur;
      const gainPct = investedEur > 0 ? (gainEur / investedEur) * 100 : null;

      return {
        account,
        positions,
        valueEur,
        investedEur,
        gainEur,
        gainPct,
        changeEur1d,
        changePct1d,
      };
    });

  // Investment-Depots (broker/crypto) vs. weitere Werte (cash/other).
  const accountSummaries = allSummaries.filter(
    (a) => a.account.type === "broker" || a.account.type === "crypto",
  );
  const otherAccounts = allSummaries.filter(
    (a) => a.account.type === "cash" || a.account.type === "other",
  );

  // Investitionen (Wertpapiere/Krypto).
  const investmentsValueEur = accountSummaries.reduce((s, a) => s + a.valueEur, 0);
  const totalInvestedEur = accountSummaries.reduce((s, a) => s + a.investedEur, 0);
  const changeEur1d = accountSummaries.reduce((s, a) => s + a.changeEur1d, 0);
  const prevTotal = investmentsValueEur - changeEur1d;
  const changePct1d = prevTotal > 0 ? (changeEur1d / prevTotal) * 100 : null;
  const totalGainEur = investmentsValueEur - totalInvestedEur;
  const totalGainPct =
    totalInvestedEur > 0 ? (totalGainEur / totalInvestedEur) * 100 : null;

  // Weitere Werte (Cash, Verbindlichkeiten, Sonstiges) — Verbindlichkeiten sind negativ.
  const otherAssetsEur = otherAccounts.reduce((s, a) => s + a.valueEur, 0);

  // Gesamtvermögen = Investitionen + weitere Werte.
  const totalValueEur = investmentsValueEur + otherAssetsEur;

  return {
    accounts: accountSummaries,
    otherAccounts,
    totalValueEur,
    investmentsValueEur,
    otherAssetsEur,
    totalInvestedEur,
    totalGainEur,
    totalGainPct,
    changeEur1d,
    changePct1d,
  };
}
