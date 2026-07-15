import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditTransactionForm } from "@/components/EditTransactionForm";

export const dynamic = "force-dynamic";

// Transaktion bearbeiten oder löschen.
export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string; txid: string }>;
}) {
  const { id, txid } = await params;
  const supabase = await createClient();

  const { data: tx } = await supabase
    .from("transactions")
    .select(
      "id,type,trade_date,quantity,price,amount,currency,fees,account_id,instrument_id",
    )
    .eq("id", txid)
    .single();

  if (!tx || tx.account_id !== id) notFound();

  const backHref = tx.instrument_id
    ? `/depot/${id}/pos/${tx.instrument_id}`
    : `/depot/${id}`;

  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 active:opacity-60"
          aria-label="Zurück"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Transaktion bearbeiten</h1>
      </header>

      <EditTransactionForm
        tx={{
          id: tx.id as string,
          type: tx.type as string,
          trade_date: tx.trade_date as string,
          quantity: tx.quantity as number | null,
          price: tx.price as number | null,
          amount: tx.amount as number | null,
          currency: tx.currency as string | null,
          fees: tx.fees as number | null,
        }}
        accountId={id}
        instrumentId={(tx.instrument_id as string | null) ?? null}
      />
    </div>
  );
}
