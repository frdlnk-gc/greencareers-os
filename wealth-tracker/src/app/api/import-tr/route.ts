import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseTradeRepublicCsv } from "@/lib/import/traderepublic";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // großzügiges Zeitbudget für den Voll-Import

// Voll-Import eines Trade-Republic-CSV-Exports in EIN Depot.
// Als Route (nicht Server-Action), damit das Zeitbudget (60 s) für viele
// Transaktionen reicht. Ersetzt die Transaktionen des Ziel-Depots, legt
// Instrumente je ISIN an und bucht Käufe/Verkäufe/Dividenden robust: schlägt
// ein Block fehl, wird zeilenweise gebucht (eine problematische Zeile verwirft
// nicht den ganzen Block) und der Fehler wird gemeldet – nie mehr stiller
// Datenverlust.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const userId = user.id;

  let body: { accountId?: string; csv?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const accountId = body.accountId ?? "";
  const csvText = body.csv ?? "";
  if (!accountId || !csvText) {
    return NextResponse.json(
      { error: "accountId oder CSV fehlt." },
      { status: 400 },
    );
  }

  const { rows, counts, skipped } = parseTradeRepublicCsv(csvText);
  if (rows.length === 0) {
    return NextResponse.json({
      inserted: 0,
      failed: 0,
      instruments: 0,
      counts,
      skipped,
      error: null,
    });
  }

  // Bestehende Transaktionen dieses Depots ersetzen.
  await supabase
    .from("transactions")
    .delete()
    .eq("account_id", accountId)
    .eq("user_id", userId);

  // Fehlende Instrumente je ISIN anlegen.
  const distinct = new Map<string, { name: string; kind: string }>();
  for (const r of rows)
    if (!distinct.has(r.isin)) distinct.set(r.isin, { name: r.name, kind: r.kind });

  const keyFor = (isin: string, kind: string) =>
    kind === "crypto" ? isin.toLowerCase() : isin.toUpperCase();

  const { data: existing } = await supabase
    .from("instruments")
    .select("id,yahoo_symbol,coingecko_id")
    .eq("user_id", userId);
  const known = new Set<string>();
  for (const it of existing ?? []) {
    if (it.yahoo_symbol) known.add(String(it.yahoo_symbol).toUpperCase());
    if (it.coingecko_id) known.add(String(it.coingecko_id).toLowerCase());
  }

  const toCreate: Record<string, unknown>[] = [];
  for (const [isin, meta] of distinct) {
    if (known.has(keyFor(isin, meta.kind))) continue;
    toCreate.push({
      user_id: userId,
      kind: meta.kind,
      name: meta.name,
      display_symbol: null,
      currency: "EUR",
      yahoo_symbol: meta.kind === "crypto" ? null : isin.toUpperCase(),
      coingecko_id: meta.kind === "crypto" ? isin.toLowerCase() : null,
    });
  }
  if (toCreate.length) await supabase.from("instruments").insert(toCreate);

  // Alle Instrumente frisch laden und ISIN → id auflösen.
  const { data: allInst } = await supabase
    .from("instruments")
    .select("id,yahoo_symbol,coingecko_id")
    .eq("user_id", userId);
  const idByKey = new Map<string, string>();
  for (const it of allInst ?? []) {
    if (it.yahoo_symbol) idByKey.set(String(it.yahoo_symbol).toUpperCase(), it.id);
    if (it.coingecko_id) idByKey.set(String(it.coingecko_id).toLowerCase(), it.id);
  }

  const txRows: Record<string, unknown>[] = [];
  for (const r of rows) {
    const instrument_id = idByKey.get(keyFor(r.isin, r.kind));
    if (!instrument_id) continue;
    txRows.push({
      user_id: userId,
      account_id: accountId,
      instrument_id,
      type: r.type,
      trade_date: r.date,
      quantity: r.quantity,
      price: r.price,
      amount: r.amount,
      fees: r.fee,
      currency: "EUR",
    });
  }

  // Robuste Einfügung: kleine Blöcke; schlägt ein Block fehl, zeilenweise
  // buchen und den Fehler festhalten.
  let inserted = 0;
  let failed = 0;
  let firstError: string | null = null;
  const CHUNK = 200;
  for (let i = 0; i < txRows.length; i += CHUNK) {
    const chunk = txRows.slice(i, i + CHUNK);
    const { error } = await supabase.from("transactions").insert(chunk);
    if (!error) {
      inserted += chunk.length;
      continue;
    }
    if (!firstError) firstError = error.message;
    for (const row of chunk) {
      const { error: e2 } = await supabase.from("transactions").insert(row);
      if (e2) {
        failed++;
        if (!firstError) firstError = e2.message;
      } else inserted++;
    }
  }

  return NextResponse.json({
    inserted,
    failed,
    instruments: distinct.size,
    counts,
    skipped,
    error: firstError,
  });
}
