// Zuordnung Broker-/Yahoo-Symbol -> ISIN.
// Über die ISIN holt Tradegate (deutsche Börse) für jede Aktie einen
// Live-Kurs in EURO — egal ob USA, Europa oder Asien. Die ISINs werden per
// OpenFIGI gegengeprüft (siehe /api/debug), damit kein falscher Kurs entsteht.

export const SYMBOL_TO_ISIN: Record<string, string> = {
  // --- Trade Republic ---
  "ASML.AS": "NL0010273215", // ASML Holding
  GOOGL: "US02079K3059", // Alphabet A
  NET: "US18915M1071", // Cloudflare
  "BESI.AS": "NL0012866412", // BE Semiconductor
  "LOTB.BR": "BE0003604155", // Lotus Bakeries
  "NOVO-B.CO": "DK0062498333", // Novo Nordisk B
  MRK: "US58933Y1055", // Merck & Co.
  MELI: "US58733R1023", // MercadoLibre
  "CSU.TO": "CA21037X1006", // Constellation Software
  MRNA: "US60770K1079", // Moderna
  PEP: "US7134481081", // PepsiCo
  "0669.HK": "HK0669013440", // Techtronic Industries
  MEDP: "US58506Q1094", // Medpace
  HUBS: "US4433201062", // HubSpot
  ADP: "US0530151036", // Automatic Data Processing

  // --- CapTrader ---
  FFIN: "US32020R1095", // First Financial Bankshares
  NOW: "US81762P1021", // ServiceNow
  NRIX: "US67079A1043", // Nurix Therapeutics
  CSL: "US1423391002", // Carlisle Companies
  "2020.HK": "KYG040111059", // Anta Sports
  PSA: "US74460D1090", // Public Storage
  "4063.T": "JP3371200001", // Shin-Etsu Chemical
  MSFT: "US5949181045", // Microsoft
  CWT: "US1309301090", // California Water Service
  RDDT: "US7551071016", // Reddit
  GRRR: "US38268T1034", // Gorilla Technology
  PG: "US7427181091", // Procter & Gamble
  UPS: "US9113121068", // United Parcel Service
  "RMS.PA": "FR0000052292", // Hermès
  "DPLM.L": "GB0001826634", // Diploma
  "MC.PA": "FR0000121014", // LVMH
  SOFI: "US83406F1021", // SoFi Technologies
  MCD: "US5801351017", // McDonald's
  "KESKOB.HE": "FI0009000202", // Kesko B
  "LSEG.L": "GB00B0SWJX34", // London Stock Exchange Group
  "DHL.DE": "DE0005552004", // DHL Group
  RIVN: "US76954A1034", // Rivian
  BLK: "US09247X1019", // BlackRock
  "BONEX.ST": "SE0009858152", // Bonesupport
  BCPC: "US0577871070", // Balchem
  MMM: "US88579Y1010", // 3M

  // --- Project X ---
  CL: "US1941621039", // Colgate-Palmolive
  ADBE: "US00724F1012", // Adobe
  SNPS: "US8716071076", // Synopsys
  HSY: "US4278661081", // Hershey
  "MFT.NZ": "NZMFTE0001S2", // Mainfreight
  JOBY: "US4771431016", // Joby Aviation
  COST: "US22160K1051", // Costco
  APD: "US0091581068", // Air Products & Chemicals
  "4519.T": "JP3519400000", // Chugai Pharmaceutical
  WCN: "CA94106B1013", // Waste Connections

  // --- Flatex ---
  MAA: "US59522J1033", // Mid-America Apartment
  "BATS.L": "GB0002875804", // British American Tobacco
  "BKW.SW": "CH0130293662", // BKW
  ABT: "US0028241000", // Abbott Laboratories
  "WKL.AS": "NL0000395903", // Wolters Kluwer
  SPCE: "US92766K1060", // Virgin Galactic
};

export function isinForSymbol(symbol: string | null | undefined): string | null {
  if (!symbol) return null;
  return SYMBOL_TO_ISIN[symbol] ?? null;
}
