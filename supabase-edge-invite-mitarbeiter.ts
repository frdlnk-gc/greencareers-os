// =========================================================
// Supabase Edge Function: invite-mitarbeiter
// Arbeitgeber laedt einen Mitarbeiter per E-Mail in das GreenCareers OS ein.
//
// WARUM diese Datei (Architektur-Constraint):
//  Das eigentliche Verschicken einer Einladungs-Mail laeuft ueber
//  auth.admin.inviteUserByEmail(). Diese Admin-API braucht den SERVICE_ROLE-Key
//  und darf NIEMALS im Browser (index.html liegt statisch auf GitHub Pages)
//  liegen. Loesung: dieser Server-Proxy. Der Service-Role-Key liegt als
//  Supabase-Secret, nur diese Function darf einladen.
//
//  Ablauf:
//   1) Client (eingeloggter Arbeitgeber) ruft mit seinem JWT diese Function auf
//      und schickt { name, email, position, sys_role }.
//   2) Wir verifizieren das JWT -> holen profile des Aufrufers -> pruefen, dass
//      er Manager (owner/buero/gc_admin) ist und eine customer_id hat.
//   3) Wir legen/aktualisieren die mitarbeiter-Zeile (status 'invited') an.
//   4) Wir verschicken die Einladungs-Mail mit Metadaten
//      { name, role, customer_id, position }. handle_new_user (Schema v9)
//      uebernimmt diese Metadaten beim Erst-Login ins profile.
//
// DEPLOY (im Supabase-Projekt "GreenCareers OS"):
//   1) Secrets setzen (Service-Role-Key NUR hier, nie im Client):
//        supabase secrets set SB_SERVICE_ROLE_KEY=eyJ...service_role
//      (SUPABASE_URL + SUPABASE_ANON_KEY sind in Edge-Runtime automatisch da.)
//   2) Function deployen (Verify-JWT bleibt AN — wir verifizieren zusaetzlich
//      selbst die Manager-Rolle):
//        supabase functions deploy invite-mitarbeiter
//   3) Auth -> URL Configuration: Redirect-URL https://os.green-careers.de
//      (und ggf. http://localhost:4339) freigeben, sonst greift redirectTo nicht.
//   4) Auth -> Email Templates -> "Invite user" anpassen (Branding/Text).
// =========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
// Service-Role-Key: bevorzugt eigenes Secret, sonst der Runtime-Default.
const SB_SERVICE =
  Deno.env.get("SB_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Wohin der eingeladene Mitarbeiter nach Klick im Mail-Link landet.
const DEFAULT_REDIRECT = "https://os.green-careers.de";

// --- CORS (OS-Domain + lokale Vorschau) ---
const ALLOW_ORIGINS = [
  "https://os.green-careers.de",
  "http://localhost:4339",
  "http://localhost:4329",
];
function corsHeaders(origin: string | null) {
  const allow =
    origin && ALLOW_ORIGINS.includes(origin) ? origin : ALLOW_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405, cors);

  // --- 1) Aufrufer-JWT pruefen ---
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "no_auth" }, 401, cors);

  // Client "als der Aufrufer" (anon key + sein JWT) -> wer ruft an?
  const asCaller = createClient(SB_URL, SB_ANON, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: "invalid_token" }, 401, cors);
  const callerId = userRes.user.id;

  // --- 2) Body lesen + validieren ---
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400, cors);
  }
  const name = String(payload?.name || "").trim();
  const email = String(payload?.email || "").trim().toLowerCase();
  const position = String(payload?.position || "").trim();
  const sysRole = payload?.sys_role === "buero" ? "buero" : "mitarbeiter";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "bad_email" }, 400, cors);
  }

  // Admin-Client (Service-Role) — kann RLS umgehen + einladen.
  const admin = createClient(SB_URL, SB_SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- 3) Berechtigung: Aufrufer ist Manager mit customer_id? ---
  const { data: prof, error: profErr } = await admin
    .from("profiles")
    .select("role, customer_id")
    .eq("id", callerId)
    .single();
  if (profErr || !prof) return json({ error: "no_profile" }, 403, cors);

  const isManager = ["owner", "buero", "gc_admin"].includes(prof.role);
  if (!isManager || !prof.customer_id) {
    return json({ error: "forbidden" }, 403, cors);
  }
  const customerId = prof.customer_id as string;

  // --- 4) mitarbeiter-Zeile anlegen/aktualisieren (status invited) ---
  // Vor dem Versand, damit der Datensatz existiert; profile_id wird beim
  // Erst-Login via handle_new_user nicht gesetzt -> wir verknuepfen unten
  // best-effort, wenn der Auth-User schon existiert.
  let maId: string | null = null;
  {
    // Existiert schon ein Datensatz mit dieser E-Mail im Betrieb?
    const { data: existing } = await admin
      .from("mitarbeiter")
      .select("id")
      .eq("customer_id", customerId)
      .ilike("email", email)
      .maybeSingle();

    if (existing?.id) {
      maId = existing.id;
      await admin
        .from("mitarbeiter")
        .update({
          name: name || undefined,
          position: position || undefined,
          sys_role: sysRole,
          status: "invited",
        })
        .eq("id", existing.id);
    } else {
      const { data: ins, error: insErr } = await admin
        .from("mitarbeiter")
        .insert({
          customer_id: customerId,
          name: name || email,
          email,
          position: position || null,
          sys_role: sysRole,
          status: "invited",
        })
        .select("id")
        .single();
      if (insErr) {
        console.error("mitarbeiter insert error", insErr);
        return json({ error: "db_insert" }, 500, cors);
      }
      maId = ins.id;
    }
  }

  // --- 5) Einladungs-Mail verschicken ---
  const redirectTo =
    String(payload?.redirect_to || DEFAULT_REDIRECT).startsWith("http")
      ? String(payload?.redirect_to)
      : DEFAULT_REDIRECT;

  const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        name: name || email,
        role: sysRole, // 'mitarbeiter' | 'buero' -> handle_new_user uebernimmt
        customer_id: customerId,
        position: position || null,
        mitarbeiter_id: maId,
      },
      redirectTo,
    },
  );

  if (invErr) {
    // Haeufig: Nutzer existiert bereits -> kein harter Fehler, Zeile bleibt invited.
    console.error("invite error", invErr);
    const already =
      /already|registered|exists/i.test(invErr.message || "");
    return json(
      {
        ok: false,
        invited: false,
        mitarbeiter_id: maId,
        already_exists: already,
        error: already ? "already_exists" : "invite_failed",
        message: invErr.message,
      },
      already ? 200 : 502,
      cors,
    );
  }

  // Auth-User-ID nachziehen -> mitarbeiter.profile_id verknuepfen (best effort).
  const invitedUserId = inv?.user?.id ?? null;
  if (invitedUserId && maId) {
    await admin
      .from("mitarbeiter")
      .update({ profile_id: invitedUserId })
      .eq("id", maId);
  }

  return json(
    { ok: true, invited: true, mitarbeiter_id: maId, user_id: invitedUserId },
    200,
    cors,
  );
});
