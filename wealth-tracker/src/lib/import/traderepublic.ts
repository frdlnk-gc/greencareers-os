// Parser für den Trade-Republic-Transaktionsexport (CSV).
//
// Wichtig für die Datenlogik der App (portfolio.ts):
//  - Auf einem Broker-Depot zählen NUR Käufe/Verkäufe zum Depotwert. Ein-/
//    Auszahlungen würden dort „Phantom-Cash" erzeugen (Käufe verringern das
//    Cash im Modell nicht) → werden daher NICHT importiert, sondern gemeldet.
//  - Dividenden verändern die Position nicht, erscheinen aber in der
//    Dividenden-Ansicht → werden importiert und über die ISIN zugeordnet.
//  - Splits / Gratis-Einbuchungen erhöhen die Stückzahl ohne Kosten → als
//    Kauf zu 0 € gebucht, damit die Stückzahl stimmt.
//  - Alle Beträge im TR-Export sind bereits in EUR.

export interface BrokerTx {
  type: "buy" | "sell" | "dividend";
  isin: string;
  name: string;
  kind: "stock" | "etf" | "crypto";
  date: string; // YYYY-MM-DD
  quantity: number | null;
  price: number | null; // EUR je Stück
  amount: number | null; // EUR
  fee: number; // EUR
}

export interface ParseResult {
  rows: BrokerTx[];
  counts: { buy: number; sell: number; dividend: number };
  skipped: { reason: string; count: number }[];
}

// Robuster CSV-Parser (RFC4180-ähnlich: Felder in ", doppelte " = escaped,
// Zeilenumbrüche innerhalb von Feldern erlaubt).
function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// TR-Export nutzt Punkt-Dezimalzahlen (z. B. "18.600000", "-31.0000000000").
function num(v: string | undefined): number | null {
  if (v == null) return null;
  const s = v.trim();
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function kindFromAsset(asset: string): BrokerTx["kind"] {
  switch (asset.trim().toUpperCase()) {
    case "FUND":
      return "etf";
    case "CRYPTO":
      return "crypto";
    default:
      return "stock"; // STOCK, DERIVATIVE, leer
  }
}

export function parseTradeRepublicCsv(text: string): ParseResult {
  const table = splitCsv(text);
  const empty: ParseResult = {
    rows: [],
    counts: { buy: 0, sell: 0, dividend: 0 },
    skipped: [],
  };
  if (table.length < 2) return empty;

  const header = table[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iDate = idx("date");
  const iCat = idx("category");
  const iType = idx("type");
  const iAsset = idx("asset_class");
  const iName = idx("name");
  const iSym = idx("symbol");
  const iShares = idx("shares");
  const iPrice = idx("price");
  const iAmount = idx("amount");
  const iFee = idx("fee");
  if (iCat < 0 || iType < 0 || iSym < 0) return empty; // kein TR-Export

  const rows: BrokerTx[] = [];
  const skip = new Map<string, number>();
  const addSkip = (reason: string) => skip.set(reason, (skip.get(reason) ?? 0) + 1);

  for (let k = 1; k < table.length; k++) {
    const c = table[k];
    if (c.length <= iType) continue;
    const cat = (c[iCat] ?? "").trim().toUpperCase();
    const type = (c[iType] ?? "").trim().toUpperCase();
    const date = (c[iDate] ?? "").trim().slice(0, 10);
    const isin = (c[iSym] ?? "").trim();
    const name = (c[iName] ?? "").trim();
    const kind = kindFromAsset(c[iAsset] ?? "");
    const shares = num(c[iShares]);
    const price = num(c[iPrice]);
    const amount = num(c[iAmount]);
    const fee = Math.abs(num(c[iFee]) ?? 0);

    if (cat === "TRADING" && type === "BUY") {
      if (!isin || shares == null || price == null) {
        addSkip("Unvollständiger Kauf");
        continue;
      }
      const q = Math.abs(shares);
      const p = Math.abs(price);
      rows.push({ type: "buy", isin, name, kind, date, quantity: q, price: p, amount: q * p, fee });
    } else if (cat === "TRADING" && type === "SELL") {
      if (!isin || shares == null || price == null) {
        addSkip("Unvollständiger Verkauf");
        continue;
      }
      const q = Math.abs(shares);
      const p = Math.abs(price);
      rows.push({ type: "sell", isin, name, kind, date, quantity: q, price: p, amount: q * p, fee });
    } else if (cat === "CASH" && (type === "DIVIDEND" || type === "DISTRIBUTION")) {
      if (!isin || amount == null) {
        addSkip("Dividende ohne Zuordnung");
        continue;
      }
      rows.push({
        type: "dividend",
        isin,
        name,
        kind,
        date,
        quantity: null,
        price: null,
        amount: Math.abs(amount),
        fee: 0,
      });
    } else if (
      (cat === "CORPORATE_ACTION" && type === "SPLIT") ||
      (cat === "DELIVERY" && type === "FREE_RECEIPT")
    ) {
      if (!isin || shares == null || shares === 0) {
        addSkip("Kapitalmaßnahme (bitte prüfen)");
        continue;
      }
      // Gratis-Stücke / Split: als Kauf zu 0 € → Stückzahl bleibt korrekt.
      rows.push({
        type: "buy",
        isin,
        name,
        kind,
        date,
        quantity: Math.abs(shares),
        price: 0,
        amount: 0,
        fee: 0,
      });
    } else if (cat === "CASH") {
      addSkip("Cash-Buchungen (Ein-/Auszahlungen, Zinsen, Steuern)");
    } else if (cat === "CORPORATE_ACTION") {
      addSkip("Kapitalmaßnahmen (bitte prüfen)");
    } else {
      addSkip("Sonstige");
    }
  }

  return {
    rows,
    counts: {
      buy: rows.filter((r) => r.type === "buy").length,
      sell: rows.filter((r) => r.type === "sell").length,
      dividend: rows.filter((r) => r.type === "dividend").length,
    },
    skipped: [...skip.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}
