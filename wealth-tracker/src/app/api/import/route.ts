import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Extrahiert Trades aus einem hochgeladenen Screenshot per Claude-Vision.
// Benötigt ANTHROPIC_API_KEY (optional). Ohne Key meldet der Endpunkt das,
// und die Import-Seite erlaubt stattdessen die manuelle Erfassung.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, rows: [] });
  }

  const body = (await request.json()) as { image?: string };
  const image = body.image ?? "";
  const match = /^data:(image\/[a-zA-Z.+-]+);base64,(.+)$/.exec(image);
  if (!match) {
    return NextResponse.json({ error: "Kein gültiges Bild." }, { status: 400 });
  }
  const [, mediaType, base64] = match;

  const prompt = `Du extrahierst Wertpapier-/Krypto-Transaktionen aus einem Broker-Screenshot.
Gib AUSSCHLIESSLICH ein JSON-Objekt zurück, keine Erklärung, in diesem Format:
{"rows":[{"type":"buy"|"sell","name":"...","symbol":"...","isin":"...","kind":"stock"|"etf"|"crypto","quantity":Zahl,"price":Zahl,"date":"YYYY-MM-DD"}]}
Regeln:
- name = ausgeschriebener Name (z. B. "Apple").
- isin nur wenn im Bild sichtbar, sonst weglassen.
- price = Kurs je Stück in Euro (Dezimalpunkt, kein Tausenderpunkt).
- quantity = Stückzahl (Dezimalpunkt).
- Wenn nur ein Bestand ohne Kaufkurs sichtbar ist, nutze den aktuellen Kurs als price und type "buy".
- date im Format YYYY-MM-DD, sonst weglassen.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json(
        { configured: true, error: `Vision-API: ${res.status} ${t.slice(0, 200)}` },
        { status: 502 },
      );
    }
    const data = await res.json();
    const text: string =
      data?.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
    const jsonMatch = /\{[\s\S]*\}/.exec(text);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { rows: [] };
    return NextResponse.json({ configured: true, rows: parsed.rows ?? [] });
  } catch (e) {
    return NextResponse.json(
      { configured: true, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
