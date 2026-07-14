import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshPrices } from "@/lib/prices/refresh";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Manuelles Aktualisieren: nutzt die Session des angemeldeten Nutzers,
// aktualisiert also nur dessen Instrumente (per RLS abgesichert).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const result = await refreshPrices(supabase);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
