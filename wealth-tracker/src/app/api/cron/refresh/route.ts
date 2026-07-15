import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { refreshPrices } from "@/lib/prices/refresh";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Automatische Kursaktualisierung per Vercel-Cron (täglich; Hobby-Plan erlaubt
// nur einen Lauf pro Tag). Intraday aktualisiert die App zusätzlich beim Öffnen.
// Schreibt für alle Instrumente die aktuellen Kurse. Braucht dafür den
// Service-Role-Key (umgeht RLS), da kein Nutzer angemeldet ist.
//
// Ohne gesetzten Service-Key passiert nichts Schädliches — der Endpunkt meldet
// nur, dass die automatische Aktualisierung noch nicht konfiguriert ist.
// (Die App aktualisiert die Kurse ohnehin automatisch beim Öffnen.)
export async function GET(request: Request) {
  // Absicherung: nur mit korrektem Secret (von Vercel-Cron gesendet).
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Nicht berechtigt." }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({
      ok: false,
      note: "Automatische Server-Aktualisierung nicht konfiguriert (SUPABASE_SERVICE_ROLE_KEY fehlt). Die App aktualisiert Kurse automatisch beim Öffnen.",
    });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const result = await refreshPrices(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
