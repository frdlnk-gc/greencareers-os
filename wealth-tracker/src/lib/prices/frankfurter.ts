// Wechselkurse über Frankfurter (frankfurter.app) — gratis, ohne Key,
// vom Server erreichbar. Basiert auf EZB-Referenzkursen.

// Historische Tages-Wechselkurse einer Währung -> EUR (z. B. USD->EUR).
// Rückgabe: sortierte Liste [Datum(ms), EUR pro 1 Einheit]. Für die
// EUR-Umrechnung historischer US-Kurse.
export async function fetchFrankfurterSeriesToEur(
  from: string,
  startDate: string,
): Promise<[number, number][]> {
  if (from === "EUR") return [];
  const url = `https://api.frankfurter.app/${startDate}..?from=${from}&to=EUR`;
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const json = (await res.json().catch(() => null)) as {
    rates?: Record<string, { EUR?: number }>;
  } | null;
  const rates = json?.rates ?? {};
  const out: [number, number][] = [];
  for (const [date, obj] of Object.entries(rates)) {
    if (typeof obj.EUR === "number") out.push([new Date(date).getTime(), obj.EUR]);
  }
  out.sort((a, b) => a[0] - b[0]);
  return out;
}

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
