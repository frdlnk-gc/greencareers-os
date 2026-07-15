"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEur, formatPct, formatQuantity, changeColor } from "@/lib/format";
import { usePersistentState } from "@/lib/usePersistentState";
import { Avatar } from "./Avatar";
import type { Position } from "@/lib/types";

// Positionsliste wie getquin: sortierbar nach Wert, „seit Kauf", „heute" oder
// Name. Die je Zeile gezeigte Kennzahl (%) passt sich der Sortierung an.
type SortKey = "value" | "gain" | "today" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "value", label: "Wert" },
  { key: "gain", label: "Seit Kauf" },
  { key: "today", label: "Heute" },
  { key: "name", label: "Name" },
];

// Sortierwert (absteigend, außer Name); null-Kennzahlen ans Ende.
function sortVal(p: Position, key: SortKey): number {
  switch (key) {
    case "value":
      return p.valueEur;
    case "gain":
      return p.gainPct ?? -Infinity;
    case "today":
      return p.changePct1d ?? -Infinity;
    default:
      return 0;
  }
}

// Je Zeile gezeigte %-Kennzahl: „heute" nur bei Heute-Sortierung, sonst
// „seit Kauf" (das ist auch bei Wert/Name die aussagekräftigste Zahl).
function rowPct(p: Position, key: SortKey): number | null {
  return key === "today" ? p.changePct1d : p.gainPct;
}

export function PositionsList({
  depotId,
  positions,
}: {
  depotId: string;
  positions: Position[];
}) {
  const [sort, setSort] = usePersistentState<SortKey>("posSort", "value");
  const [open, setOpen] = useState(false);

  const sorted = [...positions].sort((a, b) =>
    sort === "name"
      ? a.instrument.name.localeCompare(b.instrument.name)
      : sortVal(b, sort) - sortVal(a, sort),
  );
  const label = SORTS.find((s) => s.key === sort)?.label ?? "Wert";

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Positionen</h2>
        <div className="flex items-center gap-2">
          {/* Sortier-Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-300 active:opacity-70"
            >
              {label}
              <svg
                width="14"
                height="14"
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
                <div className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
                  {SORTS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        setSort(s.key);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-800 ${
                        sort === s.key ? "text-neutral-100" : "text-neutral-400"
                      }`}
                    >
                      {s.label}
                      {sort === s.key && (
                        <span className="text-emerald-400">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <Link
            href={`/depot/${depotId}/neu`}
            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-100 active:opacity-70"
          >
            + Transaktion
          </Link>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">
          In diesem Depot sind noch keine Positionen erfasst.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-900">
          {sorted.map((p) => {
            const pct = rowPct(p, sort);
            return (
              <li key={p.instrument.id}>
                <Link
                  href={`/depot/${depotId}/pos/${p.instrument.id}`}
                  className="flex items-center gap-3 py-4 active:opacity-70"
                >
                  <Avatar label={p.instrument.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {p.instrument.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span>{p.instrument.display_symbol ?? ""}</span>
                      <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 tabular text-neutral-400">
                        ×{formatQuantity(p.quantity)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular font-medium">
                      {formatEur(p.valueEur)}
                    </div>
                    <div className={`text-xs tabular ${changeColor(pct)}`}>
                      {formatPct(pct)}
                      {sort === "today" && (
                        <span className="text-neutral-600"> heute</span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="ml-1 shrink-0 text-neutral-600"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
