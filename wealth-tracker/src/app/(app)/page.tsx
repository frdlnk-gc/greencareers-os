"use client";

import Link from "next/link";
import { formatEur, formatPct, changeColor } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { AppHeader } from "@/components/AppHeader";
import { AutoRefresh } from "@/components/AutoRefresh";
import { LastUpdated } from "@/components/LastUpdated";
import { PerformanceSection } from "@/components/PerformanceSection";
import { usePortfolio } from "@/lib/store";

export default function OverviewPage() {
  const { portfolio } = usePortfolio();

  if (!portfolio) {
    return (
      <div>
        <AppHeader title="Übersicht" />
        <OverviewSkeleton />
      </div>
    );
  }

  const lastUpdatedMs = portfolio.lastUpdate
    ? new Date(portfolio.lastUpdate).getTime()
    : null;
  const {
    accounts,
    otherAccounts,
    totalValueEur,
    investmentsValueEur,
    otherAssetsEur,
    changeEur1d,
    changePct1d,
    totalGainEur,
    totalGainPct,
  } = portfolio;

  const hasData = accounts.length > 0 || otherAccounts.length > 0;

  return (
    <div>
      <AutoRefresh lastUpdatedMs={lastUpdatedMs} />
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
        <div className="mt-1">
          <LastUpdated iso={portfolio.lastUpdate} />
        </div>
        <PerformanceSection scope="total" />
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
                {formatEur(investmentsValueEur)}
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
                  prefetch
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

          <Link
            href="/neu"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 active:opacity-70"
          >
            <span className="text-lg leading-none">+</span> Neues Depot
          </Link>

          {/* Weitere Werte: Cash, Verbindlichkeiten, Sonstiges */}
          <div className="mt-8 mb-2 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Weitere Werte</h2>
            <div className="tabular text-base font-medium">
              {formatEur(otherAssetsEur)}
            </div>
          </div>
          {otherAccounts.length > 0 && (
            <ul className="divide-y divide-neutral-900">
              {otherAccounts.map((a) => (
                <li key={a.account.id}>
                  <Link
                    href={`/depot/${a.account.id}`}
                    prefetch
                    className="flex items-center gap-3 py-4 active:opacity-70"
                  >
                    <Avatar label={a.account.name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {a.account.name}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {a.account.type === "cash" ? "Cash" : "Sonstiges"}
                      </div>
                    </div>
                    <div
                      className={`tabular text-right font-medium ${
                        a.valueEur < 0 ? "text-red-400" : ""
                      }`}
                    >
                      {formatEur(a.valueEur)}
                    </div>
                    <ChevronRight />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/neu"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 active:opacity-70"
          >
            <span className="text-lg leading-none">+</span> Cash / Verbindlichkeit
            / Sonstiges
          </Link>

          <p className="mt-6 text-center text-xs text-neutral-600">
            Nach unten ziehen für Live-Kurse
          </p>
        </section>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="mb-2 h-4 w-32 rounded bg-neutral-900" />
        <div className="mb-2 h-10 w-56 rounded bg-neutral-900" />
        <div className="h-4 w-40 rounded bg-neutral-900" />
        <div className="mt-4 h-8 w-full rounded-lg bg-neutral-900" />
        <div className="mt-4 h-[140px] w-full rounded-lg bg-neutral-900" />
      </div>
      <div className="mb-2 h-7 w-40 rounded bg-neutral-900" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="h-11 w-11 rounded-full bg-neutral-900" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-neutral-900" />
              <div className="h-3 w-20 rounded bg-neutral-900" />
            </div>
            <div className="h-4 w-16 rounded bg-neutral-900" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-center">
      <div className="mb-1 font-medium">Noch keine Depots</div>
      <p className="mb-4 text-sm text-neutral-400">
        Lege dein erstes Depot an und erfasse deine Positionen.
      </p>
      <Link
        href="/neu"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white active:opacity-80"
      >
        <span className="text-lg leading-none">+</span> Neues Depot
      </Link>
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
