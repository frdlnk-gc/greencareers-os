import Link from "next/link";
import { createAccount } from "../actions";

export const dynamic = "force-dynamic";

// Neues Depot / Konto anlegen.
export default function NewAccountPage() {
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
        <h1 className="text-xl font-bold">Neues Depot</h1>
      </header>

      <form action={createAccount} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Name</label>
          <input
            name="name"
            required
            autoFocus
            placeholder="z. B. Trade Republic"
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-base outline-none focus:border-neutral-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Art</label>
          <select
            name="type"
            defaultValue="broker"
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-base outline-none focus:border-neutral-600"
          >
            <option value="broker">Broker / Wertpapierdepot</option>
            <option value="crypto">Krypto</option>
            <option value="cash">Cash / Konto</option>
            <option value="other">Sonstiges Vermögen</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white active:opacity-80"
        >
          Depot anlegen
        </button>
      </form>
    </div>
  );
}
