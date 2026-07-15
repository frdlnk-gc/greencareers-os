import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWealthSeries } from "@/lib/data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Liefert die Vermögens-Zeitreihen (Wert + Performance je Scope: Gesamt & je
// Depot). Wird von der UI asynchron nachgeladen.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const data = await getWealthSeries();
  return NextResponse.json(data);
}
