import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCsvTransactions } from "@/lib/import/csv";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Extrahiert Trades aus verschiedenen Quellen:
//  - CSV:  direkt geparst (kostenlos, ohne KI)
//  - Bild/PDF: über Claude (benötigt ANTHROPIC_API_KEY)
// Rückgabe einheitlich: { configured, rows }.

const EXTRACT_PROMPT = `Du extrahierst Wertpapier-/Krypto-Transaktionen aus einem Broker-Dokument (Screenshot, Foto oder PDF wie Kontoauszug, Trade-Liste oder Vermögensaufstellung).
Gib AUSSCHLIESSLICH ein JSON-Objekt zurück, keine Erklärung, in diesem Format:
{"rows":[{"type":"buy"|"sell","name":"...","symbol":"...","isin":"...","kind":"stock"|"etf"|"crypto","quantity":Zahl,"price":Zahl,"currency":"EUR"|"USD"|"CAD"|...,"date":"YYYY-MM-DD"}]}
Regeln:
- name = ausgeschriebener Name (z. B. "Apple").
- isin nur wenn sichtbar, sonst weglassen.
- price = Kurs je Stück in der ORIGINALWÄHRUNG des Dokuments (Dezimalpunkt, kein Tausenderpunkt). NICHT umrechnen.
- currency = ISO-Code der Kurswährung (z. B. "USD", "CAD", "EUR"). Erkenne Symbole: CA$/C$ = CAD, US$/$ = USD, € = EUR, £ = GBP. Wenn unklar, "EUR".
- quantity = Stückzahl (Dezimalpunkt).
- Erfasse JEDE einzelne Transaktion (auch mehrere Käufe/Verkäufe desselben Titels).
- Wenn nur ein Bestand ohne Kaufkurs sichtbar ist, nutze den aktuellen Kurs als price und type "buy".
- date im Format YYYY-MM-DD, sonst weglassen.`;

interface AnthropicBlock {
  type: string;
  text?: string;
  source?: Record<string, string>;
}

async function extractWithClaude(
  apiKey: string,
  block: AnthropicBlock,
): Promise<{ rows: unknown[] } | { error: string }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [
        { role: "user", content: [block, { type: "text", text: EXTRACT_PROMPT }] },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { error: `KI-API: ${res.status} ${t.slice(0, 200)}` };
  }
  const data = await res.json();
  const text: string =
    data?.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
  const jsonMatch = /\{[\s\S]*\}/.exec(text);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { rows: [] };
  return { rows: parsed.rows ?? [] };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = (await request.json()) as {
    image?: string;
    pdf?: string;
    csv?: string;
  };

  // --- CSV: ohne KI, kostenlos ---
  if (body.csv) {
    try {
      const rows = parseCsvTransactions(body.csv);
      return NextResponse.json({ configured: true, rows });
    } catch (e) {
      return NextResponse.json(
        { configured: true, error: e instanceof Error ? e.message : String(e) },
        { status: 400 },
      );
    }
  }

  // --- Bild/PDF: über Claude ---
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, rows: [] });
  }

  let block: AnthropicBlock | null = null;
  if (body.image) {
    const m = /^data:(image\/[a-zA-Z.+-]+);base64,(.+)$/.exec(body.image);
    if (!m) {
      return NextResponse.json({ error: "Kein gültiges Bild." }, { status: 400 });
    }
    block = { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } };
  } else if (body.pdf) {
    const m = /^data:(application\/pdf);base64,(.+)$/.exec(body.pdf);
    if (!m) {
      return NextResponse.json({ error: "Kein gültiges PDF." }, { status: 400 });
    }
    block = {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: m[2] },
    };
  }

  if (!block) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  try {
    const result = await extractWithClaude(apiKey, block);
    if ("error" in result) {
      return NextResponse.json({ configured: true, error: result.error }, { status: 502 });
    }
    return NextResponse.json({ configured: true, rows: result.rows });
  } catch (e) {
    return NextResponse.json(
      { configured: true, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
