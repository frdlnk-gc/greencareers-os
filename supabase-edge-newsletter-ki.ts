// =========================================================
// Supabase Edge Function: newsletter-ki
// KI-Texter fuer den GreenCareers-Newsletter (nur GC-Team / gc_admin).
//
// WAS DIESE FUNCTION TUT:
//  Erzeugt einen fertigen Newsletter-Entwurf (Betreff + 2 Betreff-Varianten,
//  Preheader, HTML-Body, Text-Body) – zielgruppen- und branchenspezifisch:
//    audience = b2b_neukunde | b2b_bestandskunde | bewerber
//    theme    = galabau | tiefbau | landwirtschaft   (optional)
//    branche  = konkrete Sub-Branche                 (optional)
//    topic    = optionaler Themen-/Anlass-Hinweis von dir (Freitext)
//  Du liest drueber, passt an und gibst frei – dann geht der Text nach Lemlist.
//
//  Ton & Marke sind je Zielgruppe unterschiedlich hinterlegt: B2B = "Sie",
//  seriös, Nutzen fuer den Betrieb; Bewerber = "du", motivierend, Recruiting.
//  Kein Emoji-Spam, kein Buzzword-Bingo, "Karrierenetzwerk" statt "Jobboerse".
//
// WARUM Server-Proxy: Der ANTHROPIC_API_KEY darf nicht im Browser liegen.
//  (Gleiches Muster wie kalk-ki / maya-chat.)
//
// DEPLOY:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   (falls noch nicht da)
//   supabase functions deploy newsletter-ki
//
// MODELL: claude-sonnet-4-6 (gute Text-/Markenqualitaet, wie kalk-ki).
// =========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = "claude-sonnet-4-6";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SB_SERVICE =
  Deno.env.get("SB_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

const AUDIENCE_BRIEF: Record<string, string> = {
  b2b_neukunde: `ZIELGRUPPE: potenzielle B2B-Kunden – Inhaber/Personalverantwortliche von Betrieben, die GreenCareers noch NICHT gebucht haben.
ANSPRACHE: "Sie", seriös, bodenständig, auf Augenhöhe mit dem Handwerk.
ZIEL DER MAIL: Vertrauen aufbauen + zeigen, dass GreenCareers ihr Fachkräfte-Problem plan- und messbar löst. Sanfter Call-to-Action zu einem kostenlosen Erstgespräch.
INHALT-MIX: 1 informativer/branchennaher Aufhänger (echter Nutzen, z.B. Fachkräftemangel, Recruiting-Trend, saisonale Planung), dann Brücke zu GreenCareers, dann EIN klarer nächster Schritt.`,
  b2b_bestandskunde: `ZIELGRUPPE: bestehende zahlende B2B-Kunden (Betriebe, die GreenCareers bereits nutzen).
ANSPRACHE: "Sie", partnerschaftlich, wertschätzend.
ZIEL DER MAIL: Bindung + mehr Wert aus der Zusammenarbeit ziehen. Tipps, wie sie mehr/bessere Bewerber bekommen, neue Funktionen, Erfolgsgeschichten, ggf. dezenter Upsell (weitere Stellen, höheres Paket).
INHALT-MIX: konkreter Praxis-Tipp oder Neuigkeit, die IHNEN sofort hilft; kein plumpes Verkaufen, sondern Mehrwert, der die Beziehung stärkt.`,
  bewerber: `ZIELGRUPPE: Stellensuchende / Fachkräfte & Nachwuchs aus Bau, GaLaBau, Tiefbau, Landwirtschaft.
ANSPRACHE: "du", motivierend, klar, respektvoll – Handwerker-Sprache, keine Werber-Floskeln.
ZIEL DER MAIL: Recruiting-Sog erzeugen. Fragen, ob sie gerade (noch) einen neuen Job suchen; "Arbeitgeber des Monats" vorstellen; Bewerbungs-/Gehalts-Tipps geben, wie sie die besten Stellen mit mehr Gehalt bekommen.
INHALT-MIX: EIN echter Nutzen (Tipp, Chance, spannender Arbeitgeber), dann eine klare Einladung, sich zu melden / Stellen anzusehen. Die Branche ist zweitrangig – im Zweifel geht es ums Weiterkommen, mehr Gehalt und einen guten Arbeitgeber, nicht um die Fachrichtung.`,
};

const THEME_LABEL: Record<string, string> = {
  galabau: "Garten- & Landschaftsbau (GaLaBau)",
  tiefbau: "Straßen- & Tiefbau",
  landwirtschaft: "Landwirtschaft & Landtechnik",
};

function buildSystemPrompt() {
  return `Du bist der erfahrene E-Mail-Marketing-Texter von GreenCareers – einem Karrierenetzwerk, das Betriebe aus Bau, GaLaBau, Tiefbau und Landwirtschaft planbar mit qualifizierten Fachkräften zusammenbringt.

DEINE AUFGABE
Schreibe EINEN vollständigen Newsletter-Entwurf, den ein Mensch nur noch prüft und freigibt. Er soll zugleich innovativ, informativ, werblich und markenbildend sein – aber niemals marktschreierisch.

MARKENSTIMME (immer)
- Klar, konkret, ehrlich. Kurze Sätze. Keine leeren Superlative, kein "Revolution", kein Buzzword-Bingo.
- Sparsam mit Emojis (höchstens 1, oft keins). Kein CAPS-Geschrei.
- Immer "Karrierenetzwerk", nie "Jobbörse"/"Stellenportal".
- Deutsch, DSGVO-bewusst. Keine erfundenen Zahlen/Versprechen. Wenn du Zahlen brauchst, formuliere sie als Platzhalter in eckigen Klammern (z.B. "[X] Betriebe"), damit der Mensch sie einsetzt.

STRUKTUR DES HTML-BODYS
- Ein sauberer, e-mail-tauglicher HTML-Body (inline-styles, einspaltig, max. ~600px, System-Schriften). Keine externen CSS/Scripts, keine <html>/<head>-Tags – nur der innere Inhalt ab <div>.
- Aufbau: kurzer Vorspann → 1 Hauptabschnitt mit echtem Nutzen → EIN klarer Call-to-Action-Button (als <a> mit inline-styles, Platzhalter-Link {{cta_url}}) → knapper Abschluss.
- Ganz unten IMMER ein Abmelde-Hinweis mit dem Platzhalter {{unsubscribeUrl}}: ein dezenter Link "Keine weiteren E-Mails erhalten". (Pflicht bei Single-Opt-in. Schreibe den Platzhalter exakt so – Lemlist ersetzt ihn pro Empfänger.)
- Verwende die Akzentfarbe {{ACCENT}} für Button/Links.
- Personalisierung: nutze {{firstName}} als Anrede-Platzhalter, wenn passend.

AUSGABEFORMAT
Antworte AUSSCHLIESSLICH mit einem JSON-Objekt (kein Markdown, kein Text drumherum):
{
  "subject": "Haupt-Betreff (max ~55 Zeichen, konkret, neugierig machend)",
  "subject_variants": ["Alternative 1", "Alternative 2"],
  "preheader": "Vorschautext (max ~90 Zeichen, ergänzt den Betreff, wiederholt ihn nicht)",
  "body_html": "<div ...>...vollständiger HTML-Body inkl. CTA-Button und {{unsubscribe_url}}-Footer...</div>",
  "body_text": "Reine Text-Version derselben Mail (mit Abmelde-Zeile am Ende)."
}`;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405, cors);

  // --- gc_admin erzwingen (Texte kosten Tokens; nur GC-Team darf) ---
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "no_auth" }, 401, cors);
  const asCaller = createClient(SB_URL, SB_ANON, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userRes, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: "invalid_token" }, 401, cors);
  const admin = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: prof } = await admin.from("profiles").select("role").eq("id", userRes.user.id).single();
  if (!prof || prof.role !== "gc_admin") return json({ error: "forbidden" }, 403, cors);

  // --- Eingaben ---
  let p: any;
  try { p = await req.json(); } catch { return json({ error: "bad_json" }, 400, cors); }
  const audience = ["b2b_neukunde", "b2b_bestandskunde", "bewerber"].includes(p?.audience) ? p.audience : "b2b_neukunde";
  const theme = ["galabau", "tiefbau", "landwirtschaft"].includes(p?.theme) ? p.theme : null;
  const branche = String(p?.branche || "").trim() || null;
  const topic = String(p?.topic || "").trim();
  const accent = theme === "tiefbau" ? "#EA580C" : theme === "landwirtschaft" ? "#CA8A04" : "#16A34A";

  const contextLines = [
    AUDIENCE_BRIEF[audience],
    theme ? `BRANCHEN-FAMILIE: ${THEME_LABEL[theme]}.` : `BRANCHE: übergreifend (nicht auf eine Fachrichtung festlegen).`,
    branche ? `KONKRETE SUB-BRANCHE: ${branche}. Sprich diese Zielgruppe passgenau an.` : "",
    topic ? `ANLASS/THEMA (vom GC-Team vorgegeben, unbedingt aufgreifen): ${topic}` : `Wähle selbst einen relevanten, aktuellen Aufhänger für diese Zielgruppe.`,
    `AKZENTFARBE für den HTML-Body: ${accent} (setze sie überall dort ein, wo im System-Prompt {{ACCENT}} steht).`,
  ].filter(Boolean).join("\n");

  try {
    const ai = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2200,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: `Erstelle den Newsletter-Entwurf für folgenden Kontext:\n\n${contextLines}` }],
      }),
    });
    if (!ai.ok) {
      const t = await ai.text();
      console.error("anthropic error", ai.status, t);
      return json({ error: "upstream", status: ai.status }, 502, cors);
    }
    const data = await ai.json();
    let raw = (data?.content?.[0]?.text || "").trim();
    // JSON robust extrahieren (falls das Modell doch Text drumherum liefert).
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first > 0 || last < raw.length - 1) raw = raw.slice(first, last + 1);
    let draft: any;
    try { draft = JSON.parse(raw); } catch {
      return json({ error: "parse", raw: (data?.content?.[0]?.text || "").slice(0, 4000) }, 502, cors);
    }
    // Akzentfarbe final einsetzen (falls das Modell den Platzhalter stehen liess).
    if (typeof draft.body_html === "string") draft.body_html = draft.body_html.replaceAll("{{ACCENT}}", accent);

    return json({ ok: true, audience, theme, branche, accent, draft }, 200, cors);
  } catch (e) {
    console.error("newsletter-ki error", e);
    return json({ error: "server", message: String(e) }, 500, cors);
  }
});
