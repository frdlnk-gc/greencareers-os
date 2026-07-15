"use client";

import { useState } from "react";
import { createAccount } from "@/app/(app)/actions";
import { SubmitButton } from "./FormButtons";

const inputCls =
  "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-base outline-none focus:border-neutral-600";

// Depot/Konto anlegen. Der Wert-/Verbindlichkeits-Block ist nur für Cash &
// Sonstiges relevant und wird bei Broker/Krypto ausgeblendet (keine toten
// Felder). Über ?type=… lässt sich die Art vorwählen (z. B. „+ Cash").
export function NewAccountForm({ initialType }: { initialType: string }) {
  const [type, setType] = useState(
    ["broker", "crypto", "cash", "other"].includes(initialType)
      ? initialType
      : "broker",
  );
  const showValue = type === "cash" || type === "other";

  return (
    <form action={createAccount} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm text-neutral-400">Name</label>
        <input
          name="name"
          required
          autoFocus
          placeholder={
            type === "cash"
              ? "z. B. Girokonto"
              : type === "other"
                ? "z. B. Auto, Immobilie"
                : "z. B. Trade Republic"
          }
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-400">Art</label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputCls}
        >
          <option value="broker">Broker / Wertpapierdepot</option>
          <option value="crypto">Krypto</option>
          <option value="cash">Cash / Konto</option>
          <option value="other">Sonstiges Vermögen</option>
        </select>
      </div>

      {showValue && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
          <label className="mb-1 block text-sm text-neutral-400">
            Aktueller Wert
          </label>
          <input
            name="value"
            inputMode="decimal"
            placeholder="z. B. 15000"
            className={inputCls}
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="liability"
              className="h-4 w-4 accent-red-500"
            />
            Ist eine Verbindlichkeit (Schulden – wird abgezogen)
          </label>
        </div>
      )}

      {!showValue && (
        <p className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 text-sm text-neutral-400">
          Positionen erfasst du danach im Depot – per Kauf/Verkauf, Foto oder
          CSV-Import.
        </p>
      )}

      <SubmitButton className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white active:opacity-80 disabled:opacity-50">
        Anlegen
      </SubmitButton>
    </form>
  );
}
