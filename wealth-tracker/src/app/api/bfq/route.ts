import { NextResponse } from "next/server";
import { fetchBfQuotes } from "@/lib/prices/boersefrankfurt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Temporär: prüft die Börse-Frankfurt-Live-Kurse (Kurs + Tagesveränderung).
export async function GET() {
  const map = {
    ASML: "NL0010273215",
    "Constellation Software": "CA21037X1006",
    Apple: "US0378331005",
    "Novo Nordisk": "DK0062498333",
    Techtronic: "HK0669013440",
    "Shin-Etsu": "JP3371200001",
    Microsoft: "US5949181045",
  };
  const quotes = await fetchBfQuotes(Object.values(map));
  const out: Record<string, unknown> = {};
  for (const [name, isin] of Object.entries(map)) {
    const q = quotes.get(isin);
    out[name] = q
      ? { price: q.price, changePct: q.changePct?.toFixed(2), prevClose: q.prevClose }
      : null;
  }
  return NextResponse.json(out);
}
