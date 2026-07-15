"use client";

import { useEffect, useState } from "react";

// Kleiner Zustand, der in localStorage gespiegelt wird – für Ansichts-
// Einstellungen (Chart-Scope/Modus/Zeitraum, Sortierung der Positionen), damit
// die Auswahl beim Tab-Wechsel oder erneuten Öffnen erhalten bleibt.
//
// SSR-sicher: Der erste Render nutzt IMMER den Default (Server = Client, keine
// Hydration-Warnung); erst nach dem Mount wird aus localStorage gelesen.
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* localStorage nicht verfügbar / defekter Wert – Default behalten */
    }
    // Nur beim Mount lesen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Speichern nicht möglich – egal */
    }
  }, [key, value]);

  return [value, setValue];
}
