/**
 * Formatters for money, deltas and dates on valuation surfaces.
 *
 * Unlike formatCompactEur (which renders 0 as "Free" and uses a hyphen for
 * negatives), these never invent meaning: a missing or zero value returns
 * null, minus signs are U+2212, and dates are en-GB in UTC so server and
 * client islands always agree.
 */

const MINUS = "−";

function compactMagnitude(abs: number): { num: string; suffix: "B" | "M" | "K" | "" } {
  const trim = (s: string) => (s.endsWith(".0") ? s.slice(0, -2) : s);
  if (abs >= 999_950_000) return { num: trim((abs / 1_000_000_000).toFixed(2).replace(/0$/, "")), suffix: "B" };
  if (abs >= 999_500) {
    const m = abs / 1_000_000;
    return { num: trim(m >= 100 ? m.toFixed(0) : m.toFixed(1)), suffix: "M" };
  }
  if (abs >= 1_000) return { num: (abs / 1_000).toFixed(0), suffix: "K" };
  return { num: String(Math.round(abs)), suffix: "" };
}

/** "€180M", "€1.5M", "€750K", "€1.25B"; null for null, NaN, 0 or negative. */
export function formatValueEur(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const { num, suffix } = compactMagnitude(value);
  return `€${num}${suffix}`;
}

/** Parts for typographic treatment: { currency: "€", number: "180", suffix: "M" } */
export function valueEurParts(value: number | null | undefined): { currency: string; number: string; suffix: string } | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const { num, suffix } = compactMagnitude(value);
  return { currency: "€", number: num, suffix };
}

/** Axis labels: like formatValueEur but renders 0 as "€0". */
export function formatAxisEur(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "€0";
  return formatValueEur(value) ?? "€0";
}

/** "+€20M", "−€5M", "€0" */
export function formatSignedEur(diff: number): string {
  if (!Number.isFinite(diff) || diff === 0) return "€0";
  const { num, suffix } = compactMagnitude(Math.abs(diff));
  return `${diff > 0 ? "+" : MINUS}€${num}${suffix}`;
}

/** "+12.5%", "−3.2%", "0%" (one decimal, trailing ".0" kept for alignment) */
export function formatSignedPct(pct: number): string {
  if (!Number.isFinite(pct) || pct === 0) return "0%";
  return `${pct > 0 ? "+" : MINUS}${Math.abs(pct).toFixed(1)}%`;
}

/** Screen-reader amount: "180 million euros", "1.5 million euros", "750 thousand euros". */
export function spokenEur(value: number): string {
  const abs = Math.abs(value);
  const trim = (n: number) => String(Number(n.toFixed(2)));
  if (abs >= 1_000_000_000) return `${trim(abs / 1_000_000_000)} billion euros`;
  if (abs >= 1_000_000) return `${trim(abs / 1_000_000)} million euros`;
  if (abs >= 1_000) return `${trim(abs / 1_000)} thousand euros`;
  return `${Math.round(abs)} euros`;
}

function toDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : input;
  return isNaN(d.getTime()) ? null : d;
}

/** "12 Mar 2026" (UTC) or "" */
export function formatDateGB(input: string | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

/** "Jun 2025" (UTC) or "" */
export function formatMonthYear(input: string | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

/** "12 June 2025" for screen-reader sentences (UTC) or "" */
export function formatDateLong(input: string | Date | null | undefined): string {
  const d = toDate(input);
  if (!d) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

/** "2,340" */
export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

export interface DeltaDescription {
  direction: "up" | "down" | "flat";
  /** "▲" | "▼" | null (aria-hidden in UI) */
  arrow: string | null;
  /** "+€20M" / "−€5M" */
  amount: string;
  /** "+12.5%" / "−3.2%" or null when the base was 0 */
  pct: string | null;
  /** "Jun 2025" */
  basisMonth: string;
  /** "12 Jun 2025" */
  basisDay: string;
  /** Visible one-liner: "▲ +€20M (+12.5%) since Jun 2025" or "Unchanged since Jun 2025" */
  text: string;
  /** Screen-reader sentence: "Up 20 million euros, 12.5 percent, since 12 June 2025" */
  spoken: string;
}

/**
 * One delta grammar for every surface (hero, key numbers, chart readout,
 * valuation table, share card). Arrow + sign + percentage + basis date always
 * travel together so direction never relies on colour alone.
 */
export function describeDelta(delta: { diffEur: number; pct: number | null; basisDate: string }): DeltaDescription {
  const basisMonth = formatMonthYear(delta.basisDate);
  const basisDay = formatDateGB(delta.basisDate);
  const basisLong = formatDateLong(delta.basisDate);
  if (!Number.isFinite(delta.diffEur) || delta.diffEur === 0) {
    return {
      direction: "flat",
      arrow: null,
      amount: "€0",
      pct: null,
      basisMonth,
      basisDay,
      text: `Unchanged since ${basisMonth}`,
      spoken: `Unchanged since ${basisLong}`,
    };
  }
  const up = delta.diffEur > 0;
  const amount = formatSignedEur(delta.diffEur);
  const pct = delta.pct == null || !Number.isFinite(delta.pct) ? null : formatSignedPct(delta.pct);
  const arrow = up ? "▲" : "▼";
  const spokenPct = pct ? `, ${Math.abs(delta.pct as number).toFixed(1)} percent` : "";
  return {
    direction: up ? "up" : "down",
    arrow,
    amount,
    pct,
    basisMonth,
    basisDay,
    text: `${arrow} ${amount}${pct ? ` (${pct})` : ""} since ${basisMonth}`,
    spoken: `${up ? "Up" : "Down"} ${spokenEur(Math.abs(delta.diffEur))}${spokenPct}, since ${basisLong}`,
  };
}
