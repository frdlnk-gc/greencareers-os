"use client";

import { useTransition } from "react";
import { revalidateAll } from "@/lib/store";

// Freundlicher Fehlerzustand, falls das Laden dauerhaft scheitert (statt eines
// endlosen Ladebalkens). Der Store versucht es zwar automatisch erneut, hier
// kann man es zusätzlich manuell anstoßen.
export function LoadError({ label = "Daten" }: { label?: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-center">
      <div className="mb-1 font-medium">
        {label} konnten nicht geladen werden
      </div>
      <p className="mb-4 text-sm text-neutral-400">
        Prüfe kurz deine Internetverbindung.
      </p>
      <button
        onClick={() => start(() => void revalidateAll())}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-100 active:opacity-70 disabled:opacity-50"
      >
        {pending ? "Wird geladen…" : "Erneut versuchen"}
      </button>
    </div>
  );
}
