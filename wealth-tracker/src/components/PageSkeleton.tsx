// Einfaches Lade-Skelett für serverseitig gerenderte Detailseiten, damit beim
// Antippen sofort etwas erscheint (statt auf der alten Seite zu „hängen").
export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-neutral-900" />
        <div className="h-6 w-40 rounded bg-neutral-900" />
      </div>
      <div className="mb-4 h-10 w-52 rounded bg-neutral-900" />
      <div className="mb-6 h-4 w-36 rounded bg-neutral-900" />
      <div className="mb-6 h-[150px] w-full rounded-xl bg-neutral-900" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-neutral-900" />
        ))}
      </div>
    </div>
  );
}
