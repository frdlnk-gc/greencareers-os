import Link from "next/link";
import {
  resetPositions,
  resetEverything,
  resetAndSeedConstellation,
} from "../actions";

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

      {/* Frischer Start mit dem Testfall Constellation */}
      <section className="mb-5 rounded-2xl border border-emerald-800/50 bg-emerald-950/10 p-5">
        <h2 className="mb-1 font-semibold text-emerald-300">
          Frisch starten mit Constellation
        </h2>
        <p className="mb-4 text-sm text-neutral-400">
          Löscht alle Demo-Aktien & -Kryptos aus <b>allen</b> Depots (die Depots
          bleiben) und trägt als ersten echten Testfall{" "}
          <b>Constellation Software</b> ins CapTrader-Depot ein: 2 Käufe (CA$) +
          2 Dividenden (US$), Live-Kurs über Börse Frankfurt. Danach prüfst du,
          ob alles stimmt.
        </p>
        <form action={resetAndSeedConstellation} className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="confirm"
              required
              className="h-4 w-4 accent-emerald-500"
            />
            Ja: alles leeren und Constellation eintragen
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white active:opacity-80"
          >
            Leeren & Constellation eintragen
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-red-900/50 bg-red-950/10 p-5">
        <h2 className="mb-1 font-semibold text-red-300">Daten zurücksetzen</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Löscht alle Aktien & Kryptos samt Kursen und Verlauf, damit du deine
          echten Positionen frisch einpflegen kannst. Die <b>Depots bleiben</b>
          {" "}erhalten.
        </p>

        <form action={resetPositions} className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="confirm" required className="h-4 w-4 accent-red-500" />
            Ja, alle Aktien & Kryptos löschen (Depots behalten)
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white active:opacity-80"
          >
            Aktien & Kryptos löschen
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

      <p className="mt-6 text-center text-xs text-neutral-600">
        Danach kannst du deine echten Trades über „Screenshot-Import" oder „+
        Transaktion" einpflegen.
      </p>
    </div>
  );
}
