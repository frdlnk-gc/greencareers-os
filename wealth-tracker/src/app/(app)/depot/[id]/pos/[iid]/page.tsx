import Link from "next/link";
import { notFound } from "next/navigation";
import { getInstrumentDetail } from "@/lib/data";
import { formatEur, formatPct, formatQuantity, changeColor } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { LineChart } from "@/components/LineChart";
import { PeriodPerformance } from "@/components/PeriodPerformance";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  buy: "Kauf",
  sell: "Verkauf",
  dividend: "Dividende",
};

export default async function PositionPage({
  params,
}: {
  params: Promise<{ id: string; iid: string }>;
}) {
  const { id, iid } = await params;
  const detail = await getInstrumentDetail(id, iid);
  if (!detail) notFound();

  const { position: p, priceSeries, periods, transactions, accountName } = detail;
  const price = p.quantity > 0 ? p.valueEur / p.quantity : 0;

  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <Link
          href={`/depot/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 active:opacity-60"
          aria-label="Zurück"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <Avatar label={p.instrument.name} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{p.instrument.name}</h1>
          <p className="text-xs text-neutral-500">
            {p.instrument.display_symbol ?? ""} · {accountName}
          </p>
        </div>
      </header>

      {/* Wert & Entwicklung */}
      <section className="mb-5">
        <div className="tabular text-3xl font-semibold tracking-tight">
          {formatEur(p.valueEur)}
        </div>
        <div className={`mt-1 text-sm tabular ${changeColor(p.changePct1d)}`}>
          {formatPct(p.changePct1d)} heute
        </div>
        <div className="mt-1 text-sm text-neutral-500 tabular">
          {formatPct(p.gainPct)} seit Kauf ({p.gainEur >= 0 ? "+" : ""}
          {formatEur(p.gainEur)})
        </div>
      </section>

      {/* Chart */}
      <section className="mb-5">
        <LineChart points={priceSeries} />
      </section>

      {/* Zeiträume */}
      <section className="mb-6">
        <PeriodPerformance data={periods} />
      </section>

      {/* Kennzahlen */}
      <section className="mb-6 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Stückzahl" value={formatQuantity(p.quantity)} />
        <Metric label="Kurs je Stück" value={formatEur(price)} />
        <Metric label="Eingesetzt" value={formatEur(p.investedEur)} />
        <Metric
          label="Ø Einstand"
          value={formatEur(p.quantity > 0 ? p.investedEur / p.quantity : 0)}
        />
      </section>

      {/* Transaktionen */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Transaktionen</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Noch keine Transaktionen erfasst.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-900 text-sm">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-medium">
                    {TYPE_LABEL[t.type] ?? t.type}
                  </div>
                  <div className="text-xs text-neutral-500 tabular">
                    {t.trade_date}
                    {t.quantity != null
                      ? ` · ${formatQuantity(t.quantity)} × ${formatEur(t.price ?? 0)}`
                      : ""}
                  </div>
                </div>
                <div className="tabular text-right font-medium">
                  {t.amount != null
                    ? formatEur(t.amount)
                    : t.quantity != null && t.price != null
                      ? formatEur(t.quantity * t.price)
                      : "–"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="tabular mt-0.5 font-medium">{value}</div>
    </div>
  );
}
