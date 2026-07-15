"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Hält Kurse und Chart-Historie aktuell, ohne dass der Nutzer wartet:
//  - Live-Kurse: bei Öffnen, wenn älter als ~1 Stunde (6–24 Uhr).
//  - Historie/Charts: im Hintergrund nachladen (Krypto sofort komplett,
//    US-Aktien gedrosselt in mehreren Durchläufen). Läuft in Schleife, bis
//    nichts mehr nachzuladen ist.
export function AutoRefresh({ lastUpdatedMs }: { lastUpdatedMs: number | null }) {
  const router = useRouter();

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
          .then((r) => (r.ok ? router.refresh() : null))
          .catch(() => {});
      }
    }

    // 2) Historie im Hintergrund nachladen, bis alles gefüllt ist.
    let cancelled = false;
    const lastBackfill = Number(sessionStorage.getItem("wt-backfill") ?? "0");
    if (now - lastBackfill < 20 * 60 * 1000) return; // höchstens alle 20 Min starten
    sessionStorage.setItem("wt-backfill", String(now));

    async function fillHistory() {
      for (let i = 0; i < 8 && !cancelled; i++) {
        try {
          const res = await fetch("/api/backfill", { method: "POST" });
          if (!res.ok) break;
          const data = await res.json();
          router.refresh();
          const filled = (data.cryptoFilled ?? 0) + (data.usFilled ?? 0);
          if (filled === 0) break; // nichts mehr nachzuladen
        } catch {
          break;
        }
        // Kurze Pause zwischen den Durchläufen.
        await new Promise((r) => setTimeout(r, 12000));
      }
    }
    fillHistory();

    return () => {
      cancelled = true;
    };
  }, [lastUpdatedMs, router]);

  return null;
}
