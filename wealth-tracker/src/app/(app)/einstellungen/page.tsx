import Link from "next/link";
import { resetPositions, resetEverything } from "../actions";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/home"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 active:opacity-60"
          aria-label="Zurück"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Einstellungen</h1>
      </header>

      <section className="rounded-2xl border border-red-900/50 bg-red-950/10 p-5">
        <h2 className="mb-1 font-semibold text-red-300">Daten zurücksetzen</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Löscht alle Aktien &amp; Kryptos samt Kursen und Verlauf. Die{" "}
          <b>Depots bleiben</b> erhalten. Danach kannst du deine Positionen über
          „+ Transaktion" oder den Import neu erfassen.
        </p>

        <form action={resetPositions} className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="confirm" required className="h-4 w-4 accent-red-500" />
            Ja, alle Aktien &amp; Kryptos löschen (Depots behalten)
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white active:opacity-80"
          >
            Aktien &amp; Kryptos löschen
          </button>
        </form>

        <details className="mt-5">
          <summary className="cursor-pointer text-xs text-neutral-500">
            Kompletter Neuanfang (auch Depots löschen)
          </summary>
          <form action={resetEverything} className="mt-3 space-y-3">
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              <input type="checkbox" name="confirm" required className="h-4 w-4 accent-red-500" />
              Ja, wirklich ALLES löschen (inkl. Depots)
            </label>
            <button
              type="submit"
              className="w-full rounded-xl border border-red-800 py-3 text-sm font-medium text-red-300 active:opacity-70"
            >
              Alles löschen
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}
