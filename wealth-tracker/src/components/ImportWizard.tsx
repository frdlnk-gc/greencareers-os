"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importTransactions, type ImportRow } from "@/app/(app)/actions";
import { TRADE_CURRENCIES } from "@/lib/prices/fx";

interface Account {
  id: string;
  name: string;
  type: string;
}

const emptyRow = (): ImportRow => ({
  type: "buy",
  name: "",
  symbol: "",
  isin: "",
  kind: "stock",
  quantity: 0,
  price: 0,
  currency: "EUR",
  date: new Date().toISOString().slice(0, 10),
});

const cell =
  "w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm outline-none focus:border-neutral-600";

// Zahl aus deutscher ODER englischer Eingabe (1.234,56 / 1,5 / 12.50).
function parseNum(v: string): number {
  let s = v.replace(/[^\d,.-]/g, "").trim();
  if (!s) return 0;
  if (s.includes(",") && s.includes(".")) {
    s = s.lastIndexOf(",") > s.lastIndexOf(".")
      ? s.replace(/\./g, "").replace(",", ".")
      : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function ImportWizard({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [payload, setPayload] = useState<Record<string, string> | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Roh-Text der Zahl-Felder, damit man Kommazahlen (1,5) tippen kann, ohne
  // dass das Feld beim Parsen zurückspringt.
  const [draft, setDraft] = useState<Record<string, string>>({});

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImage(null);
    const isCsv =
      file.type === "text/csv" ||
      file.name.toLowerCase().endsWith(".csv") ||
      file.type === "text/plain";
    const reader = new FileReader();
    if (isCsv) {
      reader.onload = () => setPayload({ csv: String(reader.result) });
      reader.readAsText(file);
    } else if (file.type === "application/pdf") {
      reader.onload = () => setPayload({ pdf: String(reader.result) });
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const url = String(reader.result);
        setImage(url);
        setPayload({ image: url });
      };
      reader.readAsDataURL(file);
    }
  }

  async function extract() {
    if (!payload) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.configured === false) {
        setStatus(
          "Automatisches Auslesen ist nicht aktiviert (kein ANTHROPIC_API_KEY). Du kannst die Positionen unten manuell eintragen.",
        );
        if (rows.length === 0) setRows([emptyRow()]);
      } else if (data.error) {
        setStatus(`Fehler beim Auslesen: ${data.error}`);
        if (rows.length === 0) setRows([emptyRow()]);
      } else if (Array.isArray(data.rows) && data.rows.length > 0) {
        setRows(
          data.rows.map((r: Partial<ImportRow>) => ({ ...emptyRow(), ...r })),
        );
        setStatus(`${data.rows.length} Position(en) erkannt. Bitte prüfen.`);
      } else {
        setStatus("Nichts erkannt. Bitte manuell eintragen.");
        setRows([emptyRow()]);
      }
    } catch {
      setStatus("Netzwerkfehler. Bitte manuell eintragen.");
      setRows([emptyRow()]);
    } finally {
      setLoading(false);
    }
  }

  function update(i: number, patch: Partial<ImportRow>) {
    setRows((prev) => prev.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, k) => k !== i));
  }

  async function save() {
    if (!accountId || rows.length === 0) return;
    setSaving(true);
    try {
      const res = await importTransactions(accountId, rows);
      if (res.inserted > 0) {
        router.push(`/depot/${accountId}`);
      } else {
        setStatus("Nichts gebucht – bitte Eingaben prüfen.");
        setSaving(false);
      }
    } catch {
      setStatus("Speichern fehlgeschlagen.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload: Datei (Bild/PDF/CSV) oder Kamera */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf,.csv,text/csv"
          onChange={onFile}
          className="hidden"
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          className="hidden"
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-700 py-6 text-sm text-neutral-400 active:opacity-70"
          >
            <span className="text-lg">📄</span>
            Datei wählen
            <span className="text-[10px] text-neutral-600">CSV · PDF · Bild</span>
          </button>
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-700 py-6 text-sm text-neutral-400 active:opacity-70"
          >
            <span className="text-lg">📷</span>
            Foto aufnehmen
          </button>
        </div>

        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Vorschau"
            className="mt-3 max-h-64 w-full rounded-xl border border-neutral-800 object-contain"
          />
        )}
        {fileName && !image && (
          <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 text-sm text-neutral-300">
            📎 {fileName}
          </div>
        )}
      </div>

      {payload && (
        <button
          onClick={extract}
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white active:opacity-80 disabled:opacity-50"
        >
          {loading ? "Wird ausgelesen…" : "Automatisch auslesen"}
        </button>
      )}

      {status && (
        <p className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 text-sm text-neutral-300">
          {status}
        </p>
      )}

      {/* Zielkonto */}
      {rows.length > 0 && (
        <div>
          <label className="mb-1 block text-sm text-neutral-400">
            In welches Depot?
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-base outline-none focus:border-neutral-600"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Editierbare Tabelle */}
      {rows.map((r, i) => (
        <div
          key={i}
          className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3"
        >
          <div className="flex items-center gap-2">
            <select
              value={r.type}
              onChange={(e) =>
                update(i, { type: e.target.value as "buy" | "sell" })
              }
              className={cell + " w-24"}
            >
              <option value="buy">Kauf</option>
              <option value="sell">Verkauf</option>
            </select>
            <input
              value={r.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Name"
              className={cell}
            />
            <button
              onClick={() => removeRow(i)}
              className="shrink-0 px-2 text-neutral-500 active:opacity-60"
              aria-label="Zeile entfernen"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={r.isin ?? ""}
              onChange={(e) => update(i, { isin: e.target.value })}
              placeholder="ISIN (für Live-Kurs)"
              className={cell}
            />
            <select
              value={r.kind}
              onChange={(e) =>
                update(i, { kind: e.target.value as ImportRow["kind"] })
              }
              className={cell}
            >
              <option value="stock">Aktie</option>
              <option value="etf">ETF</option>
              <option value="crypto">Krypto</option>
            </select>
            <input
              value={draft[`${i}q`] ?? (r.quantity || "")}
              onChange={(e) => {
                setDraft((d) => ({ ...d, [`${i}q`]: e.target.value }));
                update(i, { quantity: parseNum(e.target.value) });
              }}
              inputMode="decimal"
              placeholder="Menge"
              className={cell}
            />
            <div className="flex gap-2">
              <input
                value={draft[`${i}p`] ?? (r.price || "")}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, [`${i}p`]: e.target.value }));
                  update(i, { price: parseNum(e.target.value) });
                }}
                inputMode="decimal"
                placeholder="Kurs"
                className={cell}
              />
              <select
                value={r.currency ?? "EUR"}
                onChange={(e) => update(i, { currency: e.target.value })}
                className={cell + " w-24 shrink-0"}
                aria-label="Währung"
              >
                {TRADE_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="date"
              value={r.date ?? ""}
              onChange={(e) => update(i, { date: e.target.value })}
              className={cell + " col-span-2"}
            />
          </div>
        </div>
      ))}

      {rows.length > 0 && (
        <>
          <button
            onClick={() => setRows((p) => [...p, emptyRow()])}
            className="w-full rounded-xl border border-dashed border-neutral-700 py-2.5 text-sm text-neutral-400 active:opacity-70"
          >
            + Zeile
          </button>
          <button
            onClick={save}
            disabled={saving || !accountId}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white active:opacity-80 disabled:opacity-50"
          >
            {saving ? "Wird gebucht…" : `${rows.length} Position(en) buchen`}
          </button>
        </>
      )}

      {rows.length === 0 && !payload && (
        <button
          onClick={() => setRows([emptyRow()])}
          className="w-full rounded-xl border border-neutral-800 py-3 text-sm text-neutral-300 active:opacity-70"
        >
          Ohne Datei manuell erfassen
        </button>
      )}
    </div>
  );
}
