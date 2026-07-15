"use client";

import { useMemo, useState } from "react";
import { formatEur, formatPct } from "@/lib/format";

// Interaktiver Linien-/Flächenchart aus [Zeit(ms), Wert]-Punkten.
// Zeigt beim Berühren/Hovern den Wert am Punkt. Grün wenn im Plus, sonst rot.
// format: "eur" (Werte in €) oder "pct" (Performance in %).
// baseline: optionale gestrichelte Nulllinie (z. B. 0 % im Performance-Modus).
export function LineChart({
  points,
  height = 160,
  format = "eur",
  baseline,
}: {
  points: [number, number][];
  height?: number;
  format?: "eur" | "pct";
  baseline?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const data = useMemo(
    () => points.filter(([, v]) => Number.isFinite(v)),
    [points],
  );

  const fmt = (v: number) => (format === "pct" ? formatPct(v) : formatEur(v));

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/40 text-xs text-neutral-600"
        style={{ height }}
      >
        Noch keine Kursdaten für diesen Wert.
      </div>
    );
  }

  const w = 600;
  const h = height;
  const pad = 6;
  const values = data.map((d) => d[1]);
  const min = Math.min(...values, baseline ?? Infinity);
  const max = Math.max(...values, baseline ?? -Infinity);
  const range = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * (w - pad * 2) + pad;
  const y = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2);

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d[1]).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1)} ${h} L ${x(0)} ${h} Z`;

  const up = data[data.length - 1][1] >= data[0][1];
  const stroke = up ? "rgb(16 185 129)" : "rgb(239 68 68)";
  const gradId = up ? "lc-up" : "lc-down";

  const hi = hover ?? data.length - 1;
  const [hMs, hVal] = data[hi];
  const hDate = new Date(hMs).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="tabular font-medium">{fmt(hVal)}</span>
        <span className="text-xs text-neutral-500">{hDate}</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full touch-none"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const rel = (e.clientX - rect.left) / rect.width;
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1)))));
        }}
        onTouchMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const rel = (e.touches[0].clientX - rect.left) / rect.width;
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1)))));
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        {baseline !== undefined && baseline >= min && baseline <= max && (
          <line
            x1={pad}
            x2={w - pad}
            y1={y(baseline)}
            y2={y(baseline)}
            stroke="rgb(82 82 82)"
            strokeWidth="1"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <line
          x1={x(hi)}
          x2={x(hi)}
          y1={pad}
          y2={h - pad}
          stroke="rgb(115 115 115)"
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={x(hi)} cy={y(hVal)} r="3.5" fill={stroke} />
      </svg>
    </div>
  );
}
