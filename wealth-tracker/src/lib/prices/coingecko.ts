// Krypto-Kurse über die öffentliche CoinGecko-API (direkt in EUR).

export interface CoinPrice {
  priceEur: number;
  changePct: number | null; // 24-Stunden-Veränderung in %
}

// Ruft alle angegebenen Coins in einem Request ab (id -> Preis in EUR).
export async function fetchCoinGeckoPrices(
  ids: string[],
): Promise<Map<string, CoinPrice>> {
  const out = new Map<string, CoinPrice>();
  if (ids.length === 0) return out;

  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${encodeURIComponent(ids.join(","))}` +
    `&vs_currencies=eur&include_24hr_change=true`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return out;

  const json = await res.json();
  for (const id of ids) {
    const row = json?.[id];
    if (row && typeof row.eur === "number") {
      out.set(id, {
        priceEur: row.eur,
        changePct:
          typeof row.eur_24h_change === "number" ? row.eur_24h_change : null,
      });
    }
  }
  return out;
}

// Tägliche EUR-Historie eines Coins (max. 365 Tage auf der freien API).
// Rückgabe: Liste [Datum 'YYYY-MM-DD', Preis in EUR].
export async function fetchCoinGeckoHistory(
  id: string,
  days = 365,
): Promise<[string, number][]> {
  const url =
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart` +
    `?vs_currency=eur&days=${days}&interval=daily`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  const prices: [number, number][] = json?.prices ?? [];
  // Auf einen Wert pro Tag reduzieren (Datum -> letzter Preis des Tages).
  const byDay = new Map<string, number>();
  for (const [ts, price] of prices) {
    const day = new Date(ts).toISOString().slice(0, 10);
    byDay.set(day, price);
  }
  return [...byDay.entries()];
}
