import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/TransactionForm";

export const dynamic = "force-dynamic";

// Transaktion in einem bestimmten Depot erfassen.
export default async function NewTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ instrument?: string }>;
}) {
  const { id } = await params;
  const { instrument } = await searchParams;
  const supabase = await createClient();

  const [{ data: account }, { data: instruments }] = await Promise.all([
    supabase.from("accounts").select("id,name").eq("id", id).single(),
    supabase
      .from("instruments")
      .select("id,name,display_symbol,kind")
      .order("name"),
  ]);

  if (!account) notFound();

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
        <div>
          <h1 className="text-xl font-bold">Transaktion</h1>
          <p className="text-xs text-neutral-500">{account.name}</p>
        </div>
      </header>

      <TransactionForm
        accountId={id}
        instruments={instruments ?? []}
        initialInstrumentId={instrument}
      />
    </div>
  );
}
