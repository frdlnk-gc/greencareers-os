"use client";

import { useEffect, useState } from "react";

// Testet direkt im Browser des Nutzers (Wohn-IP), welche Kursquellen
// erreichbar sind und CORS zulassen. Kein Login nötig.

interface Result {
  name: string;
  ok: boolean;
  info: string;
}

const TARGETS: { name: string; url: string; kind: "json" | "text" }[] = [
  {
    name: "Yahoo US (AAPL)",
    url: "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d",
    kind: "json",
  },
  {
    name: "Yahoo Amsterdam (ASML.AS)",
    url: "https://query1.finance.yahoo.com/v8/finance/chart/ASML.AS?range=1d&interval=1d",
    kind: "json",
  },
  {
    name: "Yahoo Hongkong (0669.HK)",
    url: "https://query1.finance.yahoo.com/v8/finance/chart/0669.HK?range=1d&interval=1d",
    kind: "json",
  },
  {
    name: "Stooq US (aapl.us)",
    url: "https://stooq.com/q/l/?s=aapl.us&f=sd2t2ohlcv&h&e=csv",
    kind: "text",
  },
  {
    name: "Stooq Amsterdam (asml.nl)",
    url: "https://stooq.com/q/l/?s=asml.nl&f=sd2t2ohlcv&h&e=csv",
    kind: "text",
  },
  {
    name: "CoinGecko (Bitcoin)",
    url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur",
    kind: "json",
  },
];

async function check(t: (typeof TARGETS)[number]): Promise<Result> {
  try {
    const res = await fetch(t.url, { cache: "no-store" });
    const body = await res.text();
    const price =
      /regularMarketPrice"?:?\s*([0-9.]+)/i.exec(body)?.[1] ??
      /,([0-9.]+),[0-9]+\s*$/m.exec(body.trim())?.[1] ??
      /"eur":\s*([0-9.]+)/i.exec(body)?.[1] ??
      "";
    return {
      name: t.name,
      ok: res.ok,
      info: `HTTP ${res.status}${price ? ` · Kurs ${price}` : ""} · ${body.slice(0, 60).replace(/\s+/g, " ")}`,
    };
  } catch (e) {
    // Meist CORS-Blockade -> "Failed to fetch"
    return {
      name: t.name,
      ok: false,
      info: `Blockiert: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

export default function BrowserCheck() {
  const [results, setResults] = useState<Result[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const out: Result[] = [];
      for (const t of TARGETS) {
        out.push(await check(t));
        setResults([...out]);
      }
      setDone(true);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <h1 className="mb-1 text-2xl font-bold">Browser-Kurscheck</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Prüft direkt in deinem Browser, welche Kursquellen erreichbar sind.
        {done ? " Fertig." : " Läuft…"}
      </p>
      <ul className="space-y-3">
        {results.map((r) => (
          <li
            key={r.name}
            className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  r.ok ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span className="font-medium">{r.name}</span>
            </div>
            <div className="mt-1 break-all text-xs text-neutral-400">
              {r.info}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
