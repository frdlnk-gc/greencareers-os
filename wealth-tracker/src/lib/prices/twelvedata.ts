// Historische Tageskurse über Twelve Data (Gratis-Tarif: US-Aktien,
// 800 Anfragen/Tag, 8/Minute). Für den Verlaufs-Chart der US-Aktien.

export interface TdBar {
  date: string; // YYYY-MM-DD
  close: number; // in USD
}

// Tägliche Schlusskurse (USD) für ein US-Symbol.
export async function fetchTwelveDataHistory(
  symbol: string,
  apiKey: string,
  outputsize = 800,
): Promise<[string, number][]> {
  if (!apiKey) return [];
  const url =
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}` +
    `&interval=1day&outputsize=${outputsize}&apikey=${encodeURIComponent(apiKey)}`;
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const json = (await res.json().catch(() => null)) as {
    values?: { datetime: string; close: string }[];
    status?: string;
  } | null;
  const values = json?.values ?? [];
  return values
    .map((v) => [v.datetime, Number(v.close)] as [string, number])
    .filter(([, c]) => Number.isFinite(c));
}
