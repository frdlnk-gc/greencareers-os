// Wechselkurse über Frankfurter (frankfurter.app) — gratis, ohne Key,
// vom Server erreichbar. Basiert auf EZB-Referenzkursen.

// Liefert Map Währung -> (Einheiten pro 1 EUR), inkl. EUR selbst = 1.
export async function fetchFrankfurterRates(
  currencies: string[],
): Promise<Map<string, number>> {
  const rates = new Map<string, number>([["EUR", 1]]);
  const needed = [...new Set(currencies.filter((c) => c && c !== "EUR"))];
  if (needed.length === 0) return rates;

  const url = `https://api.frankfurter.app/latest?from=EUR&to=${needed.join(",")}`;

  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    return rates;
  }
  if (!res.ok) return rates;

  const json = (await res.json().catch(() => null)) as {
    rates?: Record<string, number>;
  } | null;
  const r = json?.rates ?? {};
  for (const c of needed) {
    if (typeof r[c] === "number" && r[c] > 0) rates.set(c, r[c]);
  }
  return rates;
}
