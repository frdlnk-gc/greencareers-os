"use client";

import { WealthChart } from "./WealthChart";
import { usePerformance } from "@/lib/store";

// Vermögenstracker-Chart (Scope + Modus + Zeitraum). `scope` bestimmt nur die
// Vorauswahl im Dropdown ("total" oder eine Depot-ID) – umschalten geht immer.
export function PerformanceSection({
  scope,
  depotView = false,
}: {
  scope: string;
  depotView?: boolean;
}) {
  const { data } = usePerformance();

  if (!data) {
    return (
      <div className="mt-4 space-y-3">
        <div className="h-7 w-full animate-pulse rounded-lg bg-neutral-900" />
        <div className="h-[150px] w-full animate-pulse rounded-lg bg-neutral-900" />
      </div>
    );
  }

  if (!data.scopes?.length) return null;

  return (
    <div className="mt-4">
      <WealthChart
        scopes={data.scopes}
        initialScopeId={scope}
        depotView={depotView}
      />
    </div>
  );
}
