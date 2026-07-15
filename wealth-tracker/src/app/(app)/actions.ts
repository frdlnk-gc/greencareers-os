"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseTradeRepublicCsv } from "@/lib/import/traderepublic";

// Gemeinsame Hilfen ---------------------------------------------------------

async function requireUser(): Promise<{
  supabase: SupabaseClient;
  userId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

// Wandelt Nutzereingaben in Zahlen – robust für deutsches (1.234,56) UND
// englisches (1,234.56) Format. Wichtig: "2.609,00" darf NICHT als NaN
// verloren gehen.
function num(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  let s = String(v).replace(/[^\d,.-]/g, "").trim();
  if (!s) return null;
  if (s.includes(",") && s.includes(".")) {
    // Das hintere Zeichen ist der Dezimaltrenner.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

// Zurücksetzen: löscht ALLE Instrumente + Transaktionen (und darüber via
// Fremdschlüssel-Kaskade auch Kurse & Historie). Die Depots bleiben erhalten.
export async function resetPositions(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireUser();
  if (formData.get("confirm") !== "on") return;
  await supabase.from("transactions").delete().eq("user_id", userId);
  await supabase.from("instruments").delete().eq("user_id", userId);
  revalidatePath("/", "layout");
  redirect("/");
}

// Optional: löscht zusätzlich alle Depots (kompletter Neuanfang).
export async function resetEverything(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireUser();
  if (formData.get("confirm") !== "on") return;
  await supabase.from("transactions").delete().eq("user_id", userId);
  await supabase.from("instruments").delete().eq("user_id", userId);
  await supabase.from("accounts").delete().eq("user_id", userId);
  revalidatePath("/", "layout");
  redirect("/");
}

// Depots --------------------------------------------------------------------

export async function createAccount(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "broker");
  if (!name) return;

  const { data: existing } = await supabase
    .from("accounts")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = ((existing?.[0]?.sort_order as number | undefined) ?? -1) + 1;

  const finalType = ["broker", "crypto", "cash", "other"].includes(type)
    ? type
    : "broker";

  const { data: acc } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name,
      type: finalType,
      currency: "EUR",
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  // Optionaler Startwert für Cash/Sonstiges (Verbindlichkeit -> negativ).
  const value = num(formData.get("value"));
  const isLiability = formData.get("liability") === "on";
  if (acc && value != null && (finalType === "cash" || finalType === "other")) {
    await supabase.from("transactions").insert({
      user_id: userId,
      account_id: acc.id,
      type: isLiability ? "withdrawal" : "deposit",
      trade_date: new Date().toISOString().slice(0, 10),
      amount: Math.abs(value),
      fees: 0,
      currency: "EUR",
    });
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function renameAccount(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await supabase.from("accounts").update({ name }).eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/depot/${id}`);
}

export async function deleteAccount(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("accounts").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/");
}

// Instrument finden oder neu anlegen ---------------------------------------

async function resolveInstrumentId(
  supabase: SupabaseClient,
  userId: string,
  formData: FormData,
): Promise<string | null> {
  const existing = String(formData.get("instrument_id") ?? "").trim();
  if (existing && existing !== "__new__") return existing;

  const name = String(formData.get("new_name") ?? "").trim();
  if (!name) return null;
  const kind = String(formData.get("new_kind") ?? "stock");
  const symbol = String(formData.get("new_symbol") ?? "").trim();
  const isin = String(formData.get("new_isin") ?? "").trim().toUpperCase();
  const rawCur = String(formData.get("currency") ?? "EUR").toUpperCase();
  const cur = /^[A-Z]{3}$/.test(rawCur) ? rawCur : "EUR";

  const row: Record<string, unknown> = {
    user_id: userId,
    kind: ["stock", "etf", "crypto", "cash"].includes(kind) ? kind : "stock",
    name,
    display_symbol: symbol || null,
    // Krypto wird über CoinGecko in EUR bewertet; Aktien tragen ihre
    // Handelswährung (Anzeige/Live-Kurs rechnen in EUR um).
    currency: kind === "crypto" ? "EUR" : cur,
  };
  if (kind === "crypto") {
    row.coingecko_id = symbol || null;
  } else {
    // ISIN bevorzugt (liefert über Tradegate Live-Kurse); sonst Symbol.
    row.yahoo_symbol = isin || symbol || null;
  }

  const { data, error } = await supabase
    .from("instruments")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id as string;
}

// Transaktionen -------------------------------------------------------------

export async function createTransaction(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireUser();
  const accountId = String(formData.get("account_id") ?? "");
  const type = String(formData.get("type") ?? "buy");
  const date =
    String(formData.get("trade_date") ?? "") ||
    new Date().toISOString().slice(0, 10);
  if (!accountId) return;

  // Währung des Kurses/Betrags (Kauf/Verkauf/Dividende); Cash immer EUR.
  const rawCur = String(formData.get("currency") ?? "EUR").toUpperCase();
  const currency = /^[A-Z]{3}$/.test(rawCur) ? rawCur : "EUR";

  const base = {
    user_id: userId,
    account_id: accountId,
    type,
    trade_date: date,
    fees: num(formData.get("fees")) ?? 0,
    currency,
  };

  let goToInstrument: string | null = null;
  if (type === "deposit" || type === "withdrawal") {
    // Reine Geldbewegung (kein Instrument).
    await supabase.from("transactions").insert({
      ...base,
      amount: num(formData.get("amount")),
    });
  } else {
    const instrumentId = await resolveInstrumentId(supabase, userId, formData);
    if (!instrumentId) return;
    goToInstrument = instrumentId;
    const quantity = num(formData.get("quantity"));
    const price = num(formData.get("price"));
    await supabase.from("transactions").insert({
      ...base,
      instrument_id: instrumentId,
      quantity,
      price,
      amount:
        type === "dividend"
          ? num(formData.get("amount"))
          : quantity != null && price != null
            ? quantity * price
            : null,
    });
    // Falls noch kein Kurs bekannt ist: eingegebenen Kurs als Startwert setzen
    // (in seiner Originalwährung – die Anzeige rechnet in EUR um). Ein echter
    // Live-Kurs (Börse Frankfurt, in EUR) überschreibt ihn beim nächsten
    // Aktualisieren.
    if (type === "buy" && price != null) {
      await supabase
        .from("prices")
        .upsert(
          {
            instrument_id: instrumentId,
            price,
            currency,
            change_pct_1d: 0,
            source: "manuell",
          },
          { onConflict: "instrument_id" },
        );
    }
  }

  revalidatePath("/", "layout");
  // Kam die Transaktion aus einer Positionsansicht, dorthin zurück.
  const fromInstrument = String(formData.get("from_instrument") ?? "");
  if (fromInstrument && fromInstrument === goToInstrument) {
    redirect(`/depot/${accountId}/pos/${goToInstrument}`);
  }
  redirect(`/depot/${accountId}`);
}

// Mehrere Transaktionen auf einmal buchen (z. B. aus dem Screenshot-Import).
export interface ImportRow {
  type: "buy" | "sell";
  name: string;
  symbol?: string;
  isin?: string;
  kind?: "stock" | "etf" | "crypto";
  quantity: number;
  price: number;
  currency?: string;
  date?: string;
}

export async function importTransactions(
  accountId: string,
  rows: ImportRow[],
): Promise<{ inserted: number }> {
  const { supabase, userId } = await requireUser();
  if (!accountId || rows.length === 0) return { inserted: 0 };

  let inserted = 0;
  for (const r of rows) {
    if (!r.name || !r.quantity) continue;
    const kind = r.kind ?? "stock";
    const symField =
      kind === "crypto"
        ? { coingecko_id: r.symbol || null }
        : { yahoo_symbol: (r.isin || r.symbol || "").toUpperCase() || null };

    const rawCur = String(r.currency ?? "EUR").toUpperCase();
    const currency = /^[A-Z]{3}$/.test(rawCur) ? rawCur : "EUR";

    // Bestehendes Instrument über Name suchen, sonst neu anlegen.
    const { data: existing } = await supabase
      .from("instruments")
      .select("id")
      .eq("name", r.name)
      .limit(1);
    let instrumentId = existing?.[0]?.id as string | undefined;
    if (!instrumentId) {
      const { data: created } = await supabase
        .from("instruments")
        .insert({
          user_id: userId,
          kind,
          name: r.name,
          display_symbol: r.symbol || null,
          currency: kind === "crypto" ? "EUR" : currency,
          ...symField,
        })
        .select("id")
        .single();
      instrumentId = created?.id as string | undefined;
    }
    if (!instrumentId) continue;
    await supabase.from("transactions").insert({
      user_id: userId,
      account_id: accountId,
      instrument_id: instrumentId,
      type: r.type === "sell" ? "sell" : "buy",
      trade_date: r.date || new Date().toISOString().slice(0, 10),
      quantity: r.quantity,
      price: r.price,
      amount: r.quantity * r.price,
      fees: 0,
      currency,
    });
    inserted++;
  }

  revalidatePath("/", "layout");
  return { inserted };
}

// Voll-Import eines Trade-Republic-CSV-Exports in EIN Depot. Ersetzt die
// bisherigen Transaktionen dieses Depots (sauberer Voll-Import), legt
// Instrumente je ISIN an und bucht Käufe/Verkäufe/Dividenden. Cash-Buchungen
// und komplexe Kapitalmaßnahmen werden bewusst ausgelassen (siehe Parser).
export interface BrokerImportResult {
  inserted: number;
  instruments: number;
  counts: { buy: number; sell: number; dividend: number };
  skipped: { reason: string; count: number }[];
}

export async function importTradeRepublicCsv(
  accountId: string,
  csvText: string,
): Promise<BrokerImportResult> {
  const { supabase, userId } = await requireUser();
  const empty: BrokerImportResult = {
    inserted: 0,
    instruments: 0,
    counts: { buy: 0, sell: 0, dividend: 0 },
    skipped: [],
  };
  if (!accountId || !csvText) return empty;

  const { rows, counts, skipped } = parseTradeRepublicCsv(csvText);
  if (rows.length === 0) return { ...empty, skipped };

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

  // Alle Instrumente frisch laden und ISIN → id auflösen (reihenfolgensicher).
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

  let inserted = 0;
  for (let i = 0; i < txRows.length; i += 500) {
    const chunk = txRows.slice(i, i + 500);
    const { error } = await supabase.from("transactions").insert(chunk);
    if (!error) inserted += chunk.length;
  }

  revalidatePath("/", "layout");
  return { inserted, instruments: distinct.size, counts, skipped };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  const instrumentId = String(formData.get("instrument_id") ?? "");
  if (!id) return;
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/", "layout");
  // Zurück zur Position (falls von dort gelöscht), sonst zum Depot.
  if (instrumentId && accountId) redirect(`/depot/${accountId}/pos/${instrumentId}`);
  if (accountId) redirect(`/depot/${accountId}`);
}

// Eine bestehende Transaktion bearbeiten (Art, Datum, Menge, Kurs, Währung,
// Betrag, Gebühren). Das Instrument bleibt unverändert.
export async function editTransaction(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  const instrumentId = String(formData.get("instrument_id") ?? "");
  if (!id) return;

  const type = String(formData.get("type") ?? "buy");
  const date =
    String(formData.get("trade_date") ?? "") ||
    new Date().toISOString().slice(0, 10);
  const rawCur = String(formData.get("currency") ?? "EUR").toUpperCase();
  const currency = /^[A-Z]{3}$/.test(rawCur) ? rawCur : "EUR";
  const isCashOrDiv =
    type === "dividend" || type === "deposit" || type === "withdrawal";
  const quantity = isCashOrDiv ? null : num(formData.get("quantity"));
  const price = isCashOrDiv ? null : num(formData.get("price"));
  const amount = isCashOrDiv
    ? num(formData.get("amount"))
    : quantity != null && price != null
      ? quantity * price
      : null;

  await supabase
    .from("transactions")
    .update({
      type,
      trade_date: date,
      quantity,
      price,
      amount,
      fees: num(formData.get("fees")) ?? 0,
      currency,
    })
    .eq("id", id);

  revalidatePath("/", "layout");
  if (instrumentId && accountId) redirect(`/depot/${accountId}/pos/${instrumentId}`);
  if (accountId) redirect(`/depot/${accountId}`);
}
