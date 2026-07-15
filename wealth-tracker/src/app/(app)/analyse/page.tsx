"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ScopeSelect } from "@/components/ScopeSelect";
import { Donut, colorForName } from "@/components/Donut";
import { DividendsView } from "@/components/DividendsView";
import { LoadError } from "@/components/LoadError";
import { formatEur } from "@/lib/format";
import { usePortfolio, useDividends } from "@/lib/store";

export default function AnalysePage() {
  const { portfolio, error } = usePortfolio();
  const { data: dividends } = useDividends();
  const [selected, setSelected] = useState<string[]>([]);

  if (!portfolio) {
    return (
      <div>
        <AppHeader title="Analyse" />
        {error ? (
          <LoadError label="Analyse" />
        ) : (
          <div className="animate-pulse space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-neutral-900" />
            ))}
          </div>
        )}
      </div>
    );
  }

  const accounts = portfolio.accounts.map((a) => ({
    id: a.account.id,
    name: a.account.name,
  }));
  const selectedIds =
    selected.length > 0
      ? new Set(selected)
      : new Set(accounts.map((a) => a.id));

  // Allokation je Position (über die gewählten Depots aggregiert).
  const byInstrument = new Map<string, { name: string; value: number }>();
  for (const a of portfolio.accounts) {
    if (!selectedIds.has(a.account.id)) continue;
    for (const p of a.positions) {
      const cur = byInstrument.get(p.instrument.id) ?? {
        name: p.instrument.name,
        value: 0,
      };
      cur.value += p.valueEur;
      byInstrument.set(p.instrument.id, cur);
    }
  }
  const segments = [...byInstrument.values()]
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((x) => ({ label: x.name, value: x.value, color: colorForName(x.name) }));
  const allocTotal = segments.reduce((s, x) => s + x.value, 0);

  // Dividenden nach Scope filtern.
  const divEvents = (dividends?.events ?? []).filter((e) =>
    selectedIds.has(e.accountId),
  );
  // Run-Rate (letzte 12 Monate, ausgezahlt) + eingesetztes Kapital im Scope –
  // für Dividendenrendite / Yield on Cost.
  const yearMs = 365 * 86_400_000;
  const nowMs = Date.now();
  const divRunRate = divEvents
    .filter(
      (e) => e.status === "paid" && nowMs - new Date(e.date).getTime() <= yearMs,
    )
    .reduce((s, e) => s + e.amountEur, 0);
  const scopeInvestCost = portfolio.accounts
    .filter((a) => selectedIds.has(a.account.id))
    .reduce((s, a) => s + a.investedEur, 0);

  return (
    <div>
      <AppHeader title="Analyse" />

      {/* Scope-Auswahl */}
      <div className="mb-4">
        <ScopeSelect
          accounts={accounts}
          selected={selected}
          onChange={setSelected}
        />
      </div>

      {/* Allokation */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Allokation</h2>
        {segments.length === 0 ? (
          <p className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-400">
            Keine Positionen in der Auswahl.
          </p>
        ) : (
          <>
            <Donut
              segments={segments}
              centerTitle={formatEur(allocTotal, false)}
              centerSubtitle="Portfoliowert"
            />
            <ul className="mt-6 space-y-2.5">
              {segments.map((s) => (
                <li key={s.label} className="flex items-center gap-3 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">{s.label}</span>
                  <span className="tabular text-neutral-400">
                    {((s.value / (allocTotal || 1)) * 100).toFixed(1)}%
                  </span>
                  <span className="tabular w-24 text-right font-medium">
                    {formatEur(s.value)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Dividenden */}
      <section className="mb-4">
        <h2 className="mb-4 text-lg font-semibold">Dividenden</h2>
        <DividendsView
          events={divEvents}
          forecastAnnual={divRunRate}
          investValue={allocTotal}
          investCost={scopeInvestCost}
        />
      </section>
    </div>
  );
}
