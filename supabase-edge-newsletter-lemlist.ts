// =========================================================
// Supabase Edge Function: newsletter-lemlist
// Bindeglied GreenCareers-Newsletter <-> Lemlist (nur GC-Team / gc_admin).
//
// WAS DIESE FUNCTION TUT (Modell: "Kampagnen mappen + Leads einschleusen"):
//  - test:               prueft, ob der Lemlist-API-Key funktioniert (GET /team)
//  - campaigns:          listet die Lemlist-Kampagnen (id + name) fuers Mapping
//  - enroll:             schleust noch nicht synchronisierte, aktive Abonnenten
//                        in ihre gemappte Lemlist-Kampagne ein (POST lead) und
//                        schreibt lemlist_lead_id/status/synced_at zurueck
//  - sync_unsubscribes:  meldet in Supabase abgemeldete Adressen auch in Lemlist
//                        global ab (POST /unsubscribes/:email)
//
//  Der eigentliche VERSAND laeuft in Lemlist (die dort angelegten Kampagnen).
//  Diese Function verschickt selbst KEINE Mails – sie ordnet nur die richtigen
//  Leads der richtigen Kampagne zu (nach Zielgruppe + Branche + Leadmagnet).
//
// WARUM Server-Proxy (Architektur-Constraint):
//  Der LEMLIST_API_KEY und der SERVICE_ROLE_KEY duerfen NIEMALS im Browser
//  liegen (das Dashboard ist statisch). Beide liegen als Supabase-Secret; nur
//  diese Function spricht mit Lemlist und liest/aktualisiert die Abonnenten.
//
// DEPLOY (im Supabase-Projekt "GreenCareers OS"):
//   1) Secrets setzen:
//        supabase secrets set LEMLIST_API_KEY=xxxxxxxxxxxxxxxx
//        supabase secrets set SB_SERVICE_ROLE_KEY=eyJ...service_role   (falls noch nicht da)
//      (SUPABASE_URL + SUPABASE_ANON_KEY sind in der Edge-Runtime automatisch da.)
//   2) Function deployen (Verify-JWT bleibt AN – wir pruefen zusaetzlich gc_admin):
//        supabase functions deploy newsletter-lemlist
//
// LEMLIST-API-ENDPUNKTE (bei Bedarf hier zentral anpassen):
//   Basis:            https://api.lemlist.com/api
//   Auth:             Basic base64(":" + LEMLIST_API_KEY)   (leerer User, Key = Passwort)
//   Kampagnen listen: GET  /campaigns
//   Lead einschleusen:POST /campaigns/{campaignId}/leads/{email}?deduplicate=true
//   Global abmelden:  POST /unsubscribes/{email}
//   Verbindungstest:  GET  /team
// =========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE =
  Deno.env.get("SB_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const LEMLIST_API_KEY = Deno.env.get("LEMLIST_API_KEY") ?? "";

const LEMLIST_BASE = "https://api.lemlist.com/api";
// Lemlist-Auth: Basic-Auth, leerer Username, API-Key als Passwort.
const LEMLIST_AUTH = "Basic " + btoa(":" + LEMLIST_API_KEY);

// --- CORS (Dashboard-Domains + lokale Vorschau) ---
const ALLOW_ORIGINS = [
  "https://os.green-careers.de",
  "https://tracking.green-careers.de",
  "https://dashboard.green-careers.de",
  "http://localhost:4338",
  "http://localhost:5173",
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

// Kleiner Lemlist-Fetch-Wrapper (gibt {ok, status, data} zurueck, wirft nicht).
async function lemlist(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(LEMLIST_BASE + path, {
      method,
      headers: {
        "Authorization": LEMLIST_AUTH,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data: any = null;
    const txt = await res.text();
    try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: String(e) };
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405, cors);

  if (!LEMLIST_API_KEY) {
    return json({ error: "no_lemlist_key", message: "LEMLIST_API_KEY fehlt (supabase secrets set ...)." }, 500, cors);
  }

  // --- 1) Aufrufer-JWT pruefen + gc_admin erzwingen ---
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "no_auth" }, 401, cors);

  const asCaller = createClient(SB_URL, SB_ANON, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: "invalid_token" }, 401, cors);

  const admin = createClient(SB_URL, SB_SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: prof } = await admin
    .from("profiles").select("role").eq("id", userRes.user.id).single();
  if (!prof || prof.role !== "gc_admin") {
    return json({ error: "forbidden", message: "Nur GreenCareers-Team (gc_admin)." }, 403, cors);
  }

  // --- 2) Body ---
  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "bad_json" }, 400, cors); }
  const action = String(payload?.action || "").trim();

  // --- Verbindungstest ---
  if (action === "test") {
    const r = await lemlist("GET", "/team");
    return json({ ok: r.ok, status: r.status, team: r.ok ? r.data : undefined, error: r.ok ? undefined : r.data }, r.ok ? 200 : 502, cors);
  }

  // --- Kampagnen listen (fuers Mapping im Cockpit) ---
  if (action === "campaigns") {
    const r = await lemlist("GET", "/campaigns");
    if (!r.ok) return json({ ok: false, status: r.status, error: r.data }, 502, cors);
    const list = Array.isArray(r.data) ? r.data : (r.data?.campaigns ?? []);
    const campaigns = list.map((c: any) => ({ id: c._id ?? c.id, name: c.name ?? c.label ?? c._id }));
    return json({ ok: true, campaigns }, 200, cors);
  }

  // --- Leads in ihre gemappte Kampagne einschleusen ---
  if (action === "enroll") {
    // Auswahl: entweder explizite ids, oder Filter (audience/theme/branche).
    const ids: string[] = Array.isArray(payload?.ids) ? payload.ids : [];
    const limit = Math.min(Math.max(parseInt(payload?.limit ?? "200", 10) || 200, 1), 1000);

    let q = admin.from("newsletter_subscribers")
      .select("id,email,name,audience,theme,branche,lemlist_campaign_id,lemlist_synced_at,status")
      .eq("status", "active")
      .is("lemlist_synced_at", null)
      .not("lemlist_campaign_id", "is", null)
      .limit(limit);

    if (ids.length) {
      q = admin.from("newsletter_subscribers")
        .select("id,email,name,audience,theme,branche,lemlist_campaign_id,lemlist_synced_at,status")
        .in("id", ids).limit(limit);
    } else {
      if (payload?.audience) q = q.eq("audience", String(payload.audience));
      if (payload?.theme)    q = q.eq("theme", String(payload.theme));
      if (payload?.branche)  q = q.eq("branche", String(payload.branche));
    }

    const { data: subs, error: subErr } = await q;
    if (subErr) return json({ error: "db_read", message: subErr.message }, 500, cors);
    if (!subs || !subs.length) return json({ ok: true, enrolled: 0, results: [] }, 200, cors);

    const results: any[] = [];
    let enrolled = 0;
    for (const s of subs) {
      if (!s.lemlist_campaign_id) { results.push({ id: s.id, ok: false, error: "no_campaign" }); continue; }
      const email = String(s.email).toLowerCase();
      const [firstName, ...rest] = String(s.name || "").trim().split(/\s+/);
      const leadBody: Record<string, unknown> = {
        firstName: firstName || undefined,
        lastName: rest.join(" ") || undefined,
        // Custom-Felder in Lemlist fuer die Personalisierung der Mail:
        audience: s.audience,
        branche: s.branche || undefined,
        theme: s.theme || undefined,
      };
      const r = await lemlist(
        "POST",
        `/campaigns/${encodeURIComponent(s.lemlist_campaign_id)}/leads/${encodeURIComponent(email)}?deduplicate=true`,
        leadBody,
      );
      if (r.ok) {
        enrolled++;
        const leadId = r.data?._id ?? r.data?.id ?? null;
        await admin.from("newsletter_subscribers").update({
          lemlist_lead_id: leadId, lemlist_status: "enrolled", lemlist_synced_at: new Date().toISOString(),
        }).eq("id", s.id);
        await admin.from("newsletter_events").insert({
          subscriber_id: s.id, type: "enrolled", lemlist_ref: leadId,
          meta: { campaign: s.lemlist_campaign_id },
        });
        results.push({ id: s.id, ok: true, lemlist_lead_id: leadId });
      } else {
        await admin.from("newsletter_subscribers").update({
          lemlist_status: "error",
        }).eq("id", s.id);
        await admin.from("newsletter_events").insert({
          subscriber_id: s.id, type: "sync_error", detail: `lemlist ${r.status}`,
          meta: { campaign: s.lemlist_campaign_id, error: r.data },
        });
        results.push({ id: s.id, ok: false, status: r.status, error: r.data });
      }
    }
    return json({ ok: true, enrolled, total: subs.length, results }, 200, cors);
  }

  // --- In Supabase Abgemeldete auch in Lemlist global abmelden ---
  if (action === "sync_unsubscribes") {
    const limit = Math.min(Math.max(parseInt(payload?.limit ?? "200", 10) || 200, 1), 1000);
    // Abgemeldete, die in Lemlist noch nicht als abgemeldet markiert sind.
    const { data: subs, error } = await admin.from("newsletter_subscribers")
      .select("id,email,lemlist_status")
      .eq("status", "unsubscribed")
      .neq("lemlist_status", "unsubscribed")
      .limit(limit);
    if (error) return json({ error: "db_read", message: error.message }, 500, cors);
    if (!subs || !subs.length) return json({ ok: true, unsubscribed: 0 }, 200, cors);

    let n = 0;
    for (const s of subs) {
      const r = await lemlist("POST", `/unsubscribes/${encodeURIComponent(String(s.email).toLowerCase())}`);
      if (r.ok || r.status === 409 /* schon abgemeldet */) {
        n++;
        await admin.from("newsletter_subscribers").update({ lemlist_status: "unsubscribed" }).eq("id", s.id);
      }
    }
    return json({ ok: true, unsubscribed: n, total: subs.length }, 200, cors);
  }

  return json({ error: "unknown_action", message: "action muss test|campaigns|enroll|sync_unsubscribes sein." }, 400, cors);
});
