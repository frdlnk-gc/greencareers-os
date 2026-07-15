"use client";

import { useState } from "react";
import { createTransaction } from "@/app/(app)/actions";
import { TRADE_CURRENCIES } from "@/lib/prices/fx";
import { SubmitButton } from "./FormButtons";

interface InstrumentOption {
  id: string;
  name: string;
  display_symbol: string | null;
  kind: string;
}

const inputCls =
  "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-base outline-none focus:border-neutral-600";

// Formular zum Erfassen einer Transaktion (Kauf/Verkauf/Dividende/Ein-/Auszahlung).
export function TransactionForm({
  accountId,
  instruments,
  initialInstrumentId,
}: {
  accountId: string;
  instruments: InstrumentOption[];
  initialInstrumentId?: string;
}) {
  const [type, setType] = useState("buy");
  const [instrumentId, setInstrumentId] = useState(
    initialInstrumentId && instruments.some((i) => i.id === initialInstrumentId)
      ? initialInstrumentId
      : instruments[0]?.id ?? "__new__",
  );
  const [newKind, setNewKind] = useState("stock");
  const [currency, setCurrency] = useState("EUR");

  const isCash = type === "deposit" || type === "withdrawal";
  const isDividend = type === "dividend";
  const isNew = instrumentId === "__new__";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={createTransaction} className="space-y-5">
      <input type="hidden" name="account_id" value={accountId} />
      {initialInstrumentId && (
        <input type="hidden" name="from_instrument" value={initialInstrumentId} />
      )}

      {/* Typ */}
      <div>
        <label className="mb-1 block text-sm text-neutral-400">Art</label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputCls}
        >
          <option value="buy">Kauf</option>
          <option value="sell">Verkauf</option>
          <option value="dividend">Dividende</option>
          <option value="deposit">Einzahlung (Cash)</option>
          <option value="withdrawal">Auszahlung (Cash)</option>
        </select>
      </div>

      {/* Instrument (nicht bei reiner Geldbewegung) */}
      {!isCash && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-neutral-400">
              Wertpapier / Krypto
            </label>
            <select
              name="instrument_id"
              value={instrumentId}
              onChange={(e) => setInstrumentId(e.target.value)}
              className={inputCls}
            >
              {instruments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.display_symbol ? ` · ${i.display_symbol}` : ""}
                </option>
              ))}
              <option value="__new__">+ Neues Instrument …</option>
            </select>
          </div>

          {isNew && (
            <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
              <input
                name="new_name"
                placeholder="Name (z. B. Apple)"
                className={inputCls}
              />
              <select
                name="new_kind"
                value={newKind}
                onChange={(e) => setNewKind(e.target.value)}
                className={inputCls}
              >
                <option value="stock">Aktie</option>
                <option value="etf">ETF</option>
                <option value="crypto">Krypto</option>
              </select>
              {newKind === "crypto" ? (
                <input
                  name="new_symbol"
                  placeholder="CoinGecko-ID (z. B. bitcoin)"
                  className={inputCls}
                />
              ) : (
                <>
                  <input
                    name="new_isin"
                    placeholder="ISIN (z. B. US0378331005) – für Live-Kurse"
                    className={inputCls}
                  />
                  <input
                    name="new_symbol"
                    placeholder="Kürzel (optional, z. B. AAPL)"
                    className={inputCls}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mengen/Kurs bei Kauf/Verkauf */}
      {!isCash && !isDividend && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-neutral-400">Menge</label>
              <input
                name="quantity"
                inputMode="decimal"
                placeholder="0"
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
                placeholder="0,00"
                className={inputCls}
              />
            </div>
          </div>
          <CurrencyField value={currency} onChange={setCurrency} />
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
              placeholder="0,00"
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

      {/* Betrag bei Cash (immer EUR) */}
      {isCash && (
        <div>
          <label className="mb-1 block text-sm text-neutral-400">
            Betrag (EUR)
          </label>
          <input
            name="amount"
            inputMode="decimal"
            placeholder="0,00"
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
            defaultValue={today}
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
              placeholder="0,00"
              className={inputCls}
            />
          </div>
        )}
      </div>

      <SubmitButton className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white active:opacity-80 disabled:opacity-50">
        Speichern
      </SubmitButton>
    </form>
  );
}

// Währung des Kurses (z. B. CA$ bei Constellation über CapTrader). Wird beim
// Speichern korrekt in EUR umgerechnet.
function CurrencyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-neutral-400">
        Währung des Kurses
      </label>
      <select
        name="currency"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        {TRADE_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-neutral-600">
        In der Währung, in der dein Broker den Kurs anzeigt (z. B. CAD, USD).
      </p>
    </div>
  );
}
