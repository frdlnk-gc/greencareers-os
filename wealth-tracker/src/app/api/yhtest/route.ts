import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36";

async function probe(name: string, url: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
    const text = await res.text();
    return { name, status: res.status, len: text.length, snippet: text.slice(0, 160).replace(/\s+/g, " ") };
  } catch (e) {
    return { name, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET() {
  const results = await Promise.all([
    // Stooq historische CSV (weltweit).
    probe("stooq_aapl_us", "https://stooq.com/q/d/l/?s=aapl.us&i=d"),
    probe("stooq_asml_nl", "https://stooq.com/q/d/l/?s=asml.nl&i=d"),
    probe("stooq_mc_fr", "https://stooq.com/q/d/l/?s=mc.fr&i=d"),
    probe("stooq_novob_dk", "https://stooq.com/q/d/l/?s=novo-b.dk&i=d"),
    probe("stooq_0669_hk", "https://stooq.com/q/d/l/?s=0669.hk&i=d"),
  ]);
  return NextResponse.json({ results });
}
