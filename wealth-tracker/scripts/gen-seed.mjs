// Generiert supabase/seed.sql aus den echten Positionen (aus den Screenshots).
//
// Hinweise:
// - Werte (valueEur) und Gewinn seit Kauf (gainPct) stammen aus den GetQuin-
//   Screenshots. Daraus werden Einstand und Kurs je Stück abgeleitet, sodass
//   die Übersicht sofort realistisch aussieht.
// - Instrumente werden in EUR angelegt (Phase-1-Startdaten). In Phase 2
//   ersetzen echte Kurse in Landeswährung diese Startwerte; yahoo_symbol /
//   coingecko_id sind bereits korrekt hinterlegt.
// - Die Zuordnung Position -> Depot ist eine plausible Demo-Zuordnung.
//   Die echte Zuordnung kommt über den Screenshot-Import (Phase 3).

import { writeFileSync } from "node:fs";

// Depots (Reihenfolge = Anzeige-Reihenfolge)
const accounts = [
  { key: "tr", name: "Trade Republic", type: "broker" },
  { key: "captrader", name: "CapTrader", type: "broker" },
  { key: "flatex", name: "Flatex", type: "broker" },
  { key: "projectx", name: "Project X", type: "broker" },
  { key: "krypto", name: "Krypto", type: "crypto" },
];

// Positionen: [name, displaySymbol, qty, valueEur, gainPct, kind, yahoo|coingecko, account]
// kind: 'stock' | 'crypto'
const P = (name, sym, qty, value, gain, kind, id, account) => ({
  name, sym, qty, value, gain, kind, id, account,
});

