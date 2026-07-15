"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEur } from "@/lib/format";

// Zinseszins-Rechner mit variablen jährlichen Einzahlungen, wählbarer Rendite
// und Szenarien. Läuft komplett im Browser; Eingaben werden lokal gespeichert.

const RETURN_PRESETS = [5, 7, 8, 12];

type Scenario = "continue" | "stop" | "custom";

interface State {
  start: number;
  annual: number; // Standard-Jahres-Sparrate
  rate: number; // % p.a.
  years: number;
  scenario: Scenario;
  stopAfter: number; // Jahre, ab denen nicht mehr eingezahlt wird
  custom: Record<number, number>; // Jahr-Index -> Einzahlung (Szenario "custom")
}

const STORE_KEY = "wt-projection-v1";

function loadState(fallbackStart: number): State {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) return { ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
  }
  return {
    start: Math.round(fallbackStart),
    annual: 24000,
    rate: 7,
    years: 20,
    scenario: "continue",
    stopAfter: 5,
    custom: {},
  };
}

function contributionForYear(s: State, i: number): number {
  if (s.scenario === "stop") return i < s.stopAfter ? s.annual : 0;
  if (s.scenario === "custom") return s.custom[i] ?? s.annual;
  return s.annual;
}

const inputCls =
  "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-base outline-none focus:border-neutral-600 tabular";

export function ProjectionCalculator({ initialStart }: { initialStart: number }) {
  const [s, setS] = useState<State>(() => loadState(initialStart));
  const [showYears, setShowYears] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);

  const rows = useMemo(() => {
    const out: { year: number; contribution: number; value: number; invested: number }[] = [];
    let v = s.start;
    let invested = s.start;
    const r = s.rate / 100;
    const thisYear = new Date().getFullYear();
    for (let i = 0; i < s.years; i++) {
      const c = contributionForYear(s, i);
      v = v * (1 + r) + c;
      invested += c;
      out.push({ year: thisYear + i + 1, contribution: c, value: v, invested });
    }
    return out;
  }, [s]);

  const final = rows[rows.length - 1];
  const totalInvested = final?.invested ?? s.start;
  const totalGain = (final?.value ?? s.start) - totalInvested;

  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">
      {/* Ergebnis */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
        <div className="text-sm text-neutral-400">
          Prognose in {s.years} Jahren ({s.rate}% p.a.)
        </div>
        <div className="tabular mt-1 text-4xl font-semibold tracking-tight">
          {formatEur(final?.value ?? s.start, false)}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-neutral-500">Eingezahlt</div>
            <div className="tabular font-medium">
              {formatEur(totalInvested, false)}
            </div>
          </div>
          <div>
            <div className="text-neutral-500">Kursgewinn</div>
            <div className="tabular font-medium text-emerald-400">
              {formatEur(totalGain, false)}
            </div>
          </div>
        </div>
        <GrowthChart rows={rows} start={s.start} />
      </section>

      {/* Eingaben */}
      <section className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">
            Startkapital
          </label>
          <input
            value={s.start}
            onChange={(e) => set("start", Number(e.target.value) || 0)}
            inputMode="numeric"
            className={inputCls}
          />
          <button
            onClick={() => set("start", Math.round(initialStart))}
            className="mt-1 text-xs text-emerald-400 active:opacity-60"
          >
            = aktuelles Vermögen ({formatEur(initialStart, false)})
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">
            Jährliche Einzahlung
          </label>
          <input
            value={s.annual}
            onChange={(e) => set("annual", Number(e.target.value) || 0)}
            inputMode="numeric"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">
            Erwartete Rendite p.a.
          </label>
          <div className="flex flex-wrap gap-2">
            {RETURN_PRESETS.map((r) => (
              <button
                key={r}
                onClick={() => set("rate", r)}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  s.rate === r
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-800 text-neutral-300"
                }`}
              >
                {r}%
              </button>
            ))}
            <input
              value={s.rate}
              onChange={(e) => set("rate", Number(e.target.value) || 0)}
              inputMode="decimal"
              className="w-20 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-center text-sm outline-none focus:border-neutral-600 tabular"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">
            Zeitraum: {s.years} Jahre
          </label>
          <input
            type="range"
            min={1}
            max={40}
            value={s.years}
            onChange={(e) => set("years", Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        {/* Szenario */}
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Szenario</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["continue", "Weiter einzahlen"],
                ["stop", "Einzahlung stoppen"],
                ["custom", "Pro Jahr festlegen"],
              ] as [Scenario, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => set("scenario", val)}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  s.scenario === val
                    ? "bg-neutral-100 text-neutral-900"
                    : "bg-neutral-800 text-neutral-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {s.scenario === "stop" && (
            <div className="mt-3">
              <label className="mb-1 block text-xs text-neutral-500">
                Einzahlen für die ersten {s.stopAfter} Jahre
              </label>
              <input
                type="range"
                min={0}
                max={s.years}
                value={s.stopAfter}
                onChange={(e) => set("stopAfter", Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          )}
        </div>
      </section>

      {/* Jahrestabelle */}
      <section>
        <button
          onClick={() => setShowYears((v) => !v)}
          className="mb-2 text-sm font-medium text-neutral-300 active:opacity-60"
        >
          {showYears ? "▾" : "▸"} Jahr-für-Jahr{" "}
          {s.scenario === "custom" ? "(Einzahlung editierbar)" : ""}
        </button>
        {showYears && (
          <ul className="divide-y divide-neutral-900 text-sm">
            {rows.map((row, i) => (
              <li key={row.year} className="flex items-center gap-3 py-2">
                <span className="w-12 text-neutral-500 tabular">{row.year}</span>
                {s.scenario === "custom" ? (
                  <input
                    value={s.custom[i] ?? s.annual}
                    onChange={(e) =>
                      setS((prev) => ({
                        ...prev,
                        custom: { ...prev.custom, [i]: Number(e.target.value) || 0 },
                      }))
                    }
                    inputMode="numeric"
                    className="w-28 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-sm tabular outline-none focus:border-neutral-600"
                  />
                ) : (
                  <span className="w-28 text-neutral-500 tabular">
                    +{formatEur(row.contribution, false)}
                  </span>
                )}
                <span className="flex-1 text-right font-medium tabular">
                  {formatEur(row.value, false)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Kleines Flächendiagramm des Vermögensverlaufs (eingezahlt vs. Gesamtwert).
function GrowthChart({
  rows,
  start,
}: {
  rows: { value: number; invested: number }[];
  start: number;
}) {
  if (rows.length === 0) return null;
  const w = 320;
  const h = 90;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const pts = [{ value: start, invested: start }, ...rows];
  const x = (i: number) => (i / (pts.length - 1)) * w;
  const y = (v: number) => h - (v / max) * h;
  const line = (key: "value" | "invested") =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
  const area = `${line("value")} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-4 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="wtg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wtg)" />
      <path d={line("value")} fill="none" stroke="rgb(16 185 129)" strokeWidth="2" />
      <path
        d={line("invested")}
        fill="none"
        stroke="rgb(115 115 115)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
    </svg>
  );
}
