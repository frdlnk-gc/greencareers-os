import Link from "next/link";
import { getPortfolio } from "@/lib/data";
import { formatEur, formatPct, changeColor } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const portfolio = await getPortfolio();
  const {
    accounts,
    totalValueEur,
    changeEur1d,
    changePct1d,
    totalGainEur,
    totalGainPct,
  } = portfolio;

  const hasData = accounts.length > 0;

  return (
    <div>
      <AppHeader title="Übersicht" />

      {/* Gesamtvermögen */}
      <section className="mb-8">
        <div className="mb-1 text-sm text-neutral-400">Gesamtvermögen</div>
        <div className="flex items-baseline gap-2">
          <span className="tabular text-4xl font-semibold tracking-tight">
            {formatEur(totalValueEur)}
          </span>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              (changePct1d ?? 0) >= 0 ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
        </div>
        <div className={`mt-1 text-sm tabular ${changeColor(changeEur1d)}`}>
          {formatPct(changePct1d)} · {changeEur1d >= 0 ? "+" : ""}
          {formatEur(changeEur1d)} heute
        </div>
      </section>

      {!hasData ? (
        <EmptyState />
      ) : (
        <section>
          {/* Investitionen-Summe */}
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Investitionen</h2>
            <div className="text-right">
              <div className="tabular text-base font-medium">
                {formatEur(totalValueEur)}
              </div>
              <div className={`text-xs tabular ${changeColor(totalGainEur)}`}>
                {formatPct(totalGainPct)} gesamt
              </div>
            </div>
          </div>

          <ul className="divide-y divide-neutral-900">
            {accounts.map((a) => (
              <li key={a.account.id}>
                <Link
                  href={`/depot/${a.account.id}`}
                  className="flex items-center gap-3 py-4 active:opacity-70"
                >
                  <Avatar label={a.account.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {a.account.name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {a.positions.length}{" "}
                      {a.positions.length === 1 ? "Position" : "Positionen"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular font-medium">
                      {formatEur(a.valueEur)}
                    </div>
                    <div className={`text-xs tabular ${changeColor(a.changePct1d)}`}>
                      {formatPct(a.changePct1d)}
                    </div>
                  </div>
                  <ChevronRight />
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-xs text-neutral-600">
            Tippe oben auf „Aktualisieren" für Live-Kurse · automatische
            Updates folgen
          </p>
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-center">
      <div className="mb-1 font-medium">Noch keine Depots</div>
      <p className="text-sm text-neutral-400">
        Sobald das Startpaket eingespielt ist, erscheinen hier deine Depots
        aggregiert.
      </p>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      className="ml-1 shrink-0 text-neutral-600"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
