"use client";

import { useFormStatus } from "react-dom";

// Submit-Button mit Ladezustand (verhindert Doppel-Absenden, gibt Feedback).
export function SubmitButton({
  children,
  className,
  pendingLabel = "Wird gespeichert…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}

// Absenden mit Sicherheitsabfrage (für unwiderrufliche Aktionen wie Löschen).
export function ConfirmButton({
  children,
  className,
  confirm,
  pendingLabel = "…",
}: {
  children: React.ReactNode;
  className?: string;
  confirm: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
      className={className}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
