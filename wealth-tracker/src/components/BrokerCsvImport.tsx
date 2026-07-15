"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ImportSummary } from "@/lib/import/traderepublic";

interface Account {
  id: string;
  name: string;
  type: string;
}

// Voll-Import des Trade-Republic-CSV-Exports: liest die Datei, bucht alle
// Käufe/Verkäufe/Dividenden ins gewählte Depot und lädt danach die Kurshistorie
// im Hintergrund nach (mehrere Läufe, bis alles befüllt ist).
export function BrokerCsvImport({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [accountId, setAccountId] = useState(
    accounts.find((a) => /trade\s*republic/i.test(a.name))?.id ??
      accounts[0]?.id ??
      "",
  );
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accountId) return;
    setBusy(true);
    setResult(null);
    setStatus("CSV wird eingelesen …");
    try {
      const text = await file.text();
      setStatus("Transaktionen werden gebucht … (kann kurz dauern)");
      const res: ImportSummary = await fetch("/api/import-tr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accountId, csv: text }),
      }).then((r) => r.json());
      setResult(res);
      if (res.inserted > 0) {
        // Erst aktuelle Live-Kurse holen (damit die Depotwerte stimmen), dann
        // die Kurshistorie nachladen – so lange, bis nichts mehr nachkommt.
        setStatus("Live-Kurse und Historie werden geladen … (kann dauern)");
        await fetch("/api/refresh", { method: "POST" }).catch(() => {});
        for (let i = 0; i < 12; i++) {
          const r = await fetch("/api/backfill", { method: "POST" })
            .then((x) => x.json())
            .catch(() => null);
          if (!r || ((r.usFilled ?? 0) === 0 && (r.cryptoFilled ?? 0) === 0))
            break;
        }
        await fetch("/api/refresh", { method: "POST" }).catch(() => {});
        setStatus(null);
      } else {
        setStatus("Nichts gebucht – bitte prüfen, ob es der TR-CSV-Export ist.");
      }
    } catch {
      setStatus("Import fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const target = accounts.find((a) => a.id === accountId);

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        onChange={onFile}
        className="hidden"
      />

      {accounts.length > 1 && (
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

      <p className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-3 text-xs text-amber-200/80">
        Ersetzt <b>alle</b> Transaktionen im Depot
        {target ? ` „${target.name}"` : ""} durch die CSV. Ein-/Auszahlungen und
        Zinsen werden nicht importiert (die zählen im Depot nicht zum Wert) –
        Käufe, Verkäufe und Dividenden schon.
      </p>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy || !accountId}
        className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-700 py-6 text-sm text-neutral-300 active:opacity-70 disabled:opacity-50"
      >
        <span className="text-lg">📄</span>
        {busy ? "Bitte warten …" : "Trade-Republic-CSV wählen"}
        <span className="text-[10px] text-neutral-600">
          Transaktionsexport (.csv)
        </span>
      </button>

      {status && (
        <p className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 text-sm text-neutral-300">
          {status}
        </p>
      )}

      {result && result.inserted > 0 && (
        <div className="space-y-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
          <div className="text-sm font-medium text-emerald-300">
            {result.inserted} Transaktionen gebucht · {result.instruments} Titel
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
            <span>{result.counts.buy} Käufe</span>
            <span>{result.counts.sell} Verkäufe</span>
            <span>{result.counts.dividend} Dividenden</span>
          </div>
          {result.failed > 0 && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-2 text-xs text-red-200/80">
              {result.failed} Zeilen konnten nicht gebucht werden.
              {result.error ? ` (${result.error})` : ""}
            </div>
          )}
          {result.skipped.length > 0 && (
            <div className="border-t border-neutral-800 pt-2 text-xs text-neutral-500">
              <div className="mb-1">Nicht importiert:</div>
              <ul className="space-y-0.5">
                {result.skipped.map((s) => (
                  <li key={s.reason} className="flex justify-between gap-2">
                    <span>{s.reason}</span>
                    <span className="tabular">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => router.push(`/depot/${accountId}`)}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white active:opacity-80"
          >
            Zum Depot
          </button>
        </div>
      )}
    </div>
  );
}
