"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Aktualisiert die Kurse automatisch, wenn die App geöffnet wird und die
// letzten Kurse älter als ~1 Stunde sind — aber nur zwischen 6 und 24 Uhr.
// Läuft still im Hintergrund; ein sessionStorage-Schutz verhindert Schleifen.
export function AutoRefresh({ lastUpdatedMs }: { lastUpdatedMs: number | null }) {
  const router = useRouter();

  useEffect(() => {
    const HOUR = 60 * 60 * 1000;
    const now = Date.now();
    const hour = new Date().getHours();
    if (hour < 6) return; // nachts nicht

    const stale = lastUpdatedMs === null || now - lastUpdatedMs > HOUR;
    const lastTry = Number(sessionStorage.getItem("wt-autorefresh") ?? "0");
    if (now - lastTry < 30 * 60 * 1000) return; // höchstens alle 30 Min versuchen
    if (!stale) return;

    sessionStorage.setItem("wt-autorefresh", String(now));
    fetch("/api/refresh", { method: "POST" })
      .then((r) => (r.ok ? router.refresh() : null))
      .catch(() => {});
  }, [lastUpdatedMs, router]);

  return null;
}
