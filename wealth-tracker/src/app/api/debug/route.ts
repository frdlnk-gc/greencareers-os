import { NextResponse } from "next/server";
import { SYMBOL_TO_ISIN } from "@/lib/prices/isins";
import { fetchTradegateQuote } from "@/lib/prices/tradegate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Diagnose/Verifikation der ISIN-Liste. Öffentlich (Middleware lässt /api/debug
// durch). Prüft für jedes Symbol:
//  - OpenFIGI: liefert die ISIN den erwarteten Firmennamen? (falsche ISIN -> Name passt nicht)
//  - Tradegate: kommt ein Live-Kurs (EUR) zurück?

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36";

interface FigiEntry {
  data?: { name?: string; ticker?: string }[];
  warning?: string;
}

// OpenFIGI in Blöcken zu 10 (Limit ohne API-Key).
async function openFigiNames(
  isins: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < isins.length; i += 10) {
    const chunk = isins.slice(i, i + 10);
    try {
      const res = await fetch("https://api.openfigi.com/v3/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA },
        body: JSON.stringify(
          chunk.map((isin) => ({ idType: "ID_ISIN", idValue: isin })),
        ),
        cache: "no-store",
      });
      const arr = (await res.json()) as FigiEntry[];
      chunk.forEach((isin, k) => {
        const entry = arr[k];
        const name = entry?.data?.[0]?.name;
        out.set(isin, name ?? (entry?.warning ? `⚠ ${entry.warning}` : "?"));
      });
    } catch (e) {
      chunk.forEach((isin) =>
        out.set(isin, `Fehler: ${e instanceof Error ? e.message : String(e)}`),
      );
    }
  }
  return out;
}

export async function GET() {
  const symbols = Object.keys(SYMBOL_TO_ISIN);
  const isins = symbols.map((s) => SYMBOL_TO_ISIN[s]);

  const [figi, tgResults] = await Promise.all([
    openFigiNames(isins),
    Promise.all(
      symbols.map(async (sym) => {
        try {
          const q = await fetchTradegateQuote(SYMBOL_TO_ISIN[sym]);
          return q ? q.price : null;
        } catch {
          return null;
        }
      }),
    ),
  ]);

  const rows = symbols.map((sym, k) => ({
    symbol: sym,
    isin: SYMBOL_TO_ISIN[sym],
    figiName: figi.get(SYMBOL_TO_ISIN[sym]) ?? "?",
    tradegateEur: tgResults[k],
  }));

  const missingTradegate = rows.filter((r) => r.tradegateEur == null);
  const figiUnknown = rows.filter(
    (r) => r.figiName === "?" || r.figiName.startsWith("⚠"),
  );

  return NextResponse.json({
    count: rows.length,
    missingTradegateCount: missingTradegate.length,
    figiUnknownCount: figiUnknown.length,
    rows,
  });
}
