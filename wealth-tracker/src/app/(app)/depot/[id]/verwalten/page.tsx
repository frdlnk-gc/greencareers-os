import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { renameAccount, deleteAccount, deleteTransaction } from "../../../actions";
import { formatMoney, formatQuantity } from "@/lib/format";
import { SubmitButton, ConfirmButton } from "@/components/FormButtons";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  buy: "Kauf",
  sell: "Verkauf",
  dividend: "Dividende",
  deposit: "Einzahlung",
  withdrawal: "Auszahlung",
  fee: "Gebühr",
};

// Depot verwalten: umbenennen, Transaktionen löschen, Depot löschen.
export default async function ManageAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: account }, { data: instruments }, { data: txns }] =
    await Promise.all([
      supabase.from("accounts").select("id,name").eq("id", id).single(),
      supabase.from("instruments").select("id,name"),
      supabase
        .from("transactions")
        .select("id,type,trade_date,quantity,price,amount,instrument_id,currency")
        .eq("account_id", id)
        .order("trade_date", { ascending: false }),
    ]);

  if (!account) notFound();

  const nameById = new Map(
    (instruments ?? []).map((i) => [i.id as string, i.name as string]),
  );

  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <Link
          href={`/depot/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 active:opacity-60"
          aria-label="Zurück"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <h1 className="truncate text-xl font-bold">Depot verwalten</h1>
      </header>

      {/* Umbenennen */}
      <form action={renameAccount} className="mb-8 flex gap-2">
        <input type="hidden" name="id" value={id} />
        <input
          name="name"
          defaultValue={account.name}
          className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-base outline-none focus:border-neutral-600"
        />
        <SubmitButton className="rounded-xl bg-neutral-800 px-4 py-3 text-sm font-medium active:opacity-70 disabled:opacity-50">
          Speichern
        </SubmitButton>
      </form>

      {/* Transaktionen */}
      <h2 className="mb-2 text-lg font-semibold">Transaktionen</h2>
      {(txns ?? []).length === 0 ? (
        <p className="mb-8 text-sm text-neutral-500">
          Noch keine Transaktionen erfasst.
        </p>
      ) : (
        <ul className="mb-8 divide-y divide-neutral-900">
          {(txns ?? []).map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {TYPE_LABEL[t.type as string] ?? t.type}
                  {t.instrument_id
                    ? ` · ${nameById.get(t.instrument_id as string) ?? "?"}`
                    : ""}
                </div>
                <div className="text-xs text-neutral-500 tabular">
                  {t.trade_date}
                  {t.quantity != null
                    ? ` · ${formatQuantity(t.quantity as number)} × ${formatMoney(
                        (t.price as number) ?? 0,
                        t.currency as string | null,
                      )}`
                    : t.amount != null
                      ? ` · ${formatMoney(
                          t.amount as number,
                          t.currency as string | null,
                        )}`
                      : ""}
                </div>
              </div>
              <form action={deleteTransaction}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="account_id" value={id} />
                <ConfirmButton
                  confirm="Diese Transaktion wirklich löschen?"
                  className="rounded-lg px-3 py-2 text-xs text-red-400 active:opacity-60 disabled:opacity-50"
                >
                  Löschen
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* Depot löschen */}
      <form action={deleteAccount} className="border-t border-neutral-900 pt-6">
        <input type="hidden" name="id" value={id} />
        <ConfirmButton
          confirm="Depot samt aller Transaktionen unwiderruflich löschen?"
          className="w-full rounded-xl border border-red-900/60 py-3 text-sm font-medium text-red-400 active:opacity-70 disabled:opacity-50"
        >
          Depot löschen
        </ConfirmButton>
        <p className="mt-2 text-center text-xs text-neutral-600">
          Löscht das Depot samt aller Transaktionen unwiderruflich.
        </p>
      </form>
    </div>
  );
}
