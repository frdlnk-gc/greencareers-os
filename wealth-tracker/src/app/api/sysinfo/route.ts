import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Interner Diagnose-Endpunkt (temporär): nennt das Supabase-Projekt, prüft ob
// die Verlaufs-Tabelle existiert und auditiert die Krypto-IDs gegen CoinGecko.

// Krypto-IDs wie im Seed (id -> erwartetes Kürzel).
const CRYPTO: [string, string][] = [
  ["bitcoin", "BTC"], ["ethereum", "ETH"], ["cardano", "ADA"], ["aave", "AAVE"],
  ["hedera-hashgraph", "HBAR"], ["chainlink", "LINK"], ["ocean-protocol", "OCEAN"],
  ["quant-network", "QNT"], ["avalanche-2", "AVAX"], ["uniswap", "UNI"],
  ["the-sandbox", "SAND"], ["polkadot", "DOT"], ["axie-infinity", "AXS"],
  ["kusama", "KSM"], ["internet-computer", "ICP"], ["crypto-com-chain", "CRO"],
  ["moonriver", "MOVR"], ["lisk", "LSK"], ["band-protocol", "BAND"],
  ["celestia", "TIA"], ["matic-network", "MATIC"], ["trias-token", "TRIAS"],
  ["ronin", "RON"], ["constellation-labs", "DAG"], ["harmony", "ONE"],
  ["utrust", "UTK"], ["aurora-near", "AURORA"], ["aleph", "ALEPH"],
  ["boba-network", "BOBA"], ["renzo", "REZ"],
];

export async function GET() {
  const supabaseHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
    } catch {
      return null;
    }
  })();
  const serviceKeySet = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length > 0;
  const anthropicKeySet = (process.env.ANTHROPIC_API_KEY ?? "").length > 0;

  // Existiert price_history? (Fehlercode 42P01 = Tabelle fehlt)
  let historyTable = "unbekannt";
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("price_history")
      .select("instrument_id", { head: true, count: "exact" });
    historyTable = error ? `fehlt/kein Zugriff: ${error.code ?? error.message}` : "vorhanden";
  } catch (e) {
    historyTable = `Fehler: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Krypto-IDs gegen CoinGecko prüfen (ein Request).
  const ids = CRYPTO.map(([id]) => id);
  let cryptoAudit: unknown[] = [];
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${ids.join(",")}&per_page=250`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    const list = (await res.json()) as { id: string; symbol: string; current_price: number }[];
    const byId = new Map(list.map((c) => [c.id, c]));
    cryptoAudit = CRYPTO.map(([id, expSym]) => {
      const got = byId.get(id);
      return {
        id,
        expectedSym: expSym,
        gotSym: got?.symbol?.toUpperCase() ?? null,
        priceEur: got?.current_price ?? null,
        ok: got ? got.symbol.toUpperCase() === expSym.toUpperCase() : false,
      };
    });
  } catch (e) {
    cryptoAudit = [{ error: e instanceof Error ? e.message : String(e) }];
  }

  const problems = (cryptoAudit as { ok?: boolean; id?: string }[]).filter(
    (c) => c.ok === false,
  );

  return NextResponse.json({
    supabaseHost,
    serviceKeySet,
    anthropicKeySet,
    historyTable,
    cryptoProblems: problems,
    cryptoAudit,
  });
}
