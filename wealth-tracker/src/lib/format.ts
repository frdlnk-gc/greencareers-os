// Formatierung in deutschem Format (1.234,56 €).

const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eur0 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const pct = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const qty = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

export function formatEur(value: number, decimals = true): string {
  return (decimals ? eur : eur0).format(value);
}

export function formatPct(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "–";
  const sign = value > 0 ? "+" : "";
  return `${sign}${pct.format(value)} %`;
}

export function formatQuantity(value: number): string {
  return qty.format(value);
}

// Vorzeichenbehaftete Farbklasse (grün = plus, rot = minus).
export function changeColor(value: number | null): string {
  if (value === null || value === 0) return "text-neutral-400";
  return value > 0 ? "text-emerald-400" : "text-red-400";
}
