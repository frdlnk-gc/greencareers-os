"use client";

import { useState } from "react";
import { formatEur, formatPct, changeColor } from "@/lib/format";
import { PERIODS, type Period, type PeriodResult } from "@/lib/history";

// Umschalter für die Zeitraum-Wertentwicklung. Zeigt für den gewählten
// Zeitraum die prozentuale und absolute Veränderung. Zeiträume ohne genug
// Historie werden als „sammelt Daten" markiert.
export function PeriodPerformance({
  data,
}: {
  data: Record<Period, PeriodResult>;
}) {
  const [period, setPeriod] = useState<Period>("1T");
  const r = data[period];

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              period === p
                ? "bg-neutral-100 text-neutral-900"
                : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      {r.covered && r.pct !== null ? (
        <div className={`text-sm tabular ${changeColor(r.pct)}`}>
          {formatPct(r.pct)}
          {r.changeEur !== null && (
            <span className="text-neutral-500">
              {" "}
              · {r.changeEur >= 0 ? "+" : ""}
              {formatEur(r.changeEur)}
            </span>
          )}
        </div>
      ) : (
        <div className="text-sm text-neutral-600">
          Für diesen Zeitraum liegen keine Kurse vor.
        </div>
      )}
    </div>
  );
}
