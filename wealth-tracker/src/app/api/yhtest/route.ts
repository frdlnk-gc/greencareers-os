import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36";

async function probe(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
    const text = await res.text();
    let points = 0;
    let currency = null;
    try {
      const j = JSON.parse(text);
      const r = j?.chart?.result?.[0];
      points = r?.timestamp?.length ?? 0;
      currency = r?.meta?.currency ?? null;
    } catch {
      /* ignore */
    }
    return { symbol, status: res.status, points, currency, snippet: text.slice(0, 120) };
  } catch (e) {
    return { symbol, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET() {
  const results = await Promise.all([
    probe("AAPL"),
    probe("ASML.AS"),
    probe("0669.HK"),
    probe("NOVO-B.CO"),
  ]);
  return NextResponse.json({ results });
}
