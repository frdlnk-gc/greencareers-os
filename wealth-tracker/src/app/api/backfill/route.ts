import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshHistory } from "@/lib/prices/refresh";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Füllt die Kurs-Historie für Charts/Zeiträume nach. Wird von der App im
// Hintergrund aufgerufen (der Nutzer wartet nicht darauf). Läuft nur mit
// angemeldeter Session (RLS).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  try {
    const result = await refreshHistory(supabase);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
