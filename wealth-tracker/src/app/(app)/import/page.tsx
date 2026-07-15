import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ImportWizard } from "@/components/ImportWizard";

export const dynamic = "force-dynamic";

// Screenshot-Import: Trades aus einem Broker-Screenshot übernehmen.
export default async function ImportPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id,name,type")
    .in("type", ["broker", "crypto"])
    .order("sort_order");

  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 active:opacity-60"
          aria-label="Zurück"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Screenshot-Import</h1>
      </header>

      <ImportWizard accounts={accounts ?? []} />
    </div>
  );
}
