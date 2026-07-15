import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ImportWizard } from "@/components/ImportWizard";
import { BrokerCsvImport } from "@/components/BrokerCsvImport";

export const dynamic = "force-dynamic";

// Import: Voller Verlauf per Broker-CSV (empfohlen) ODER einzelne Trades per
// Screenshot.
export default async function ImportPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id,name,type")
    .in("type", ["broker", "crypto"])
    .order("sort_order");

  const list = accounts ?? [];

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
        <h1 className="text-xl font-bold">Import</h1>
      </header>

      {/* Broker-CSV: kompletter Verlauf auf einmal */}
      <section className="mb-10">
        <h2 className="mb-1 text-lg font-semibold">
          Kompletter Verlauf (Broker-CSV)
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Der ganze Depotverlauf auf einmal – z. B. der Trade-Republic-
          Transaktionsexport. Empfohlen, damit dein Depot ab dem ersten Kauf
          startet.
        </p>
        <BrokerCsvImport accounts={list} />
      </section>

      {/* Screenshot-Import: einzelne Trades */}
      <section>
        <h2 className="mb-1 text-lg font-semibold">
          Einzelne Trades (Screenshot / Foto)
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Für einzelne Positionen aus einem Screenshot, PDF oder Foto.
        </p>
        <ImportWizard accounts={list} />
      </section>
    </div>
  );
}