const positions = [
  // --- Aktien: Trade Republic ---
  P("ASML Holding", "ASML", 10, 15557.96, 149.45, "stock", "ASML.AS", "tr"),
  P("Alphabet Inc. Class A", "GOOGL", 39.97, 12257.80, 176.03, "stock", "GOOGL", "tr"),
  P("Cloudflare", "NET", 50, 11465.00, 262.09, "stock", "NET", "tr"),
  P("BE Semiconductor Industries", "BESI", 45, 11304.00, 160.85, "stock", "BESI.AS", "tr"),
  P("Lotus Bakeries", "LOTB", 1, 10960.00, 27.02, "stock", "LOTB.BR", "tr"),
  P("Novo Nordisk B", "NOVO B", 250, 10703.13, -11.18, "stock", "NOVO-B.CO", "tr"),
  P("Merck & Co.", "MRK", 77, 10670.00, 5.0, "stock", "MRK", "tr"),
  P("MercadoLibre", "MELI", 6, 9713.40, -7.97, "stock", "MELI", "tr"),
  P("Constellation Software", "CSU", 5, 8437.50, 0.08, "stock", "CSU.TO", "tr"),
  P("Moderna", "MRNA", 130, 7716.15, 76.14, "stock", "MRNA", "tr"),
  P("PepsiCo", "PEP", 60, 7268.40, -7.03, "stock", "PEP", "tr"),
  P("Techtronic Industries", "669", 500, 6990.00, 27.90, "stock", "0669.HK", "tr"),
  P("Medpace Holdings", "MEDP", 15, 6972.00, 75.75, "stock", "MEDP", "tr"),
  P("HubSpot", "HUBS", 40, 6950.00, -21.21, "stock", "HUBS", "tr"),
  P("Automatic Data Processing", "ADP", 30, 6470.00, 40.39, "stock", "ADP", "tr"),

  // --- Aktien: CapTrader ---
  P("First Financial Bankshares", "FFIN", 210, 6384.00, 8.69, "stock", "FFIN", "captrader"),
  P("ServiceNow", "NOW", 70, 6309.80, -6.55, "stock", "NOW", "captrader"),
  P("Nurix Therapeutics", "NRIX", 300, 5975.70, 38.65, "stock", "NRIX", "captrader"),
  P("Carlisle Companies", "CSL", 20, 5842.00, -5.30, "stock", "CSL", "captrader"),
  P("Anta Sports Products", "2020", 700, 5810.70, -13.67, "stock", "2020.HK", "captrader"),
  P("Public Storage", "PSA", 20, 5613.00, 3.72, "stock", "PSA", "captrader"),
  P("Shin-Etsu Chemical", "4063", 130, 5284.83, 64.72, "stock", "4063.T", "captrader"),
  P("Microsoft", "MSFT", 15.9, 5281.48, 19.05, "stock", "MSFT", "captrader"),
  P("California Water Service", "CWT", 120, 5230.00, 3.0, "stock", "CWT", "captrader"),
  P("Reddit", "RDDT", 30, 5175.00, 19.15, "stock", "RDDT", "captrader"),
  P("Gorilla Technology Group", "GRRR", 350, 5062.20, 17.80, "stock", "GRRR", "captrader"),
  P("Procter & Gamble", "PG", 38, 4932.02, -4.63, "stock", "PG", "captrader"),
  P("United Parcel Service", "UPS", 50, 4923.00, 17.94, "stock", "UPS", "captrader"),
  P("Hermès International", "RMS", 3, 4915.50, -27.34, "stock", "RMS.PA", "captrader"),
  P("Diploma", "DPLM", 60, 4848.00, 131.52, "stock", "DPLM.L", "captrader"),
  P("LVMH", "MC", 10, 4836.25, -6.48, "stock", "MC.PA", "captrader"),
  P("SoFi Technologies", "SOFI", 300, 4799.40, 1.76, "stock", "SOFI", "captrader"),
  P("McDonald's", "MCD", 20, 4750.00, 12.0, "stock", "MCD", "captrader"),
  P("Kesko B", "KESKOB", 240, 4718.40, 3.24, "stock", "KESKOB.HE", "captrader"),
  P("London Stock Exchange Group", "LSEG", 45, 4669.88, -0.42, "stock", "LSEG.L", "captrader"),
  P("DHL Group", "DHL", 80, 4568.80, 31.16, "stock", "DHL.DE", "captrader"),
  P("Rivian Automotive", "RIVN", 300, 4544.70, 4.07, "stock", "RIVN", "captrader"),
  P("BlackRock", "BLK", 5, 4503.00, 7.66, "stock", "BLK", "captrader"),
  P("Bonesupport Holding", "BONEX", 200, 4224.00, -0.74, "stock", "BONEX.ST", "captrader"),
  P("Balchem", "BCPC", 30, 4222.50, 2.70, "stock", "BCPC", "captrader"),
  P("3M", "MMM", 30, 4148.25, 45.65, "stock", "MMM", "captrader"),

  // --- Aktien: Project X ---
  P("Colgate-Palmolive", "CL", 50, 4070.00, 5.0, "stock", "CL", "projectx"),
  P("Adobe", "ADBE", 20, 3810.60, -41.15, "stock", "ADBE", "projectx"),
  P("Synopsys", "SNPS", 10, 3685.00, 2.23, "stock", "SNPS", "projectx"),
  P("Hershey", "HSY", 23, 3522.45, -12.96, "stock", "HSY", "projectx"),
  P("Mainfreight", "MFT", 105, 3328.50, -4.00, "stock", "MFT.NZ", "projectx"),
  P("Joby Aviation", "JOBY", 500, 3312.50, -25.72, "stock", "JOBY", "projectx"),
  P("Costco Wholesale", "COST", 4, 3238.00, 67.17, "stock", "COST", "projectx"),
  P("Air Products & Chemicals", "APD", 12, 3165.00, 4.02, "stock", "APD", "projectx"),
  P("Chugai Pharmaceutical", "4519", 80, 3141.20, 55.20, "stock", "4519.T", "projectx"),
  P("Waste Connections", "WCN", 20, 2970.00, 10.0, "stock", "WCN", "projectx"),

  // --- Aktien: Flatex ---
  P("Mid-America Apartment Communities", "MAA", 25, 2961.25, -5.85, "stock", "MAA", "flatex"),
  P("British American Tobacco", "BATS", 49, 2528.40, 36.76, "stock", "BATS.L", "flatex"),
  P("BKW", "BKW", 17, 2475.20, 1.58, "stock", "BKW.SW", "flatex"),
  P("Abbott Laboratories", "ABT", 30, 2393.70, -20.54, "stock", "ABT", "flatex"),
  P("Wolters Kluwer", "WKL", 21, 1264.83, -60.44, "stock", "WKL.AS", "flatex"),
  P("Virgin Galactic", "SPCE", 500, 1083.00, -47.61, "stock", "SPCE", "flatex"),

  // --- Krypto ---
  P("Bitcoin", "BTC", 0.688, 38395.87, 58.40, "crypto", "bitcoin", "krypto"),
  P("Ethereum", "ETH", 5.636, 9158.83, -7.14, "crypto", "ethereum", "krypto"),
  P("Cardano", "ADA", 7018.04, 994.23, -79.17, "crypto", "cardano", "krypto"),
  P("Aave", "AAVE", 8, 688.86, -41.94, "crypto", "aave", "krypto"),
  P("Hedera", "HBAR", 10503.99, 620.00, -60.0, "crypto", "hedera-hashgraph", "krypto"),
  P("Chainlink", "LINK", 70, 501.66, -54.52, "crypto", "chainlink", "krypto"),
  P("Ocean Protocol", "OCEAN", 4187.88, 402.77, -79.92, "crypto", "ocean-protocol", "krypto"),
  P("Quant", "QNT", 6.518, 368.01, -61.80, "crypto", "quant-network", "krypto"),
  P("Avalanche", "AVAX", 57.11, 328.30, -81.50, "crypto", "avalanche-2", "krypto"),
  P("Uniswap", "UNI", 66, 212.98, -75.86, "crypto", "uniswap", "krypto"),
  P("The Sandbox", "SAND", 3047.71, 126.65, -89.84, "crypto", "the-sandbox", "krypto"),
  P("Polkadot", "DOT", 123.71, 91.40, -93.54, "crypto", "polkadot", "krypto"),
  P("Axie Infinity", "AXS", 98.53, 84.52, -85.36, "crypto", "axie-infinity", "krypto"),
  P("Kusama", "KSM", 25.08, 72.68, -92.56, "crypto", "kusama", "krypto"),
  P("Internet Computer", "ICP", 33.18, 64.33, -83.17, "crypto", "internet-computer", "krypto"),
  P("Cronos", "CRO", 1210.1, 58.48, -90.04, "crypto", "crypto-com-chain", "krypto"),
  P("Moonriver", "MOVR", 43.78, 50.29, -96.36, "crypto", "moonriver", "krypto"),
  P("Lisk", "LSK", 660.84, 49.85, -91.36, "crypto", "lisk", "krypto"),
  P("Band Protocol", "BAND", 295.32, 44.18, -90.03, "crypto", "band-protocol", "krypto"),
  P("Celestia", "TIA", 120.9, 42.52, -92.64, "crypto", "celestia", "krypto"),
  P("Polygon (POL)", "MATIC", 250, 40.00, -90.0, "crypto", "matic-network", "krypto"),
  P("Trias Token", "TRIAS", 78.64, 23.64, -97.17, "crypto", "trias-token", "krypto"),
  P("Ronin", "RON", 334, 15.51, -97.32, "crypto", "ronin", "krypto"),
  P("Constellation", "DAG", 2179.8, 15.30, -97.47, "crypto", "constellation-labs", "krypto"),
  P("Harmony", "ONE", 14638.41, 14.69, -96.16, "crypto", "harmony", "krypto"),
  P("xMoney (Utrust)", "UTK", 10054, 12.74, -98.00, "crypto", "utrust", "krypto"),
  P("Aurora", "AURORA", 716.21, 12.52, -93.40, "crypto", "aurora-near", "krypto"),
  P("Aleph.im", "ALEPH", 1272.52, 11.35, -98.14, "crypto", "aleph", "krypto"),
  P("Boba Network", "BOBA", 617.82, 10.75, -94.31, "crypto", "boba-network", "krypto"),
  P("Renzo", "REZ", 4392.95, 9.332, -96.39, "crypto", "renzo", "krypto"),
];

