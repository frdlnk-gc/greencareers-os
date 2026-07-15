// Heuristischer CSV-Parser für Broker-Exporte (Trade Republic, CapTrader,
// Flatex, …). Erkennt Trennzeichen und Spalten automatisch anhand der
// Überschriften und liefert normalisierte Transaktionszeilen. Kostenlos,
// ohne KI – der Nutzer bestätigt/korrigiert danach ohnehin in der Tabelle.

export interface ParsedRow {
  type: "buy" | "sell";
  name: string;
  symbol?: string;
  isin?: string;
  kind?: "stock" | "etf" | "crypto";
  quantity: number;
  price: number;
  currency?: string;
  date?: string;
}

// Erkennt einen ISO-Währungscode (z. B. "USD", "CA$", "EUR").
function detectCurrency(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.toUpperCase();
  const m = /\b(EUR|USD|CAD|GBP|GBX|CHF|JPY|HKD|SEK|DKK|NOK|AUD|NZD|SGD|CNY|PLN|CZK|ZAR)\b/.exec(
    s,
  );
  if (m) return m[1] === "GBX" ? "GBP" : m[1];
  if (s.includes("CA$") || s.includes("C$")) return "CAD";
  if (s.includes("US$")) return "USD";
  if (s.includes("€")) return "EUR";
  if (s.includes("£")) return "GBP";
  return undefined;
}

function detectDelimiter(line: string): string {
  const candidates = [";", ",", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const c of candidates) {
    const count = line.split(c).length;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ""));
}

// Wandelt Zahl in deutschem oder englischem Format in eine Zahl.
function parseNumber(v: string): number | null {
  if (!v) return null;
  let s = v.replace(/[^\d,.\-]/g, "").trim();
  if (!s) return null;
  // Wenn Komma UND Punkt: das hintere ist der Dezimaltrenner.
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Math.abs(parseFloat(s));
  return Number.isFinite(n) ? n : null;
}

function normalizeDate(v: string): string | undefined {
  if (!v) return undefined;
  const s = v.trim();
  // ISO
  let m = /(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // TT.MM.JJJJ oder TT/MM/JJJJ
  m = /(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/.exec(s);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return undefined;
}

// Findet den Spaltenindex, dessen Überschrift einen der Begriffe enthält.
function findCol(headers: string[], terms: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase();
    if (terms.some((t) => h.includes(t))) return i;
  }
  return -1;
}

export function parseCsvTransactions(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const delim = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delim);

  const col = {
    type: findCol(headers, ["type", "art", "side", "richtung", "buy/sell", "transaktion"]),
    name: findCol(headers, ["name", "bezeichnung", "instrument", "security", "wertpapier", "titel", "description"]),
    isin: findCol(headers, ["isin"]),
    symbol: findCol(headers, ["symbol", "ticker", "wkn", "kürzel", "kurzel"]),
    qty: findCol(headers, ["quantity", "anzahl", "stück", "stuck", "menge", "shares", "nominal", "units", "stk"]),
    price: findCol(headers, ["price", "kurs", "preis", "rate", "ausführungskurs", "einstand"]),
    currency: findCol(headers, ["currency", "währung", "waehrung", "ccy", "devise"]),
    date: findCol(headers, ["date", "datum", "zeit", "time", "handelstag", "valuta"]),
  };

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delim);
    if (cells.length < 2) continue;

    const rawType = (col.type >= 0 ? cells[col.type] : "").trim().toLowerCase();
    const isSell =
      /sell|verkauf|sale|sold|^s$|^-/.test(rawType) && !/buy|kauf/.test(rawType);
    const qty = col.qty >= 0 ? parseNumber(cells[col.qty]) : null;
    const price = col.price >= 0 ? parseNumber(cells[col.price]) : null;
    const name = col.name >= 0 ? cells[col.name] : "";
    const isin = col.isin >= 0 ? cells[col.isin] : "";

    if ((!name && !isin) || qty == null || qty === 0) continue;

    // Währung: eigene Spalte, sonst aus der Kurs-Zelle (z. B. "2.609,00 CA$").
    const currency =
      (col.currency >= 0 ? detectCurrency(cells[col.currency]) : undefined) ??
      (col.price >= 0 ? detectCurrency(cells[col.price]) : undefined);

    rows.push({
      type: isSell ? "sell" : "buy",
      name: name || isin,
      symbol: col.symbol >= 0 ? cells[col.symbol] : undefined,
      isin: isin || undefined,
      kind: "stock",
      quantity: qty,
      price: price ?? 0,
      currency,
      date: col.date >= 0 ? normalizeDate(cells[col.date]) : undefined,
    });
  }
  return rows;
}
