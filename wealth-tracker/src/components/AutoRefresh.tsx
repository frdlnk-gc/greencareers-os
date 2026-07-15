"use client";

import { useEffect } from "react";
import { revalidateAll } from "@/lib/store";

// Hält Kurse und Chart-Historie aktuell, ohne dass der Nutzer wartet:
//  - Live-Kurse: bei Öffnen, wenn älter als ~1 Stunde (ab 6 Uhr).
//  - Historie/Charts: im Hintergrund nachladen (Krypto sofort komplett,
//    Aktien gedrosselt in mehreren Durchläufen). Läuft in Schleife, bis
//    nichts mehr nachzuladen ist.
//
// Wichtig für die Performance: Es wird NICHT mehr `router.refresh()` gefeuert
// (das rerenderte die ganze Server-Seite und ruckelte). Stattdessen wird nur
// der Client-Store leise revalidiert, wenn wirklich neue Daten da sind.
export function AutoRefresh({ lastUpdatedMs }: { lastUpdatedMs: number | null }) {
  useEffect(() => {
    const HOUR = 60 * 60 * 1000;
    const now = Date.now();
    const hour = new Date().getHours();

    // 1) Live-Kurse (nur wenn nötig, tagsüber).
    if (hour >= 6) {
      const stale = lastUpdatedMs === null || now - lastUpdatedMs > HOUR;
      const lastTry = Number(sessionStorage.getItem("wt-autorefresh") ?? "0");
      if (stale && now - lastTry >= 30 * 60 * 1000) {
        sessionStorage.setItem("wt-autorefresh", String(now));
        fetch("/api/refresh", { method: "POST" })
          .then((r) => (r.ok ? revalidateAll() : null))
          .catch(() => {});
      }
    }

    // 2) Historie im Hintergrund nachladen, bis alles gefüllt ist.
    let cancelled = false;
    const lastBackfill = Number(sessionStorage.getItem("wt-backfill") ?? "0");
    if (now - lastBackfill < 20 * 60 * 1000) return; // höchstens alle 20 Min starten
    sessionStorage.setItem("wt-backfill", String(now));

    async function fillHistory() {
      let anyFilled = false;
      for (let i = 0; i < 8 && !cancelled; i++) {
        try {
          const res = await fetch("/api/backfill", { method: "POST" });
          if (!res.ok) break;
          const data = await res.json();
          const filled = (data.cryptoFilled ?? 0) + (data.usFilled ?? 0);
          if (filled === 0) break; // nichts mehr nachzuladen
          anyFilled = true;
        } catch {
          break;
        }
        // Kurze Pause zwischen den Durchläufen.
        await new Promise((r) => setTimeout(r, 12000));
      }
      // Erst am Ende einmal leise aktualisieren, wenn neue Historie kam.
      if (anyFilled && !cancelled) revalidateAll();
    }
    fillHistory();

    return () => {
      cancelled = true;
    };
  }, [lastUpdatedMs]);

  return null;
}
