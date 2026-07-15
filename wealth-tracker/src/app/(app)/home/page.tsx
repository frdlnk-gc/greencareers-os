import Link from "next/link";
import { getPortfolio } from "@/lib/data";
import { formatEur, formatPct, changeColor } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const p = await getPortfolio();

  return (
    <div>
      <header className="mb-6 pt-2">
        <h1 className="text-2xl font-bold">Übersicht</h1>
      </header>

      {/* Nettovermögen */}
      <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
        <div className="text-sm text-neutral-400">Gesamtvermögen</div>
        <div className="tabular mt-1 text-3xl font-semibold tracking-tight">
          {formatEur(p.totalValueEur)}
        </div>
        <div className={`mt-1 text-sm tabular ${changeColor(p.changeEur1d)}`}>
          {formatPct(p.changePct1d)} · {p.changeEur1d >= 0 ? "+" : ""}
          {formatEur(p.changeEur1d)} heute
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-neutral-500">Investitionen</div>
            <div className="tabular font-medium">
              {formatEur(p.investmentsValueEur)}
            </div>
          </div>
          <div>
            <div className="text-neutral-500">Weitere Werte</div>
            <div className="tabular font-medium">
              {formatEur(p.otherAssetsEur)}
            </div>
          </div>
        </div>
      </section>

      {/* Schnellzugriff */}
      <h2 className="mb-3 text-lg font-semibold">Schnellzugriff</h2>
      <div className="grid grid-cols-2 gap-3">
        <QuickAction
          href="/import"
          title="Screenshot-Import"
          subtitle="Trades aus einem Bild übernehmen"
          accent
        />
        <QuickAction
          href="/"
          title="Depots ansehen"
          subtitle="Alle Positionen im Detail"
        />
        <QuickAction
          href="/neu"
          title="Neues Depot"
          subtitle="Broker, Cash, Sonstiges"
        />
        <QuickAction
          href="/wealth"
          title="Prognose"
          subtitle="Vermögen hochrechnen"
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  subtitle,
  accent,
}: {
  href: string;
  title: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 active:opacity-70 ${
        accent
          ? "border-emerald-700/60 bg-emerald-600/10"
          : "border-neutral-800 bg-neutral-900/40"
      }`}
    >
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>
    </Link>
  );
}
