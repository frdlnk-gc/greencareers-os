import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPortfolio, getLastPriceUpdate } from "@/lib/data";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Liefert das aggregierte Portfolio (Depots, Positionen, Summen) inkl.
// Zeitpunkt der letzten Kursaktualisierung. Wird vom Client-Store geladen und
// zwischengespeichert, damit Tab-Wechsel sofort sind.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const [portfolio, lastUpdate] = await Promise.all([
    getPortfolio(),
    getLastPriceUpdate(),
  ]);
  return NextResponse.json({ ...portfolio, lastUpdate });
}
