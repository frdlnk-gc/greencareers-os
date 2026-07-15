// Historische Tageskurse über die Börse-Frankfurt-API (api.boerse-frankfurt.de).
// Deckt praktisch alle an Xetra/Frankfurt/Tradegate handelbaren Titel ab —
// also ALLE Aktien dieses Depots (US, Europa, Asien) — direkt in EURO.
// Gratis. Die API verlangt signierte Header (Algorithmus aus bf4py):
//   x-client-traceid = md5(utcIsoZeit + url + salt)
//   x-security       = md5(Zeit "YYYYMMDDHHmm" in Europe/Berlin)
//   client-date      = utcIsoZeit
// Wichtig: KEIN origin/referer auf www.boerse-frankfurt.de setzen (führt zu 403).
// Der salt wird dynamisch aus der main.js der Website gezogen.

import { createHash } from "crypto";

const BASE = "https://api.boerse-frankfurt.de/v1/data/";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36";

let cachedSalt: { value: string; at: number } | null = null;

function md5(s: string): string {
  return createHash("md5").update(s, "utf8").digest("hex");
}

// Aktuelle Zeit in Europe/Berlin als "YYYYMMDDHHmm" (für x-security).
function berlinStamp(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}`;
}

// Holt (und cached) den salt aus der main.js der Website.
export async function fetchSalt(): Promise<string | null> {
  if (cachedSalt && Date.now() - cachedSalt.at < 6 * 3600 * 1000) {
    return cachedSalt.value;
  }
  try {
    const home = await fetch("https://www.boerse-frankfurt.de/", {
      headers: { "User-Agent": UA },
      cache: "no-store",
    });
    const html = await home.text();
    const jsFiles = [
      ...html.matchAll(/(?:src|href)="([^"]*?main[^"]*?\.js)"/g),
    ].map((m) => m[1]);
    for (const rel of jsFiles) {
      const jsUrl = rel.startsWith("http")
        ? rel
        : `https://www.boerse-frankfurt.de/${rel.replace(/^\//, "")}`;
      const jsRes = await fetch(jsUrl, {
        headers: { "User-Agent": UA },
        cache: "no-store",
      });
      const js = await jsRes.text();
      const m = /salt:"(\w+)"/.exec(js);
      if (m) {
        cachedSalt = { value: m[1], at: Date.now() };
        return m[1];
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

// Signierte Header (minimal – kein origin/referer!).
export function signedHeaders(url: string, salt: string): Record<string, string> {
  const iso = new Date().toISOString();
  return {
    accept: "application/json, text/plain, */*",
    "client-date": iso,
    "x-client-traceid": md5(iso + url + salt),
    "x-security": md5(berlinStamp()),
  };
}

async function historyForMic(
  isin: string,
  mic: string,
  salt: string,
  fromDate: string,
  toDate: string,
): Promise<[string, number][]> {
  const params = new URLSearchParams({
    isin,
    mic,
    minDate: fromDate,
    maxDate: toDate,
    limit: "1000",
    offset: "0",
    cleanSplit: "false",
    cleanPayout: "false",
    cleanSubscriptionRights: "false",
  });
  const url = `${BASE}price_history?${params.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: signedHeaders(url, salt), cache: "no-store" });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const json = (await res.json().catch(() => null)) as {
    data?: { date: string; close: number }[];
  } | null;
  const data = json?.data ?? [];
  return data
    .filter((d) => typeof d.close === "number" && d.close > 0)
    .map((d) => [d.date.slice(0, 10), d.close] as [string, number]);
}

// Historische Tagesschlusskurse (EUR) für eine ISIN. Probiert die deutschen
// Handelsplätze der Reihe nach durch (Xetra, Frankfurt, Tradegate).
export async function fetchBfHistory(
  isin: string,
  fromDate?: string,
): Promise<[string, number][]> {
  const salt = await fetchSalt();
  if (!salt) return [];
  const from =
    fromDate ?? new Date(Date.now() - 1500 * 86400000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  for (const mic of ["XETR", "XFRA", "TGAT"]) {
    const series = await historyForMic(isin, mic, salt, from, to);
    if (series.length >= 5) return series;
  }
  return [];
}

export interface BfQuote {
  price: number; // aktueller Kurs in EUR
  changePct: number | null; // Tagesveränderung vs. Vortagesschluss
  prevClose: number | null;
}

// Aktueller Kurs + akkurate Tagesveränderung (EUR) aus den letzten Tagesbars
// von Börse Frankfurt/Xetra — zuverlässiger als Tradegate bei illiquiden Titeln.
export async function fetchBfQuote(isin: string): Promise<BfQuote | null> {
  const salt = await fetchSalt();
  if (!salt) return null;
  const from = new Date(Date.now() - 12 * 86400000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  for (const mic of ["XETR", "XFRA", "TGAT"]) {
    const series = await historyForMic(isin, mic, salt, from, to);
    if (series.length === 0) continue;
    // Nach Datum absteigend sortieren: [0] = aktuell, [1] = Vortag.
    const sorted = [...series].sort((a, b) => (a[0] < b[0] ? 1 : -1));
    const price = sorted[0][1];
    const prevClose = sorted[1]?.[1] ?? null;
    const changePct =
      prevClose && prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : null;
    return { price, changePct, prevClose };
  }
  return null;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (x: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const cur = i++;
      out[cur] = await fn(items[cur]);
    }
  });
  await Promise.all(workers);
  return out;
}

// Holt Live-Kurse (EUR) für viele ISINs. Rückgabe: Map ISIN -> Quote.
export async function fetchBfQuotes(
  isins: string[],
): Promise<Map<string, BfQuote>> {
  const out = new Map<string, BfQuote>();
  const unique = [...new Set(isins.filter(Boolean))];
  const results = await mapLimit(unique, 6, async (isin) => {
    try {
      return [isin, await fetchBfQuote(isin)] as const;
    } catch {
      return [isin, null] as const;
    }
  });
  for (const [isin, q] of results) if (q) out.set(isin, q);
  return out;
}
