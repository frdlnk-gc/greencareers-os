import { AppHeader } from "@/components/AppHeader";
import { ProjectionCalculator } from "@/components/ProjectionCalculator";
import { getPortfolio } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function WealthPage() {
  const portfolio = await getPortfolio();
  return (
    <div>
      <AppHeader title="Prognose" />
      <ProjectionCalculator initialStart={portfolio.totalValueEur} />
    </div>
  );
}
