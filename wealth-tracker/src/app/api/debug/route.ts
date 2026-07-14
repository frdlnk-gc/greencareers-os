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
      snippet: text.slice(0, 250),
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

  const tdKey = process.env.TWELVEDATA_API_KEY ?? "";
  const tdSet = tdKey.length > 0;
  const tdProbes = tdSet
    ? [
        probe(
          "td_batch_intl",
          `https://api.twelvedata.com/quote?symbol=AAPL,ASML.AS,MC.PA,NOVO_B.CO,LOTB.BR&apikey=${tdKey}`,
        ),
        probe(
          "td_intl_hk",
          `https://api.twelvedata.com/quote?symbol=0669.HK&apikey=${tdKey}`,
        ),
        probe(
          "td_intl_hk_alt",
          `https://api.twelvedata.com/quote?symbol=0669&exchange=HKEX&apikey=${tdKey}`,
        ),
        probe(
          "td_intl_tokyo",
          `https://api.twelvedata.com/quote?symbol=4063.T&apikey=${tdKey}`,
        ),
        probe(
          "td_usage",
          `https://api.twelvedata.com/api_usage?apikey=${tdKey}`,
        ),
      ]
    : [];

  const results = await Promise.all([
    ...tdProbes,
    probe(
      "stooq_single",
      "https://stooq.com/q/l/?s=aapl.us&f=sd2t2ohlcv&h&e=csv",
    ),
    probe(
      "stooq_multi",
      "https://stooq.com/q/l/?s=aapl.us,asml.nl,mc.fr&f=sd2t2ohlcv&h&e=csv",
    ),
    probe(
      "yahoo_v7",
      "https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL",
    ),
    probe(
      "yahoo_chart",
      "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d",
    ),
    probe(
      "fmp_demo",
      "https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=demo",
    ),
    probe(
      "twelvedata_demo",
      "https://api.twelvedata.com/quote?symbol=AAPL&apikey=demo",
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
    tdKeySet: tdSet,
    probes: results,
  });
}
