"use client";

import { useState } from "react";
import { formatEur, formatPct, changeColor } from "@/lib/format";
import { LineChart } from "./LineChart";
import type { WealthScope } from "@/lib/store";

// Vermögenstracker-Chart nach getquin-Vorbild:
//  - Scope: Gesamt (alle Depots) ODER ein einzelnes Depot.
//  - Modus: „Performance" (%-Rendite, zeitgewichtet, Zukäufe rausgerechnet)
//           ODER „Portfoliowert" (€-Wert inkl. Zukäufe).
//  - Zeitraum: 1T/7T/30T/YTD/1J/Max — Kurve UND Kennzahl passen sich an.

type RangeKey = "1T" | "7T" | "30T" | "YTD" | "1J" | "Max";
type Mode = "performance" | "value";
const DAY = 86_400_000;

const RANGES: { key: RangeKey; days: number | null }[] = [
  { key: "1T", days: 1 },
  { key: "7T", days: 7 },
  { key: "30T", days: 30 },
  { key: "YTD", days: null },
  { key: "1J", days: 365 },
  { key: "Max", days: null },
];

export function WealthChart({
  scopes,
  initialScopeId = "total",
}: {
  scopes: WealthScope[];
  initialScopeId?: string;
}) {
  const [scopeId, setScopeId] = useState(
    scopes.some((s) => s.id === initialScopeId)
      ? initialScopeId
      : scopes[0]?.id ?? "total",
  );
  const [mode, setMode] = useState<Mode>("performance");
  const [chosen, setChosen] = useState<RangeKey>("30T");

  const scope = scopes.find((s) => s.id === scopeId) ?? scopes[0];
  if (!scope) return null;

  const { value, invested } = scope.series;
  const nowMs = value.length ? value[value.length - 1][0] : Date.now();

  function startOf(key: RangeKey): number {
    if (key === "Max") return -Infinity;
    if (key === "YTD") {
      const d = new Date(nowMs);
      return new Date(d.getFullYear(), 0, 1).getTime();
    }
    if (key === "1T") return nowMs - 2.2 * DAY;
    const r = RANGES.find((x) => x.key === key)!;
    return nowMs - (r.days as number) * DAY;
  }
  function inWindow(arr: [number, number][], key: RangeKey): [number, number][] {
    const s = startOf(key);
    return arr.filter(([ms]) => ms >= s);
  }
  const earliest = value.length ? value[0][0] : nowMs;
  function isEnabled(key: RangeKey): boolean {
    if (key === "1T")
      return scope.dayChangePct !== null || inWindow(value, "1T").length >= 2;
    // Trailing-Jahres-Zeiträume brauchen echte Historie zurück bis zum
    // Fensterstart – sonst würden sie nur so tun als gäbe es 1 Jahr Daten.
    if (key === "1J") {
      return (
        inWindow(value, key).length >= 2 && earliest <= startOf("1J") + 7 * DAY
      );
    }
    return inWindow(value, key).length >= 2; // 7T, 30T, YTD, Max
  }

  const firstEnabled =
    (["30T", "7T", "1J", "YTD", "Max", "1T"] as RangeKey[]).find(isEnabled) ??
    "Max";
  const active = isEnabled(chosen) ? chosen : firstEnabled;

  const vWin = inWindow(value, active);
  const invWin = inWindow(invested, active);

  // Kennzahl + Chart-Punkte je nach Modus.
  let points: [number, number][] = [];
  let headPct: number | null = null;
  let headEur = 0;

  if (mode === "performance") {
    // kumulierter Gewinn/Verlust gain(t) = Wert(t) − eingesetztes Kapital(t).
    // Über Zukäufe hinweg glatt (Kauf erhöht Wert UND Kapital gleich viel).
    // Auf den Fensterstart genullt -> % und € haben IMMER dasselbe Vorzeichen.
    const gainAt = (i: number) => (vWin[i]?.[1] ?? 0) - (invWin[i]?.[1] ?? 0);
    const base = vWin.length ? Math.max(1, Math.abs(vWin[0][1])) : 1;
    const g0 = gainAt(0);
    points = vWin.map(([ms], i) => [ms, ((gainAt(i) - g0) / base) * 100]);
    if (vWin.length >= 2) {
      headEur = gainAt(vWin.length - 1) - g0;
      headPct = (headEur / base) * 100;
    }
    // 1T: den exakten Tageswert nehmen (Tagesveränderung heute).
    if (active === "1T" && scope.dayChangePct !== null) {
      headPct = scope.dayChangePct;
      const last = value.length ? value[value.length - 1][1] : 0;
      const denom = 1 + scope.dayChangePct / 100;
      headEur = denom > 0 ? last - last / denom : 0;
    }
  } else {
    points = vWin;
    if (vWin.length >= 2) {
      const vStart = vWin[0][1];
      const vEnd = vWin[vWin.length - 1][1];
      headEur = vEnd - vStart;
      headPct = vStart > 0 ? (headEur / vStart) * 100 : null;
    }
  }

  const seg =
    "flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors";

  return (
    <div>
      {/* Scope + Modus */}
      <div className="mb-3 flex items-center gap-2">
        {scopes.length > 1 && (
          <select
            value={scopeId}
            onChange={(e) => setScopeId(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-200 outline-none"
          >
            {scopes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <div className="ml-auto flex w-44 gap-1 rounded-lg bg-neutral-900 p-0.5">
          <button
            onClick={() => setMode("performance")}
            className={`${seg} ${
              mode === "performance"
                ? "bg-neutral-800 text-neutral-100"
                : "text-neutral-500"
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setMode("value")}
            className={`${seg} ${
              mode === "value"
                ? "bg-neutral-800 text-neutral-100"
                : "text-neutral-500"
            }`}
          >
            Wert
          </button>
        </div>
      </div>

      {/* Kennzahl für den gewählten Zeitraum */}
      {headPct !== null ? (
        <div className={`mb-2 text-sm tabular ${changeColor(headPct)}`}>
          {formatPct(headPct)}
          <span className="text-neutral-500">
            {" "}
            · {headEur >= 0 ? "+" : ""}
            {formatEur(headEur)}
          </span>
        </div>
      ) : (
        <div className="mb-2 text-sm text-neutral-600">
          Für diesen Zeitraum liegen keine Kurse vor.
        </div>
      )}

      {/* Chart */}
      {points.length >= 2 ? (
        <LineChart
          points={points}
          height={150}
          format={mode === "performance" ? "pct" : "eur"}
          baseline={mode === "performance" ? 0 : undefined}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/40 text-xs text-neutral-600"
          style={{ height: 150 }}
        >
          Noch keine Kursdaten.
        </div>
      )}

      {/* Zeitraum-Auswahl */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {RANGES.map(({ key }) => {
          const en = isEnabled(key);
          return (
            <button
              key={key}
              disabled={!en}
              onClick={() => setChosen(key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                active === key
                  ? "bg-neutral-100 text-neutral-900"
                  : en
                    ? "bg-neutral-800 text-neutral-400"
                    : "cursor-default bg-neutral-900 text-neutral-700"
              }`}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
