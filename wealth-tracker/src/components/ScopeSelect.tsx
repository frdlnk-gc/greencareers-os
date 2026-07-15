"use client";

import { useState } from "react";

// Scope-Auswahl wie bei getquin: „Aggregiert" (alle Depots) oder eine beliebige
// Auswahl einzelner Depots (Mehrfachauswahl). `selected` sind die aktiven
// Depot-IDs; alle ausgewählt = aggregiert.
export function ScopeSelect({
  accounts,
  selected,
  onChange,
}: {
  accounts: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const allIds = accounts.map((a) => a.id);
  const isAll =
    selected.length === 0 || selected.length === accounts.length;

  const label = isAll
    ? "Aggregiert"
    : selected.length === 1
      ? accounts.find((a) => a.id === selected[0])?.name ?? "1 Depot"
      : `${selected.length} Depots`;

  function toggle(id: string) {
    const base = selected.length ? selected : allIds;
    const set = new Set(base);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange(set.size === 0 ? allIds : [...set]);
  }

  if (accounts.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-lg font-bold active:opacity-70"
      >
        {label}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-11 z-30 w-60 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
            <button
              onClick={() => {
                onChange(allIds);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-neutral-800"
            >
              <span className="font-medium">Aggregiert</span>
              <Radio on={isAll} />
            </button>
            <div className="my-1 border-t border-neutral-800" />
            {accounts.map((a) => {
              const on = !isAll && selected.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-neutral-800"
                >
                  <span>{a.name}</span>
                  <Radio on={on} />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
        on ? "border-emerald-500" : "border-neutral-600"
      }`}
    >
      {on && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
    </span>
  );
}
