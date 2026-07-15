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
  return NextResponse.json({
    keySet: key.length > 0,
    fmpHistoryPoints: hist.length,
    fmpSample: hist.slice(0, 3),
    fxPoints: fx.length,
    fxSample: fx.slice(-2),
  });
}
