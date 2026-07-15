"use client";

import { useMemo, useState } from "react";
import { formatEur, formatMoney, formatPct } from "@/lib/format";
import { colorForName } from "./Donut";
import type { DividendEvent } from "@/lib/data";

const MONTHS = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

// Dividenden-Ansicht nach getquin-Vorbild: Jahres-Tabs, Balkendiagramm (pro
// Monat im Jahr, pro Jahr bei All-Time) mit Ø-Linie und eine Aufschlüsselung.
// Zeigt die tatsächlich erfassten („ausgezahlten") Dividenden.
export function DividendsView({ events }: { events: DividendEvent[] }) {
  const years = useMemo(() => {
    const s = new Set<number>();
    for (const e of events) s.add(new Date(e.date).getFullYear());
    return [...s].sort((a, b) => b - a);
  }, [events]);

  const thisYear = new Date().getFullYear();
  const [tab, setTab] = useState<string>(
    years.includes(thisYear) ? String(thisYear) : years.length ? String(years[0]) : "all",
  );
  const activeTab =
    tab === "all" || years.includes(Number(tab))
      ? tab
      : years.length
        ? String(years[0])
        : "all";

  if (events.length === 0) {
    return (
      <p className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-400">
        Noch keine Dividenden erfasst. Trage sie als Transaktion vom Typ
        „Dividende" bei der jeweiligen Position ein – dann erscheinen hier
        Kalender, Balken und Aufschlüsselung.
      </p>
    );
  }

  // Summe für (Jahr, optional Monat).
  const sumFor = (year: number, month?: number) =>
    events.reduce((s, e) => {
      const d = new Date(e.date);
      if (d.getFullYear() !== year) return s;
      if (month !== undefined && d.getMonth() !== month) return s;
      return s + e.amountEur;
    }, 0);

  const tabs = ["all", ...years.map((y) => String(y))];

  return (
    <div>
      {/* Jahres-Tabs */}
      <div className="mb-4 flex gap-4 overflow-x-auto border-b border-neutral-900 pb-2 text-sm">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 pb-1 font-semibold ${
              activeTab === t
                ? "border-b-2 border-neutral-100 text-neutral-100"
                : "text-neutral-500"
            }`}
          >
            {t === "all" ? "All-Time" : t}
          </button>
        ))}
      </div>

      {activeTab === "all" ? (
        <AllTimeView events={events} years={years} sumFor={sumFor} />
      ) : (
        <YearView
          events={events}
          year={Number(activeTab)}
          sumFor={sumFor}
        />
      )}
    </div>
  );
}

// --- Jahresansicht: Monatsbalken + Monats-Aufschlüsselung -------------------
function YearView({
  events,
  year,
  sumFor,
}: {
  events: DividendEvent[];
  year: number;
  sumFor: (y: number, m?: number) => number;
}) {
  const monthTotals = Array.from({ length: 12 }, (_, m) => sumFor(year, m));
  const yearTotal = monthTotals.reduce((s, v) => s + v, 0);
  const monthsWithData = monthTotals.filter((v) => v > 0).length || 1;
  const avg = yearTotal / monthsWithData;
  const maxMonth = Math.max(...monthTotals, 1);

  // Gestapelte Segmente je Monat (Farbe je Position).
  const stacks = Array.from({ length: 12 }, (_, m) =>
    events
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === m;
      })
      .sort((a, b) => b.amountEur - a.amountEur),
  );

  const prevYearTotal = sumFor(year - 1);
  const yoy = prevYearTotal > 0 ? ((yearTotal - prevYearTotal) / prevYearTotal) * 100 : null;

  // Monate mit Daten, absteigend.
  const monthsDesc = [...Array(12).keys()].filter((m) => monthTotals[m] > 0).reverse();

  return (
    <div>
      <div className="mb-1 text-right text-xs text-neutral-500">
        Ø {formatEur(avg)}
      </div>
      <div className="relative mb-6 flex items-end gap-1.5" style={{ height: 130 }}>
        {/* Ø-Linie */}
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-neutral-700"
          style={{ bottom: `${(avg / maxMonth) * 100}%` }}
        />
        {monthTotals.map((tot, m) => (
          <div key={m} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-t"
                style={{ height: `${(tot / maxMonth) * 100}%` }}
                title={formatEur(tot)}
              >
                {stacks[m].map((e, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${(e.amountEur / (tot || 1)) * 100}%`,
                      background: colorForName(e.instrumentName),
                    }}
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-neutral-600">{MONTHS[m]}</span>
          </div>
        ))}
      </div>

      {/* Aufschlüsselung je Monat */}
      <div className="space-y-5">
        {monthsDesc.map((m) => {
          const prevMonth = sumFor(year - 1, m);
          const mYoy =
            prevMonth > 0 ? ((monthTotals[m] - prevMonth) / prevMonth) * 100 : null;
          return (
            <div key={m}>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">
                  {fullMonth(m)}
                </h3>
                <div className="text-right">
                  <div className="tabular font-medium">
                    {formatEur(monthTotals[m])}
                  </div>
                  {mYoy !== null && (
                    <div className={`text-xs tabular ${mYoy >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatPct(mYoy)}
                    </div>
                  )}
                </div>
              </div>
              <ul className="space-y-2.5">
                {stacks[m].map((e, i) => (
                  <DividendRow key={i} e={e} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 border-t border-neutral-800 pt-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Jährliche Nettodividenden</span>
          <span className="tabular font-semibold">{formatEur(yearTotal)}</span>
        </div>
        {yoy !== null && (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-neutral-400">YoY-Wachstum</span>
            <span className={`tabular ${yoy >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatPct(yoy)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- All-Time: Jahresbalken + Positions-Aufschlüsselung ---------------------
function AllTimeView({
  events,
  years,
  sumFor,
}: {
  events: DividendEvent[];
  years: number[];
  sumFor: (y: number, m?: number) => number;
}) {
  const yearsAsc = [...years].sort((a, b) => a - b);
  const totals = yearsAsc.map((y) => sumFor(y));
  const allTotal = totals.reduce((s, v) => s + v, 0);
  const avg = allTotal / (yearsAsc.length || 1);
  const maxYear = Math.max(...totals, 1);

  // Summe je Position (all-time).
  const byInstrument = new Map<string, number>();
  for (const e of events) {
    byInstrument.set(
      e.instrumentName,
      (byInstrument.get(e.instrumentName) ?? 0) + e.amountEur,
    );
  }
  const rows = [...byInstrument.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const stacksByYear = yearsAsc.map((y) =>
    events
      .filter((e) => new Date(e.date).getFullYear() === y)
      .sort((a, b) => b.amountEur - a.amountEur),
  );

  return (
    <div>
      <div className="mb-1 text-right text-xs text-neutral-500">
        Ø {formatEur(avg)}
      </div>
      <div className="relative mb-6 flex items-end gap-2" style={{ height: 130 }}>
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-neutral-700"
          style={{ bottom: `${(avg / maxYear) * 100}%` }}
        />
        {yearsAsc.map((y, idx) => (
          <div key={y} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-t"
                style={{ height: `${(totals[idx] / maxYear) * 100}%` }}
                title={formatEur(totals[idx])}
              >
                {stacksByYear[idx].map((e, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${(e.amountEur / (totals[idx] || 1)) * 100}%`,
                      background: colorForName(e.instrumentName),
                    }}
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-neutral-600">{y}</span>
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-lg font-semibold">Nach Position</h3>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: colorForName(r.name) }}
            />
            <span className="min-w-0 flex-1 truncate">{r.name}</span>
            <span className="tabular font-medium">{formatEur(r.total)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-4">
        <span className="font-semibold">Gesamteinnahmen netto</span>
        <span className="tabular font-semibold">{formatEur(allTotal)}</span>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<
  DividendEvent["status"],
  { label: string; cls: string }
> = {
  paid: { label: "Ausgezahlt", cls: "bg-emerald-500/15 text-emerald-400" },
  announced: { label: "Angekündigt", cls: "bg-neutral-700/40 text-neutral-300" },
  forecast: { label: "Prognose", cls: "bg-violet-500/15 text-violet-300" },
};

function DividendRow({ e }: { e: DividendEvent }) {
  const d = new Date(e.date);
  const perShare =
    e.quantity && e.quantity !== 0 && e.amountOrig != null
      ? e.amountOrig / e.quantity
      : null;
  const st = STATUS_STYLE[e.status];
  return (
    <li className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-neutral-300"
        style={{ background: "rgb(38 38 38)" }}
      >
        {e.instrumentName.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{e.instrumentName}</span>
          <span
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${st.cls}`}
          >
            {st.label}
          </span>
        </div>
        <div className="text-xs text-neutral-500 tabular">
          {d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
          {perShare !== null
            ? ` · ${formatMoney(perShare, e.currency)} × ${e.quantity}`
            : ""}
        </div>
      </div>
      <span className="tabular shrink-0 font-medium">
        {formatEur(e.amountEur)}
      </span>
    </li>
  );
}

function fullMonth(m: number): string {
  return [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ][m];
}
