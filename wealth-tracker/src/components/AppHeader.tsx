"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOut } from "@/app/auth/actions";

// Kopfzeile mit Titel, Live-Aktualisieren-Button und Abmelden.
export function AppHeader({ title }: { title: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/refresh", { method: "POST" });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(body.error ?? "Aktualisieren fehlgeschlagen.");
        }
      } catch {
        setError("Netzwerkfehler beim Aktualisieren.");
      }
      router.refresh();
    });
  }

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-neutral-300"
            aria-label="Konto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
            {menuOpen && (
              <div className="absolute left-0 top-11 z-30 w-40 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 text-left text-sm shadow-xl">
                <form action={signOut}>
                  <button
                    type="submit"
                    className="block w-full px-4 py-3 text-left text-neutral-200 hover:bg-neutral-800"
                  >
                    Abmelden
                  </button>
                </form>
              </div>
            )}
          </button>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>

        <button
          onClick={refresh}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-neutral-300 active:opacity-60 disabled:opacity-50"
          aria-label="Aktualisieren"
        >
          <svg
            className={isPending ? "animate-spin" : ""}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          {isPending ? "Lädt…" : "Aktualisieren"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-right text-xs text-red-400">{error}</p>
      )}
    </header>
  );
}
