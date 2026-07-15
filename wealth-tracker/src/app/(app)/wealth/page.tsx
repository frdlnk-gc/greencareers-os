"use client";

import { AppHeader } from "@/components/AppHeader";
import { ProjectionCalculator } from "@/components/ProjectionCalculator";
import { LoadError } from "@/components/LoadError";
import { usePortfolio } from "@/lib/store";

export default function WealthPage() {
  const { portfolio, error } = usePortfolio();

  return (
    <div>
      <AppHeader title="Prognose" />
      {portfolio ? (
        <ProjectionCalculator initialStart={portfolio.totalValueEur} />
      ) : error ? (
        <LoadError label="Vermögen" />
      ) : (
        <div className="animate-pulse space-y-4">
          <div className="h-44 rounded-2xl bg-neutral-900" />
          <div className="h-12 rounded-xl bg-neutral-900" />
          <div className="h-12 rounded-xl bg-neutral-900" />
        </div>
      )}
    </div>
  );
}
