import { NextResponse } from "next/server";
import { fetchSalt, signedHeaders } from "@/lib/prices/boersefrankfurt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// TEMPORÄRE Diagnose: findet den Börse-Frankfurt-Endpoint für Dividenden.
// Öffentlich (unter /api/cron), wird nach der Analyse wieder entfernt.
const BASE = "https://api.boerse-frankfurt.de/v1/data/";

export async function GET(request: Request) {
  const isin =
    new URL(request.url).searchParams.get("isin") || "DE0005552004"; // DHL
  const salt = await fetchSalt();
  if (!salt) return NextResponse.json({ error: "kein salt" }, { status: 500 });

  const candidates = [
    `corporate_action_dividends?isin=${isin}`,
    `corporate_actions?isin=${isin}`,
    `equity_dividends?isin=${isin}`,
    `dividends?isin=${isin}`,
    `dividend_information?isin=${isin}`,
    `equity_key_data?isin=${isin}`,
    `master_data?isin=${isin}`,
    `company_data?isin=${isin}`,
    `equity_master_data?isin=${isin}`,
    `distributions?isin=${isin}`,
    `corporate_action?isin=${isin}`,
    `cash_dividends?isin=${isin}`,
  ];

  const results: Record<string, unknown> = {};
  for (const c of candidates) {
    const url = `${BASE}${c}`;
    try {
      const res = await fetch(url, {
        headers: signedHeaders(url, salt),
        cache: "no-store",
      });
      const text = await res.text();
      results[c] = { status: res.status, sample: text.slice(0, 400) };
    } catch (e) {
      results[c] = { error: e instanceof Error ? e.message : String(e) };
    }
  }
  return NextResponse.json({ isin, results });
}