function sqlStr(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

const lines = [];
lines.push("-- AUTOMATISCH GENERIERT von scripts/gen-seed.mjs — nicht direkt bearbeiten.");
lines.push("-- Startdaten (Depots, Instrumente, Transaktionen, Startkurse, FX).");
lines.push("");
lines.push("do $$");
lines.push("declare");
lines.push("  uid uuid;");
// Account-Variablen
for (const a of accounts) lines.push(`  acc_${a.key} uuid;`);
lines.push("  inst uuid;");
lines.push("begin");
lines.push("  -- Nimmt den (einzigen) angemeldeten Nutzer dieses Projekts.");
lines.push("  -- Lege den Nutzer vorher an: Authentication -> Users -> Add user.");
lines.push("  select id into uid from auth.users order by created_at asc limit 1;");
lines.push("  if uid is null then");
lines.push("    raise exception 'Kein Auth-Nutzer gefunden. Bitte zuerst unter Authentication -> Users anlegen.';");
lines.push("  end if;");
lines.push("");
lines.push("  -- Idempotent: vorhandene Startdaten dieses Nutzers entfernen.");
lines.push("  delete from public.transactions where user_id = uid;");
lines.push("  delete from public.instruments where user_id = uid;");
lines.push("  delete from public.accounts where user_id = uid;");
lines.push("");

// Accounts
accounts.forEach((a, i) => {
  lines.push(`  insert into public.accounts (user_id, name, type, currency, sort_order)`);
  lines.push(`    values (uid, ${sqlStr(a.name)}, ${sqlStr(a.type)}, 'EUR', ${i})`);
  lines.push(`    returning id into acc_${a.key};`);
});
lines.push("");

// Positionen
for (const p of positions) {
  const invested = p.value / (1 + p.gain / 100);
  const buyPrice = invested / p.qty; // EUR je Stück
  const curPrice = p.value / p.qty; // EUR je Stück
  const idCol = p.kind === "crypto" ? "coingecko_id" : "yahoo_symbol";
  lines.push(`  insert into public.instruments (user_id, kind, name, display_symbol, ${idCol}, currency)`);
  lines.push(`    values (uid, ${sqlStr(p.kind)}, ${sqlStr(p.name)}, ${sqlStr(p.sym)}, ${sqlStr(p.id)}, 'EUR')`);
  lines.push(`    returning id into inst;`);
  lines.push(`  insert into public.transactions (user_id, account_id, instrument_id, type, trade_date, quantity, price, currency)`);
  lines.push(`    values (uid, acc_${p.account}, inst, 'buy', date '2023-01-02', ${p.qty}, ${buyPrice.toFixed(6)}, 'EUR');`);
  lines.push(`  insert into public.prices (instrument_id, price, currency, change_pct_1d, source)`);
  lines.push(`    values (inst, ${curPrice.toFixed(6)}, 'EUR', 0, 'seed');`);
}
lines.push("end $$;");
lines.push("");

// FX-Startwerte (werden in Phase 2 automatisch aktualisiert)
lines.push("-- Wechselkurs-Startwerte (1 EUR = rate * Währung).");
const fx = { USD: 1.08, HKD: 8.45, JPY: 170, DKK: 7.46, SEK: 11.2, GBP: 0.85, CAD: 1.47, CHF: 0.94 };
lines.push("insert into public.fx_rates (quote, rate) values");
lines.push(
  Object.entries(fx).map(([q, r]) => `  (${sqlStr(q)}, ${r})`).join(",\n") +
  "\non conflict (quote) do update set rate = excluded.rate, as_of = now();",
);
lines.push("");

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), lines.join("\n"));
console.log(`seed.sql geschrieben: ${positions.length} Positionen, ${accounts.length} Depots.`);
