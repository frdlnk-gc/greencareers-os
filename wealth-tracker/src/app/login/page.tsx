"use client";

import { useActionState } from "react";
import { signIn } from "@/app/auth/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-black text-neutral-950">
          C
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Compound</h1>
        <p className="mt-1 text-sm text-neutral-400">Watch it grow.</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-400" htmlFor="email">
            E-Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-100 outline-none focus:border-neutral-600"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm text-neutral-400"
            htmlFor="password"
          >
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-100 outline-none focus:border-neutral-600"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-neutral-100 py-3 font-semibold text-neutral-900 active:opacity-80 disabled:opacity-50"
        >
          {pending ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
