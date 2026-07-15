"use client";

import { useState } from "react";
import { signOut } from "@/app/auth/actions";

// Kopfzeile mit Titel und Konto-Menü (Abmelden). Aktualisiert wird per
// „nach unten ziehen" (Pull-to-Refresh) – daher kein separater Button mehr.
export function AppHeader({ title }: { title: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="mb-6">
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
            <>
              <span
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
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
            </>
          )}
        </button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
    </header>
  );
}
