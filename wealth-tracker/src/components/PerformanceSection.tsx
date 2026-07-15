"use client";

import { PeriodPerformance } from "./PeriodPerformance";
import { LineChart } from "./LineChart";
import { usePerformance } from "@/lib/store";

// Lädt Zeitraum-Entwicklung + Chart asynchron aus dem Client-Store (blockiert
// die Seite nicht und ist bei Tab-Wechseln sofort da).
export function PerformanceSection({ scope }: { scope: string }) {
  const { data } = usePerformance();

  if (!data) {
    return (
      <div className="mt-4 space-y-3">
        <div className="h-8 w-full animate-pulse rounded-lg bg-neutral-900" />
        <div className="h-[140px] w-full animate-pulse rounded-lg bg-neutral-900" />
      </div>
    );
  }

  const periods = scope === "total" ? data.total : data.byAccount[scope];
  const series =
    scope === "total" ? data.totalSeries : data.seriesByAccount[scope];
  if (!periods) return null;

  return (
    <div className="mt-4">
      <PeriodPerformance data={periods} />
      {series && series.length >= 2 && (
        <div className="mt-4">
          <LineChart points={series} height={140} />
        </div>
      )}
    </div>
  );
}
