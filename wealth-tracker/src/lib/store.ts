"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import type { PortfolioSummary } from "./types";
import type { Period, PeriodResult } from "./history";
import type { DividendSummary } from "./data";

// Client-seitiger Daten-Store mit Modul-Cache + Subscription.
//
// Warum: Die Seiten waren zuvor `force-dynamic`-Server-Komponenten – jeder
// Tab-Wechsel bedeutete einen kompletten Server-Roundtrip inkl. schwerer
// DB-Abfragen (1–3 s). Jetzt werden die Daten EINMAL geladen, im Modul-Cache
// gehalten und bei jedem Tab-Wechsel sofort aus dem Speicher gerendert; im
// Hintergrund wird bei Bedarf revalidiert. So fühlt sich die App wie eine
// native App an.

export interface PerfData {
  total: Record<Period, PeriodResult>;
  byAccount: Record<string, Record<Period, PeriodResult>>;
  totalSeries: [number, number][];
  seriesByAccount: Record<string, [number, number][]>;
}

export type PortfolioWithMeta = PortfolioSummary & {
  lastUpdate: string | null;
};

interface Entry {
  data: unknown;
  at: number;
  inflight: Promise<unknown> | null;
  error: boolean;
}

const TTL = 60_000; // 1 Minute: darunter kein erneuter Netzabruf
const store = new Map<string, Entry>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function ensure(key: string): Entry {
  let e = store.get(key);
  if (!e) {
    e = { data: null, at: 0, inflight: null, error: false };
    store.set(key, e);
  }
  return e;
}

async function load<T>(key: string, url: string, force = false): Promise<T> {
  const e = ensure(key);
  if (!force && e.data !== null && Date.now() - e.at < TTL) {
    return e.data as T;
  }
  if (e.inflight) return e.inflight as Promise<T>;
  e.inflight = fetch(url, { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`${url} ${r.status}`);
      return r.json();
    })
    .then((data) => {
      e.data = data;
      e.at = Date.now();
      e.inflight = null;
      e.error = false;
      emit();
      return data;
    })
    .catch((err) => {
      e.inflight = null;
      e.error = true;
      emit();
      throw err;
    });
  return e.inflight as Promise<T>;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Generischer Hook: liefert sofort den (evtl. gecachten) Wert und lädt bei
// Bedarf nach. `null` = wird noch geladen.
//
// swr=true: bei jedem Mount im Hintergrund neu laden (TTL wird ignoriert). So
// sind z. B. die Portfolio-Zahlen nach dem Hinzufügen/Löschen einer
// Transaktion sofort korrekt – die alte Ansicht wird währenddessen aus dem
// Cache angezeigt, es ruckelt also nicht.
function useResource<T>(
  key: string,
  url: string,
  swr = false,
): {
  data: T | null;
  loading: boolean;
  error: boolean;
} {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => store.get(key)?.data as T | undefined,
    () => undefined,
  );
  const errored = useSyncExternalStore(
    subscribe,
    () => store.get(key)?.error ?? false,
    () => false,
  );

  useEffect(() => {
    load<T>(key, url, swr).catch(() => {});
  }, [key, url, swr]);

  // Bei einem Fehler (z. B. kurzer Netz-/Serveraussetzer) automatisch erneut
  // versuchen, damit die Seite nicht dauerhaft im Ladezustand hängt.
  useEffect(() => {
    if (!errored) return;
    const t = setTimeout(() => {
      load<T>(key, url, true).catch(() => {});
    }, 4000);
    return () => clearTimeout(t);
  }, [errored, key, url]);

  const data = snapshot ?? null;
  return { data, loading: data === null && !errored, error: errored };
}

export function usePortfolio() {
  const { data, loading, error } = useResource<PortfolioWithMeta>(
    "portfolio",
    "/api/portfolio",
    true,
  );
  return { portfolio: data, loading, error };
}

export function usePerformance() {
  return useResource<PerfData>("performance", "/api/performance");
}

export function useDividends() {
  return useResource<DividendSummary>("dividends", "/api/dividends");
}

// Alle Daten neu laden (nach „Aktualisieren" / Pull-to-Refresh). Löst zuerst
// serverseitig neue Live-Kurse aus, dann werden die Ansichten aktualisiert.
export async function refreshAll(): Promise<void> {
  try {
    await fetch("/api/refresh", { method: "POST" });
  } catch {
    /* offline o. Ä. – trotzdem lokale Daten neu ziehen */
  }
  await Promise.all([
    load("portfolio", "/api/portfolio", true).catch(() => {}),
    load("performance", "/api/performance", true).catch(() => {}),
    load("dividends", "/api/dividends", true).catch(() => {}),
  ]);
}

// Nur den lokalen Cache neu ziehen (z. B. nachdem Backfill-Historie kam).
export async function revalidateAll(): Promise<void> {
  await Promise.all([
    load("portfolio", "/api/portfolio", true).catch(() => {}),
    load("performance", "/api/performance", true).catch(() => {}),
    load("dividends", "/api/dividends", true).catch(() => {}),
  ]);
}
