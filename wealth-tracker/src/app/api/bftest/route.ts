import { NextResponse } from "next/server";
import { fetchSalt, bfRawProbe } from "@/lib/prices/boersefrankfurt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const salt = await fetchSalt();
  const asml = await bfRawProbe("NL0010273215");
  return NextResponse.json({ saltFound: !!salt, asml });
}
