import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPeriodPerformance } from "@/lib/data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Liefert Zeitraum-Entwicklung + Chart-Reihen (gesamt & je Depot). Wird von der
// UI asynchron nachgeladen, damit die Seiten sofort erscheinen.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const perf = await getPeriodPerformance();
  return NextResponse.json(perf);
}
