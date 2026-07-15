"use client";

import { AppHeader } from "@/components/AppHeader";
import { formatEur, formatPct, changeColor } from "@/lib/format";
import type { Position } from "@/lib/types";
import { usePortfolio, useDividends } from "@/lib/store";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const CLASS_LABEL: Record<string, string> = {
  stock: "Aktien",
  etf: "ETFs",
  crypto: "Krypto",
  cash: "Cash",
  other: "Sonstiges",
};

export default function AnalysePage() {
  const { portfolio } = usePortfolio();
  const { data: dividends } = useDividends();

  if (!portfolio) {
    return (
      <div>
        <AppHeader title="Analyse" />
        <div className="animate-pulse space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-neutral-900" />
          ))}
        </div>
      </div>
    );
  }

  // Alle Positionen einsammeln.
  const allPositions: Position[] = portfolio.accounts.flatMap((a) => a.positions);

  // Allokation nach Anlageklasse.
  const byClass = new Map<string, number>();
  for (const p of allPositions) {
    byClass.set(
      p.instrument.kind,
      (byClass.get(p.instrument.kind) ?? 0) + p.valueEur,
    );
  }
  if (portfolio.otherAssetsEur > 0) {
    byClass.set("other", (byClass.get("other") ?? 0) + portfolio.otherAssetsEur);
  }
  const classTotal = [...byClass.values()].reduce((s, v) => s + v, 0) || 1;
  const classRows = [...byClass.entries()]
    .map(([kind, value]) => ({ kind, value, pct: (value / classTotal) * 100 }))
    .sort((a, b) => b.value - a.value);

  // Top-Positionen.
  const topPositions = [...allPositions]
    .sort((a, b) => b.valueEur - a.valueEur)
    .slice(0, 6);
  const investTotal = portfolio.investmentsValueEur || 1;

  // Tagesbewegungen.
  const movers = allPositions
    .filter((p) => p.changePct1d !== null)
    .sort((a, b) => (b.changePct1d ?? 0) - (a.changePct1d ?? 0));
  const winners = movers.slice(0, 3);
  const losers = movers.slice(-3).reverse();

  const maxMonth = Math.max(...(dividends?.byMonthThisYear ?? [0]), 1);

  return (
    <div>
      <AppHeader title="Analyse" />

      {/* Allokation nach Anlageklasse */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Allokation</h2>
        <div className="space-y-3">
          {classRows.map((r) => (
            <div key={r.kind}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{CLASS_LABEL[r.kind] ?? r.kind}</span>
                <span className="tabular text-neutral-400">
                  {formatEur(r.value)} · {r.pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${r.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top-Positionen */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Größte Positionen</h2>
        <ul className="divide-y divide-neutral-900">
          {topPositions.map((p) => (
            <li
              key={p.instrument.id}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{p.instrument.name}</span>
              <span className="tabular ml-3 text-neutral-400">
                {((p.valueEur / investTotal) * 100).toFixed(1)}%
              </span>
              <span className="tabular ml-4 w-24 text-right font-medium">
                {formatEur(p.valueEur)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tagesbewegungen */}
      {movers.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Heute</h2>
          <div className="grid grid-cols-2 gap-4">
            <MoverList title="Gewinner" items={winners} />
            <MoverList title="Verlierer" items={losers} />
          </div>
        </section>
      )}

      {/* Dividenden */}
      <section className="mb-4">
        <h2 className="mb-3 text-lg font-semibold">Dividenden</h2>
        {!dividends ? (
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 rounded-2xl bg-neutral-900" />
              <div className="h-20 rounded-2xl bg-neutral-900" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                <div className="text-xs text-neutral-500">Dieses Jahr</div>
                <div className="tabular mt-1 text-2xl font-semibold">
                  {formatEur(dividends.thisYearTotal)}
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                <div className="text-xs text-neutral-500">Prognose (12 Mon.)</div>
                <div className="tabular mt-1 text-2xl font-semibold text-emerald-400">
                  {formatEur(dividends.forecastAnnual)}
                </div>
              </div>
            </div>

            {dividends.totalAllTime === 0 ? (
              <p className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-400">
                Noch keine Dividenden erfasst. Trage sie als Transaktion vom Typ
                „Dividende" im jeweiligen Depot ein – dann erscheinen hier
                Kalender, Jahressummen und Prognose.
              </p>
            ) : (
              <>
                {/* Monatskalender laufendes Jahr */}
                <div className="mb-4">
                  <div className="mb-2 text-sm text-neutral-400">
                    Kalender {new Date().getFullYear()}
                  </div>
                  <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                    {dividends.byMonthThisYear.map((v, i) => (
                      <div
                        key={i}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className="w-full rounded-t bg-emerald-500/80"
                            style={{ height: `${(v / maxMonth) * 100}%` }}
                            title={formatEur(v)}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-600">
                          {MONTHS[i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jahressummen */}
                <div className="mb-4">
                  <div className="mb-2 text-sm text-neutral-400">Pro Jahr</div>
                  <ul className="divide-y divide-neutral-900 text-sm">
                    {dividends.byYear.map((y) => (
                      <li key={y.year} className="flex justify-between py-2">
                        <span className="tabular text-neutral-400">{y.year}</span>
                        <span className="tabular font-medium">
                          {formatEur(y.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function MoverList({ title, items }: { title: string; items: Position[] }) {
  return (
    <div>
      <div className="mb-2 text-xs text-neutral-500">{title}</div>
      <ul className="space-y-2">
        {items.map((p) => (
          <li
            key={p.instrument.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="min-w-0 flex-1 truncate">
              {p.instrument.name}
              {p.instrument.display_symbol ? (
                <span className="ml-1 text-xs text-neutral-500">
                  {p.instrument.display_symbol}
                </span>
              ) : null}
            </span>
            <span className={`tabular ml-2 ${changeColor(p.changePct1d)}`}>
              {formatPct(p.changePct1d)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
