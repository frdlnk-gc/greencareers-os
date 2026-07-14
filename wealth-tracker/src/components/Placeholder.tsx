export function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-center text-sm text-neutral-400">
      {text}
    </div>
  );
}
