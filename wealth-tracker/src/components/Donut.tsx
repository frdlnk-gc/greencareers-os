"use client";

// Donut-/Ring-Diagramm aus Segmenten (Wert + Farbe), mit Inhalt in der Mitte.
export function Donut({
  segments,
  centerTitle,
  centerSubtitle,
  size = 230,
  thickness = 24,
}: {
  segments: { label: string; value: number; color: string }[];
  centerTitle: string;
  centerSubtitle?: string;
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const gap = segments.length > 1 ? Math.min(2, circ * 0.004) : 0;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const frac = Math.max(0, seg.value) / total;
    const len = Math.max(0, frac * circ - gap);
    const el = (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={thickness}
        strokeDasharray={`${len} ${circ - len}`}
        strokeDashoffset={-offset}
      />
    );
    offset += frac * circ;
    return el;
  });

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgb(38 38 38)"
          strokeWidth={thickness}
        />
        {arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="tabular text-2xl font-semibold tracking-tight">
          {centerTitle}
        </div>
        {centerSubtitle && (
          <div className="mt-0.5 text-xs text-neutral-500">{centerSubtitle}</div>
        )}
      </div>
    </div>
  );
}

// Erzeugt eine gut unterscheidbare Farbe je Index (Regenbogen wie bei getquin).
export function segmentColor(i: number, n: number): string {
  const hue = Math.round((i / Math.max(1, n)) * 320 + 200) % 360;
  return `hsl(${hue} 60% 58%)`;
}

// Stabile Farbe aus einem Namen (für konsistente Farben in Chart + Liste).
export function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 60% 58%)`;
}
