import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDividends } from "@/lib/data";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Liefert die Dividenden-Auswertung. Wird von der Analyse-Seite asynchron
// nachgeladen und im Client-Store zwischengespeichert.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const dividends = await getDividends();
  return NextResponse.json(dividends);
}
