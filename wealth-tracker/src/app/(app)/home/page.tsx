"use client";

import Link from "next/link";
import { formatEur, formatPct, changeColor } from "@/lib/format";
import { revalidateAll, usePortfolio } from "@/lib/store";

export default function HomePage() {
  const { portfolio: p, error } = usePortfolio();

  return (
    <div>
      <header className="mb-6 flex items-center gap-2 pt-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-base font-black text-neutral-950">
          C
        </span>
        <h1 className="flex-1 text-2xl font-bold tracking-tight">Compound</h1>
        <Link
          href="/einstellungen"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 active:opacity-60"
          aria-label="Einstellungen"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </header>

      {/* Nettovermögen */}
      <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
        <div className="text-sm text-neutral-400">Gesamtvermögen</div>
        {p ? (
          <>
            <div className="tabular mt-1 text-3xl font-semibold tracking-tight">
              {formatEur(p.totalValueEur)}
            </div>
            <div className={`mt-1 text-sm tabular ${changeColor(p.changeEur1d)}`}>
              {formatPct(p.changePct1d)} · {p.changeEur1d >= 0 ? "+" : ""}
              {formatEur(p.changeEur1d)} heute
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-neutral-500">Investitionen</div>
                <div className="tabular font-medium">
                  {formatEur(p.investmentsValueEur)}
                </div>
              </div>
              <div>
                <div className="text-neutral-500">Weitere Werte</div>
                <div className="tabular font-medium">
                  {formatEur(p.otherAssetsEur)}
                </div>
              </div>
            </div>
          </>
        ) : error ? (
          <button
            onClick={() => revalidateAll()}
            className="mt-2 text-sm text-neutral-400 active:opacity-60"
          >
            Konnte nicht laden – erneut versuchen
          </button>
        ) : (
          <div className="animate-pulse">
            <div className="mt-1 h-9 w-48 rounded bg-neutral-800" />
            <div className="mt-2 h-4 w-32 rounded bg-neutral-800" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="h-10 rounded bg-neutral-800" />
              <div className="h-10 rounded bg-neutral-800" />
            </div>
          </div>
        )}
      </section>

      {/* Schnellzugriff */}
      <h2 className="mb-3 text-lg font-semibold">Schnellzugriff</h2>
      <div className="grid grid-cols-2 gap-3">
        <QuickAction
          href="/import"
          title="Import"
          subtitle="Broker-CSV oder Screenshot"
          accent
        />
        <QuickAction
          href="/"
          title="Depots ansehen"
          subtitle="Alle Positionen im Detail"
        />
        <QuickAction
          href="/neu"
          title="Neues Depot"
          subtitle="Broker, Cash, Sonstiges"
        />
        <QuickAction
          href="/wealth"
          title="Prognose"
          subtitle="Vermögen hochrechnen"
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  subtitle,
  accent,
}: {
  href: string;
  title: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={`rounded-2xl border p-4 active:opacity-70 ${
        accent
          ? "border-emerald-700/60 bg-emerald-600/10"
          : "border-neutral-800 bg-neutral-900/40"
      }`}
    >
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>
    </Link>
  );
}
