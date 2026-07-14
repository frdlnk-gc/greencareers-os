import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Diagnose: prüft, welche Kursquellen vom Server (Vercel) aus erreichbar sind.
// Nur eingeloggt aufrufbar (Middleware schützt die Route). Im Browser öffnen:
//   /api/debug
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36";

async function probe(
  name: string,
  url: string,
  headers?: Record<string, string>,
) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, ...headers },
      cache: "no-store",
    });
    const text = await res.text();
    return {
      name,
      status: res.status,
      ok: res.ok,
      ms: Date.now() - started,
      snippet: text.slice(0, 1400),
    };
  } catch (e) {
    return {
      name,
      error: e instanceof Error ? e.message : String(e),
      ms: Date.now() - started,
    };
  }
}

export async function GET() {
  const fmpKey = process.env.FMP_API_KEY ?? "";
  const fmpSet = fmpKey.length > 0;

  // Deutsche Börsenquellen (frei, in Euro). ISINs decken US, EU und Asien ab.
  const results = await Promise.all([
    // Tradegate – liefert bid/ask/last als kleines JSON, in Euro.
    probe(
      "tradegate_asml_nl",
      "https://www.tradegate.de/refresh.php?isin=NL0010273215",
    ),
    probe(
      "tradegate_novo_dk",
      "https://www.tradegate.de/refresh.php?isin=DK0062498333",
    ),
    probe(
      "tradegate_techtronic_hk",
      "https://www.tradegate.de/refresh.php?isin=HK0669013440",
    ),
    probe(
      "tradegate_shinetsu_jp",
      "https://www.tradegate.de/refresh.php?isin=JP3371200001",
    ),
    probe(
      "tradegate_apple_us",
      "https://www.tradegate.de/refresh.php?isin=US0378331005",
    ),
    // börse-frankfurt API (Xetra/Frankfurt), ebenfalls in Euro.
    probe(
      "bf_asml",
      "https://api.boerse-frankfurt.de/v1/data/quote_box/single?isin=NL0010273215&mic=XETR",
      { Accept: "application/json", Origin: "https://www.boerse-frankfurt.de" },
    ),
    probe(
      "coingecko",
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur",
    ),
    probe(
      "frankfurter_fx",
      "https://api.frankfurter.app/latest?from=EUR&to=USD",
    ),
  ]);

  return NextResponse.json({
    fmpKeySet: fmpSet,
    probes: results,
  });
}
