// Historische Tageskurse über die Börse-Frankfurt-API (api.boerse-frankfurt.de).
// Deckt praktisch alle an Xetra/Frankfurt handelbaren Titel ab — also alle
// Aktien dieses Depots — direkt in EURO. Gratis, aber die API verlangt
// signierte Header (Algorithmus aus dem öffentlichen bf4py-Projekt):
//   X-Client-TraceId = md5(utcIsoZeit + url + salt)
//   X-Security       = md5(lokaleZeit "YYYYMMDDHHmm", Zeitzone Europe/Berlin)
//   Client-Date      = utcIsoZeit
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

// Aktuelle Zeit in Europe/Berlin als "YYYYMMDDHHmm".
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
    const jsFiles = [...html.matchAll(/(?:src|href)="([^"]*?main[^"]*?\.js)"/g)].map(
      (m) => m[1],
    );
    for (const rel of jsFiles) {
      const jsUrl = rel.startsWith("http")
        ? rel
        : `https://www.boerse-frankfurt.de/${rel.replace(/^\//, "")}`;
      const jsRes = await fetch(jsUrl, {
        headers: { "User-Agent": UA },
        cache: "no-store",
      });
      const js = await jsRes.text();
      const m = /salt:"(\w+)"/.exec(js) ?? /salt:\s*"(\w+)"/.exec(js);
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

function headersFor(url: string, salt: string): Record<string, string> {
  const iso = new Date().toISOString(); // z. B. 2026-07-15T08:30:45.123Z
  return {
    "User-Agent": UA,
    Accept: "application/json, text/plain, */*",
    "Client-Date": iso,
    "X-Client-TraceId": md5(iso + url + salt),
    "X-Security": md5(berlinStamp()),
    Origin: "https://www.boerse-frankfurt.de",
    Referer: "https://www.boerse-frankfurt.de/",
  };
}

export interface BfBar {
  date: string; // YYYY-MM-DD
  close: number;
}

function utcStamp(): string {
  const iso = new Date().toISOString(); // YYYY-MM-DDTHH:MM...
  return iso.slice(0, 16).replace(/[-T:]/g, "");
}

// Diagnose: probiert Zeit-/Header-Kombinationen für price_history.
export async function bfRawProbe(isin: string): Promise<unknown> {
  const salt = await fetchSalt();
  if (!salt) return { error: "kein salt" };
  const from = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  const path = `price_history?isin=${isin}&mic=XETR&minDate=${from}&maxDate=${to}&limit=1000&offset=0&cleanSplit=false&cleanPayout=false&cleanSubscriptionRights=false`;
  const url = BASE + path;

  const combos = [
    { name: "berlin+bf", stamp: berlinStamp(), origin: "https://www.boerse-frankfurt.de" },
    { name: "utc+bf", stamp: utcStamp(), origin: "https://www.boerse-frankfurt.de" },
    { name: "berlin+db", stamp: berlinStamp(), origin: "https://live.deutsche-boerse.com" },
    { name: "berlin+min", stamp: berlinStamp(), origin: null },
  ];

  const out: unknown[] = [];
  for (const c of combos) {
    const iso = new Date().toISOString();
    const headers: Record<string, string> = {
      accept: "application/json, text/plain, */*",
      "client-date": iso,
      "x-client-traceid": md5(iso + url + salt),
      "x-security": md5(c.stamp),
    };
    if (c.origin) {
      headers["origin"] = c.origin;
      headers["referer"] = c.origin + "/";
      headers["user-agent"] = UA;
    }
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      const text = await res.text();
      out.push({ combo: c.name, status: res.status, snippet: text.slice(0, 200) });
    } catch (e) {
      out.push({ combo: c.name, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}

// Historische Tagesschlusskurse (EUR) für eine ISIN an Xetra.
export async function fetchBfHistory(
  isin: string,
  mic = "XETR",
  fromDate?: string,
): Promise<[string, number][]> {
  const salt = await fetchSalt();
  if (!salt) return [];
  const from = fromDate ?? new Date(Date.now() - 800 * 86400000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams({
    isin,
    mic,
    minDate: from,
    maxDate: to,
    limit: "1000",
    offset: "0",
    cleanSplit: "false",
    cleanPayout: "false",
    cleanSubscriptionRights: "false",
  });
  const url = `${BASE}price_history?${params.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: headersFor(url, salt), cache: "no-store" });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const json = (await res.json().catch(() => null)) as {
    data?: { date: string; close: number }[];
  } | null;
  const data = json?.data ?? [];
  return data
    .filter((d) => typeof d.close === "number")
    .map((d) => [d.date.slice(0, 10), d.close] as [string, number]);
}
