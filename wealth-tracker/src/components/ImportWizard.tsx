"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importTransactions, type ImportRow } from "@/app/(app)/actions";

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
  date: new Date().toISOString().slice(0, 10),
});

const cell =
  "w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm outline-none focus:border-neutral-600";

export function ImportWizard({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function extract() {
    if (!image) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image }),
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
      {/* Upload */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-6 text-sm text-neutral-400 active:opacity-70"
        >
          {image ? "Anderes Bild wählen" : "Screenshot auswählen"}
        </button>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Screenshot"
            className="mt-3 max-h-64 w-full rounded-xl border border-neutral-800 object-contain"
          />
        )}
      </div>

      {image && (
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
              value={r.quantity || ""}
              onChange={(e) => update(i, { quantity: Number(e.target.value) || 0 })}
              inputMode="decimal"
              placeholder="Menge"
              className={cell}
            />
            <input
              value={r.price || ""}
              onChange={(e) => update(i, { price: Number(e.target.value) || 0 })}
              inputMode="decimal"
              placeholder="Kurs (EUR)"
              className={cell}
            />
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

      {rows.length === 0 && !image && (
        <button
          onClick={() => setRows([emptyRow()])}
          className="w-full rounded-xl border border-neutral-800 py-3 text-sm text-neutral-300 active:opacity-70"
        >
          Ohne Screenshot manuell erfassen
        </button>
      )}
    </div>
  );
}
