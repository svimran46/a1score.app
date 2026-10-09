/** Parse a Transfermarkt money string ("€80.00m", "€500k", "€1.20bn") to euros; 0 when absent. */
export function parseEurValue(str: string | null | undefined): number {
  if (!str) return 0;
  const m = str.match(/([\d\.,]+)\s*(bn|b|m|k|th\.)?/i);
  if (!m) return 0;
  const num = parseFloat(m[1].replace(/,/g, "."));
  if (isNaN(num)) return 0;
  const unit = (m[2] || "").toLowerCase();
  if (unit === "bn" || unit === "b") {
    return Math.round(num * 1_000_000_000);
  }
  if (unit === "m") {
    return Math.round(num * 1_000_000);
  }
  if (unit === "k" || unit === "th.") {
    return Math.round(num * 1_000);
  }
  return Math.round(num);
}
