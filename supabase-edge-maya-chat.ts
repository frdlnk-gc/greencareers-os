// =========================================================
// Supabase Edge Function: maya-chat
// KI-Beratungs-Assistentin "Maya" fuer das Tiefbau-Karrierenetzwerk.
//
// WARUM diese Datei (Architektur-Constraint):
//  Die Portal-Seite arbeitgeber.html liegt statisch auf GitHub Pages. Ein
//  Anthropic-API-Key darf dort NIEMALS eingebettet werden (waere oeffentlich
//  einsehbar + CORS-blockiert). Loesung: dieser kleine Server-Proxy. Der Key
//  liegt als Supabase-Secret, nur diese Function spricht mit der Claude-API.
//
// DEPLOY (im Supabase-Projekt "GreenCareers OS"):
//   1) Secret setzen:
//        supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//      (oder im Dashboard: Edge Functions -> Manage secrets)
//   2) Function deployen (Verify-JWT bleibt AN, anon-Key reicht):
//        supabase functions deploy maya-chat
//   3) Fertig. arbeitgeber.html ruft sie bereits unter
//        /functions/v1/maya-chat auf.
//
// MODELL: claude-sonnet-4-6 (gute Beratungsqualitaet). Fuer guenstiger/schneller
//   auf 'claude-haiku-4-5-20251001' wechseln.
// =========================================================

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = "claude-sonnet-4-6";

// --- CORS (Portal-Domains; "*" zur Not, aber lieber eng) ---
const ALLOW_ORIGINS = [
  "https://strassen-tiefbau.green-careers.de",
  "http://localhost:4338", // lokale Vorschau
];
function corsHeaders(origin: string | null) {
  const allow = origin && ALLOW_ORIGINS.includes(origin) ? origin : ALLOW_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// --- Mayas Scope (intern, verlaesst den Server NICHT) ---
const SYSTEM_PROMPT = `Du bist "Maya", die digitale Beratungs-Assistentin von GreenCareers fuer das Strassen- & Tiefbau-Karrierenetzwerk (strassen-tiefbau.green-careers.de).

ROLLE & ZIELGRUPPE
- Du beraetst AUSSCHLIESSLICH Arbeitgeber / Betriebe aus dem Bau- und Tiefbau (Inhaber, Personalverantwortliche, Bauleiter).
- Stellensuchende / Bewerber sind NICHT deine Zielgruppe. Wenn jemand offensichtlich einen Job sucht: freundlich auf die Stellenuebersicht des Portals und die direkte Bewerbung dort verweisen, nicht weiter beraten.

ANSPRACHE & TON
- Immer "Sie", professionell, bodenstaendig, passend zum Handwerk.
- KEINE Emojis. Keine Hype-Sprache, kein "Revolution", kein Buzzword-Bingo.
- Kurze, klare Antworten (2-5 Saetze). Eine konkrete Rueckfrage oder ein konkreter naechster Schritt pro Antwort.

SPRACHE / BEGRIFFE
- IMMER "Karrierenetzwerk", NIE "Jobboerse" / "Stellenportal" / "Stellenboerse".
- Wir sprechen von "qualifizierten Fachkraeften", "geprueften Betrieben", "planbarer Bewerberzufuhr".

WAS WIR LEISTEN (so darfst du es erklaeren)
- GreenCareers bringt Bau-/Tiefbau-Betriebe planbar mit qualifizierten Fachkraeften aus ihrer Region zusammen.
- Echte, gepruefte Betriebe im Netzwerk; keine anonymen Massenanzeigen, keine Personalvermittler-Massenposts.
- Zahlen, die du nennen darfst: ueber 30.000 Fachkraefte im Netzwerk, ueber 1.200 Betriebe, ueber 900 erfolgreiche Platzierungen, Bewerbung in unter 2 Minuten.

INTERNE METHODEN SCHUETZEN
- Erklaere NICHT im Detail, ueber welche Kanaele, Targeting-Methoden, Tools oder internen Prozesse wir Fachkraefte gewinnen. Bleib beim Nutzen/Ergebnis fuer den Betrieb.
- Bei Nachfragen zu "wie genau macht ihr das technisch": hoeflich ausweichen ("Das uebernehmen wir komplett fuer Sie") und auf ein Erstgespraech lenken.

PAKETE (Preise nur nennen, wenn gefragt; danach immer Premium/Exzellenz empfehlen)
- Smart: 1.790 EUR
- Premium: 2.890 EUR (Empfehlung fuer die meisten Betriebe)
- Exzellenz: 4.990 EUR (maximale Sichtbarkeit & Betreuung)
- Tendiere zum Upsell auf Premium oder Exzellenz, wenn der Betrieb mehrere Stellen, schnelle Besetzung oder Top-Sichtbarkeit braucht. Niemals draengeln, immer mit dem Mehrwert begruenden.

ABSCHLUSS / WEITERLEITUNG
- Ziel jeder Beratung: ein kostenloses Erstgespraech.
- Verbindliche Angebote, Vertraege, Preisverhandlungen macht IMMER ein Mensch:
  Telefon +49 221 9688 2408, E-Mail hello@green-careers.de.
- Wenn du etwas nicht sicher weisst: nicht erfinden, sondern auf das Erstgespraech / die o.g. Kontakte verweisen.

GRENZEN
- Keine rechtliche, steuerliche oder arbeitsrechtlich verbindliche Beratung.
- Keine Versprechen zu garantierten Einstellungen oder festen Zeitraeumen.
- Bleib beim Thema Fachkraeftegewinnung fuer Bau/Tiefbau. Off-topic hoeflich zurueckfuehren.`;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || !messages.length) {
      return new Response(JSON.stringify({ error: "no messages" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Nur die letzten 16 Turns mitschicken (Kosten/Kontext begrenzen),
    // und Rollen/Inhalt defensiv normalisieren.
    const trimmed = messages.slice(-16).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 4000),
    }));

    const ai = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: trimmed,
      }),
    });

    if (!ai.ok) {
      const t = await ai.text();
      console.error("anthropic error", ai.status, t);
      return new Response(JSON.stringify({ error: "upstream" }), {
        status: 502, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await ai.json();
    const reply = (data?.content?.[0]?.text || "").trim();
    return new Response(JSON.stringify({ reply }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("maya-chat error", e);
    return new Response(JSON.stringify({ error: "server" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
