import Link from "next/link";
import { NewAccountForm } from "@/components/NewAccountForm";

export const dynamic = "force-dynamic";

// Neues Depot / Konto anlegen. ?type=… wählt die Art vor (z. B. „+ Cash").
export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;

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
        <h1 className="text-xl font-bold">
          {type === "cash" ? "Cash / Vermögen" : "Neues Depot"}
        </h1>
      </header>

      <NewAccountForm initialType={type ?? "broker"} />
    </div>
  );
}
