"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { refreshPrices } from "@/lib/prices/refresh";
import type { SupabaseClient } from "@supabase/supabase-js";

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

function num(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
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

// Frischer Start: alles leeren + Constellation Software als Testfall -------
//
// Löscht ALLE Instrumente + Transaktionen (Depots bleiben leer erhalten) und
// legt dann als erste echte Position „Constellation Software" im CapTrader-
// Depot an – exakt mit den vom Nutzer gesendeten Trades. Käufe in CA$, die
// Dividenden in US$. Anschließend wird sofort ein Live-Kurs (Börse Frankfurt,
// in EUR) gezogen, damit der Wert stimmt.
export async function resetAndSeedConstellation(
  formData: FormData,
): Promise<void> {
  const { supabase, userId } = await requireUser();
  if (formData.get("confirm") !== "on") return;

  // 1) Alles leeren – Depots (accounts) bleiben erhalten.
  await supabase.from("transactions").delete().eq("user_id", userId);
  await supabase.from("instruments").delete().eq("user_id", userId);

  // 2) CapTrader-Depot finden (sonst erstes Broker-Depot, sonst erstes Depot).
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id,name,type,sort_order")
    .order("sort_order");
  const list = accounts ?? [];
  const target =
    list.find((a) => /captrader/i.test(a.name as string)) ??
    list.find((a) => a.type === "broker") ??
    list[0];
  if (!target) {
    // Keine Depots vorhanden -> nichts einzutragen.
    revalidatePath("/", "layout");
    redirect("/");
  }
  const accountId = target.id as string;

  // 3) Constellation-Instrument anlegen (ISIN im Symbolfeld -> Börse Frankfurt
  //    liefert darüber den EUR-Live-Kurs).
  const { data: inst } = await supabase
    .from("instruments")
    .insert({
      user_id: userId,
      kind: "stock",
      name: "Constellation Software",
      display_symbol: "CSU",
      yahoo_symbol: "CA21037X1006",
      currency: "CAD",
    })
    .select("id")
    .single();

  if (inst?.id) {
    const instrumentId = inst.id as string;
    // 4) Transaktionen (Käufe in CA$, Dividenden in US$).
    const txns = [
      {
        type: "buy",
        trade_date: "2026-02-26",
        quantity: 3,
        price: 2609.0,
        amount: 3 * 2609.0,
        currency: "CAD",
      },
      {
        type: "dividend",
        trade_date: "2026-04-15",
        quantity: null,
        price: null,
        amount: 3, // 1 US$ je Stück × 3 Stück
        currency: "USD",
      },
      {
        type: "buy",
        trade_date: "2026-06-02",
        quantity: 2,
        price: 2881.4,
        amount: 2 * 2881.4,
        currency: "CAD",
      },
      {
        type: "dividend",
        trade_date: "2026-07-10",
        quantity: null,
        price: null,
        amount: 5, // 1 US$ je Stück × 5 Stück
        currency: "USD",
      },
    ].map((t) => ({
      user_id: userId,
      account_id: accountId,
      instrument_id: instrumentId,
      fees: 0,
      ...t,
    }));
    await supabase.from("transactions").insert(txns);

    // 5) Sofort einen Live-Kurs ziehen, damit der Wert direkt stimmt.
    try {
      await refreshPrices(supabase);
    } catch {
      // Kurs kommt sonst beim nächsten Aktualisieren/Auto-Refresh.
    }
  }

  revalidatePath("/", "layout");
  redirect(`/depot/${accountId}`);
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

  const row: Record<string, unknown> = {
    user_id: userId,
    kind: ["stock", "etf", "crypto", "cash"].includes(kind) ? kind : "stock",
    name,
    display_symbol: symbol || null,
    currency: "EUR",
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

  const base = {
    user_id: userId,
    account_id: accountId,
    type,
    trade_date: date,
    fees: num(formData.get("fees")) ?? 0,
    currency: "EUR",
  };

  if (type === "deposit" || type === "withdrawal") {
    // Reine Geldbewegung (kein Instrument).
    await supabase.from("transactions").insert({
      ...base,
      amount: num(formData.get("amount")),
    });
  } else {
    const instrumentId = await resolveInstrumentId(supabase, userId, formData);
    if (!instrumentId) return;
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
    // Falls noch kein Kurs bekannt ist: eingegebenen Kurs als Startwert setzen.
    if (type === "buy" && price != null) {
      await supabase
        .from("prices")
        .upsert(
          {
            instrument_id: instrumentId,
            price,
            currency: "EUR",
            change_pct_1d: 0,
            source: "manuell",
          },
          { onConflict: "instrument_id" },
        );
    }
  }

  revalidatePath("/", "layout");
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
          currency: "EUR",
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
      currency: "EUR",
    });
    inserted++;
  }

  revalidatePath("/", "layout");
  return { inserted };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const accountId = String(formData.get("account_id") ?? "");
  if (!id) return;
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/", "layout");
  if (accountId) redirect(`/depot/${accountId}`);
}
