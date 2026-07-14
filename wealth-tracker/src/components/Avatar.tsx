// Runder Platzhalter mit Initialen (Logo-Ersatz, bis echte Logos da sind).
export function Avatar({
  label,
  size = 44,
}: {
  label: string;
  size?: number;
}) {
  const initials = label
    .replace(/[^a-zA-Z0-9äöüÄÖÜ ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-neutral-800 font-semibold text-neutral-300"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials || "•"}
    </div>
  );
}
