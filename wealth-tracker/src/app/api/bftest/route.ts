import { NextResponse } from "next/server";
import { fetchSalt, fetchBfHistory } from "@/lib/prices/boersefrankfurt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const salt = await fetchSalt();
  const test = async (isin: string) => {
    const h = await fetchBfHistory(isin);
    return { isin, points: h.length, sample: h.slice(0, 2), last: h.slice(-2) };
  };
  const results = await Promise.all([
    test("NL0010273215"), // ASML
    test("US0378331005"), // Apple
    test("HK0669013440"), // Techtronic (HK)
    test("DK0062498333"), // Novo Nordisk
  ]);
  return NextResponse.json({ saltFound: !!salt, salt: salt?.slice(0, 4) ?? null, results });
}
