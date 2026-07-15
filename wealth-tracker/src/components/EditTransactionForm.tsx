"use client";

import { useState } from "react";
import { editTransaction, deleteTransaction } from "@/app/(app)/actions";
import { TRADE_CURRENCIES } from "@/lib/prices/fx";
import { SubmitButton, ConfirmButton } from "./FormButtons";

interface Tx {
  id: string;
  type: string;
  trade_date: string;
  quantity: number | null;
  price: number | null;
  amount: number | null;
  currency: string | null;
  fees: number | null;
}

const inputCls =
  "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-base outline-none focus:border-neutral-600";

// Formular zum Bearbeiten einer bestehenden Transaktion. Das Instrument bleibt
// unverändert (zum Verschieben: löschen und neu anlegen).
export function EditTransactionForm({
  tx,
  accountId,
  instrumentId,
}: {
  tx: Tx;
  accountId: string;
  instrumentId: string | null;
}) {
  const [type, setType] = useState(tx.type);
  const [currency, setCurrency] = useState(tx.currency ?? "EUR");

  const isCash = type === "deposit" || type === "withdrawal";
  const isDividend = type === "dividend";
  const hasInstrument = !!instrumentId;

  return (
    <>
      <form action={editTransaction} className="space-y-5">
        <input type="hidden" name="id" value={tx.id} />
        <input type="hidden" name="account_id" value={accountId} />
        {instrumentId && (
          <input type="hidden" name="instrument_id" value={instrumentId} />
        )}

        {/* Art */}
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Art</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputCls}
          >
            {hasInstrument ? (
              <>
                <option value="buy">Kauf</option>
                <option value="sell">Verkauf</option>
                <option value="dividend">Dividende</option>
              </>
            ) : (
              <>
                <option value="deposit">Einzahlung (Cash)</option>
                <option value="withdrawal">Auszahlung (Cash)</option>
              </>
            )}
          </select>
        </div>

        {/* Menge / Kurs bei Kauf/Verkauf */}
        {!isCash && !isDividend && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-neutral-400">Menge</label>
                <input
                  name="quantity"
                  inputMode="decimal"
                  defaultValue={tx.quantity ?? ""}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-neutral-400">
                  Kurs je Stück
                </label>
                <input
                  name="price"
                  inputMode="decimal"
                  defaultValue={tx.price ?? ""}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-400">
                Währung des Kurses
              </label>
              <select
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputCls}
              >
                {TRADE_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Betrag bei Dividende */}
        {isDividend && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-neutral-400">Betrag</label>
              <input
                name="amount"
                inputMode="decimal"
                defaultValue={tx.amount ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-400">Währung</label>
              <select
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputCls}
              >
                {TRADE_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Betrag bei Cash */}
        {isCash && (
          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              Betrag (EUR)
            </label>
            <input
              name="amount"
              inputMode="decimal"
              defaultValue={tx.amount ?? ""}
              className={inputCls}
            />
            <input type="hidden" name="currency" value="EUR" />
          </div>
        )}

        {/* Datum + Gebühren */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Datum</label>
            <input
              name="trade_date"
              type="date"
              defaultValue={tx.trade_date}
              className={inputCls}
            />
          </div>
          {!isCash && (
            <div>
              <label className="mb-1 block text-sm text-neutral-400">
                Gebühren (EUR)
              </label>
              <input
                name="fees"
                inputMode="decimal"
                defaultValue={tx.fees ?? ""}
                className={inputCls}
              />
            </div>
          )}
        </div>

        <SubmitButton className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white active:opacity-80 disabled:opacity-50">
          Änderungen speichern
        </SubmitButton>
      </form>

      {/* Löschen (separates Formular) */}
      <form action={deleteTransaction} className="mt-4">
        <input type="hidden" name="id" value={tx.id} />
        <input type="hidden" name="account_id" value={accountId} />
        {instrumentId && (
          <input type="hidden" name="instrument_id" value={instrumentId} />
        )}
        <ConfirmButton
          confirm="Diese Transaktion wirklich löschen?"
          className="w-full rounded-xl border border-red-900/60 py-3 text-sm font-medium text-red-400 active:opacity-70 disabled:opacity-50"
        >
          Transaktion löschen
        </ConfirmButton>
      </form>
    </>
  );
}
