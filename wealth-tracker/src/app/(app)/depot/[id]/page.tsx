import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortfolio, getPeriodPerformance } from "@/lib/data";
import { formatEur, formatPct, formatQuantity, changeColor } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { PeriodPerformance } from "@/components/PeriodPerformance";
import { LineChart } from "@/components/LineChart";

export const dynamic = "force-dynamic";

export default async function DepotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [portfolio, performance] = await Promise.all([
    getPortfolio(),
    getPeriodPerformance(),
  ]);
  const summary = [...portfolio.accounts, ...portfolio.otherAccounts].find(
    (a) => a.account.id === id,
  );

  if (!summary) notFound();

  const periodData = performance.byAccount[id];

  return (
    <div>
      {/* Kopf mit Zurück + Depotname */}
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
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold">
          {summary.account.name}
        </h1>
        <Link
          href={`/depot/${id}/verwalten`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 active:opacity-60"
          aria-label="Depot verwalten"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
          </svg>
        </Link>
      </header>

      {/* Depotwert */}
      <section className="mb-8">
        <div className="tabular text-4xl font-semibold tracking-tight">
          {formatEur(summary.valueEur)}
        </div>
        <div className={`mt-1 text-sm tabular ${changeColor(summary.changeEur1d)}`}>
          {formatPct(summary.changePct1d)} · {summary.changeEur1d >= 0 ? "+" : ""}
          {formatEur(summary.changeEur1d)} heute
        </div>
        <div className="mt-1 text-sm text-neutral-500 tabular">
          {formatPct(summary.gainPct)} seit Kauf ({summary.gainEur >= 0 ? "+" : ""}
          {formatEur(summary.gainEur)})
        </div>
        {periodData && (
          <div className="mt-4">
            <PeriodPerformance data={periodData} />
          </div>
        )}
        {performance.seriesByAccount[id]?.length >= 2 && (
          <div className="mt-4">
            <LineChart points={performance.seriesByAccount[id]} height={140} />
          </div>
        )}
      </section>

      {/* Positionen */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Positionen</h2>
        <Link
          href={`/depot/${id}/neu`}
          className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-100 active:opacity-70"
        >
          + Transaktion
        </Link>
      </div>
      {summary.positions.length === 0 ? (
        <p className="text-sm text-neutral-500">
          In diesem Depot sind noch keine Positionen erfasst.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-900">
          {summary.positions.map((p) => (
            <li key={p.instrument.id}>
              <Link
                href={`/depot/${id}/pos/${p.instrument.id}`}
                className="flex items-center gap-3 py-4 active:opacity-70"
              >
                <Avatar label={p.instrument.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.instrument.name}</div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span>{p.instrument.display_symbol ?? ""}</span>
                    <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 tabular text-neutral-400">
                      ×{formatQuantity(p.quantity)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="tabular font-medium">
                    {formatEur(p.valueEur)}
                  </div>
                  <div className={`text-xs tabular ${changeColor(p.gainPct)}`}>
                    {formatPct(p.gainPct)}
                  </div>
                </div>
                <svg className="ml-1 shrink-0 text-neutral-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
