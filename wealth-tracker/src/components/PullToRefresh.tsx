"use client";

import { useEffect, useRef, useState } from "react";
import { refreshAll } from "@/lib/store";

// Pull-to-Refresh: Am oberen Rand nach unten ziehen aktualisiert die Kurse –
// wie in nativen Apps. Zieht der Nutzer weit genug, wird beim Loslassen
// /api/refresh angestoßen und der Client-Store neu geladen.
const THRESHOLD = 70; // ab hier wird ausgelöst
const MAX_PULL = 110; // maximaler sichtbarer Zug

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);
  const refreshingRef = useRef(false);
  const pullRef = useRef(0);
  // aktuellen Zug für die Event-Handler spiegeln (ohne Re-Bind der Listener)
  pullRef.current = pull;

  useEffect(() => {
    function onStart(e: TouchEvent) {
      if (refreshingRef.current) return;
      // Nur starten, wenn ganz oben.
      if (window.scrollY > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      active.current = false;
    }

    function onMove(e: TouchEvent) {
      if (startY.current === null || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        if (active.current) {
          active.current = false;
          setPull(0);
        }
        return;
      }
      if (window.scrollY > 0) {
        startY.current = null;
        setPull(0);
        return;
      }
      // Zug mit Widerstand (fühlt sich „gummiartig" an).
      const dist = Math.min(MAX_PULL, dy * 0.5);
      if (dist > 4) {
        active.current = true;
        // native Scroll/Overscroll unterdrücken, solange wir ziehen
        if (e.cancelable) e.preventDefault();
        setPull(dist);
      }
    }

    async function onEnd() {
      if (startY.current === null) return;
      startY.current = null;
      if (!active.current) return;
      active.current = false;
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPull(56);
        try {
          await refreshAll();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const armed = pull >= THRESHOLD;
  const rotate = Math.min(360, (pull / THRESHOLD) * 300);

  return (
    <div className="relative">
      {/* Zug-Indikator */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
        style={{
          height: pull,
          opacity: pull > 6 ? 1 : 0,
          transition: pull === 0 ? "height 0.25s ease, opacity 0.2s ease" : "none",
        }}
      >
        <div className="flex items-end pb-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border ${
              armed || refreshing
                ? "border-emerald-500 text-emerald-400"
                : "border-neutral-700 text-neutral-500"
            } bg-neutral-950/80`}
          >
            <svg
              className={refreshing ? "animate-spin" : ""}
              style={
                refreshing ? undefined : { transform: `rotate(${rotate}deg)` }
              }
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Inhalt wird beim Ziehen leicht nach unten geschoben */}
      <div
        style={{
          transform: pull > 0 ? `translateY(${pull}px)` : undefined,
          transition:
            pull === 0 ? "transform 0.25s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
