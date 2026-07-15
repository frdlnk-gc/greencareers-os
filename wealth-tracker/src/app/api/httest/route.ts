import { NextResponse } from "next/server";
import { fetchFmpHistory } from "@/lib/prices/fmp";
import { fetchFrankfurterSeriesToEur } from "@/lib/prices/frankfurter";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Temporär: prüft, ob FMP-Historie + historische FX im Gratis-Tarif liefern.
export async function GET() {
  const key = process.env.FMP_API_KEY ?? "";
  const hist = await fetchFmpHistory("AAPL", key, 30);
  const start = new Date(Date.now() - 800 * 86400000).toISOString().slice(0, 10);
  const fx = await fetchFrankfurterSeriesToEur("USD", start);

  // Twelve Data historische Zeitreihe testen (US-Aktien, Gratis-Tarif).
  const tdKey = process.env.TWELVEDATA_API_KEY ?? "";
  let td: { points: number; sample: unknown; status?: number; snippet?: string } = {
    points: 0,
    sample: null,
  };
  if (tdKey) {
    try {
      const r = await fetch(
        `https://api.twelvedata.com/time_series?symbol=AAPL&interval=1day&outputsize=30&apikey=${tdKey}`,
        { cache: "no-store" },
      );
      const j = await r.json();
      td = {
        status: r.status,
        points: Array.isArray(j?.values) ? j.values.length : 0,
        sample: j?.values?.slice(0, 2) ?? j?.message ?? j?.status ?? null,
        snippet: JSON.stringify(j).slice(0, 300),
      };
    } catch (e) {
      td = { points: 0, sample: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({
    fmpKeySet: key.length > 0,
    fmpHistoryPoints: hist.length,
    fxPoints: fx.length,
    tdKeySet: tdKey.length > 0,
    twelveData: td,
  });
}
