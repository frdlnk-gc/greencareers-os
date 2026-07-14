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
