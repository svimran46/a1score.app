/**
 * Pure valuation helpers for the player profile.
 *
 * Every function works on real, dated history points only: synthetic points
 * (ids starting with "latest-"), zero values and invalid dates are dropped, and
 * nothing is ever dated "now". When a fact cannot be established the helper
 * returns null rather than a fallback. calculate12MonthChange in compare.ts is
 * intentionally left alone for /compare.
 */

import type {
  CurrentValuation,
  FirstValuation,
  PeakValuation,
  Staleness,
  ValuationPoint,
  ValueDelta,
} from "@/lib/data/playerProfile.types";

const DAY_MS = 86_400_000;

function toTime(input: unknown): number | null {
  if (input == null || input === "") return null;
  const d = input instanceof Date ? input : new Date(input as string | number);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function toNumber(input: unknown): number {
  if (typeof input === "number") return input;
  if (typeof input === "bigint") return Number(input);
  if (typeof input === "string" && input.trim() !== "") return Number(input);
  return NaN;
}

/** Real valuation points: valid date, value > 0, no synthetic ids; ascending, one per UTC day. */
export function realPoints(mvs: unknown): ValuationPoint[] {
  if (!Array.isArray(mvs)) return [];
  const rows: { t: number; point: ValuationPoint }[] = [];
  for (const raw of mvs) {
    if (!raw || typeof raw !== "object") continue;
    const mv = raw as Record<string, unknown>;
    if (typeof mv.id === "string" && mv.id.startsWith("latest-")) continue;
    const t = toTime(mv.date);
    if (t == null) continue;
    const valueEur = toNumber(mv.valueEur);
    if (!Number.isFinite(valueEur) || valueEur <= 0) continue;
    const club = typeof mv.clubName === "string" ? mv.clubName.trim() : "";
    rows.push({ t, point: { date: new Date(t).toISOString(), valueEur, clubName: club || null } });
  }
  rows.sort((a, b) => a.t - b.t);

  // De-duplicate by UTC day; the later entry for a day wins.
  const out: ValuationPoint[] = [];
  let lastDay = "";
  for (const { point } of rows) {
    const day = point.date.slice(0, 10);
    if (day === lastDay) out[out.length - 1] = point;
    else out.push(point);
    lastDay = day;
  }
  return out;
}

/**
 * The headline value. latestMarketValue wins when positive, otherwise the last
 * real point. asOf is only known when the last real point carries that value.
 */
export function currentValuation(
  latestMarketValue: number | null | undefined,
  points: ValuationPoint[]
): CurrentValuation | null {
  const last = points.length > 0 ? points[points.length - 1] : null;
  const latest = toNumber(latestMarketValue);
  const valueEur = Number.isFinite(latest) && latest > 0 ? latest : last?.valueEur ?? null;
  if (valueEur == null || valueEur <= 0) return null;
  const asOf = last && last.valueEur === valueEur ? last.date : null;
  return { valueEur, asOf };
}

function pctChange(diff: number, base: number): number | null {
  return base > 0 ? (diff / base) * 100 : null;
}

/** Change between the last two real points; null unless the last point is the dated current value. */
export function sincePrevious(points: ValuationPoint[], current: CurrentValuation | null): ValueDelta | null {
  if (!current || current.asOf == null || points.length < 2) return null;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  if (last.date !== current.asOf || last.valueEur !== current.valueEur) return null;
  const diffEur = last.valueEur - prev.valueEur;
  return { diffEur, pct: pctChange(diffEur, prev.valueEur), basisDate: prev.date };
}

/**
 * Strict 12-month change: the baseline is the last real point dated on or
 * before now - 365 days. No baseline (or an undated current value) means null;
 * there is no earliest-point fallback.
 */
export function twelveMonth(
  points: ValuationPoint[],
  current: CurrentValuation | null,
  now: Date
): ValueDelta | null {
  if (!current || current.asOf == null) return null;
  const cutoff = now.getTime() - 365 * DAY_MS;
  let baseline: ValuationPoint | null = null;
  for (const p of points) {
    if (new Date(p.date).getTime() <= cutoff) baseline = p;
    else break;
  }
  if (!baseline) return null;
  const diffEur = current.valueEur - baseline.valueEur;
  return { diffEur, pct: pctChange(diffEur, baseline.valueEur), basisDate: baseline.date };
}

/** Highest real valuation (first date it was reached). Needs at least 2 points. */
export function peak(points: ValuationPoint[], current: CurrentValuation | null): PeakValuation | null {
  if (points.length < 2) return null;
  let best = points[0];
  for (const p of points) if (p.valueEur > best.valueEur) best = p;
  const cur = current?.valueEur ?? points[points.length - 1].valueEur;
  const isCurrent = cur >= best.valueEur;
  const pctBelow = isCurrent ? 0 : Math.max(0, Math.min(100, ((best.valueEur - cur) / best.valueEur) * 100));
  return { valueEur: best.valueEur, date: best.date, pctBelow, isCurrent };
}

/** Whole years between two dates, in UTC. */
export function ageOn(dob: string | Date | null | undefined, on: string | Date): number | null {
  const b = toTime(dob);
  const o = toTime(on);
  if (b == null || o == null || o < b) return null;
  const bd = new Date(b);
  const od = new Date(o);
  let age = od.getUTCFullYear() - bd.getUTCFullYear();
  const m = od.getUTCMonth() - bd.getUTCMonth();
  if (m < 0 || (m === 0 && od.getUTCDate() < bd.getUTCDate())) age--;
  return age >= 0 && age <= 120 ? age : null;
}

/** First valuation on record, with the player's age on that date when the DOB is known. */
export function firstOnRecord(points: ValuationPoint[], dob: string | Date | null | undefined): FirstValuation | null {
  if (points.length === 0) return null;
  const first = points[0];
  return { valueEur: first.valueEur, date: first.date, ageAtDate: ageOn(dob, first.date) };
}

/** Valuation in effect on a date: the last point on or before it, at most maxGapDays earlier. */
export function valueAt(
  points: ValuationPoint[],
  date: string | Date,
  maxGapDays = 183
): ValuationPoint | null {
  const t = toTime(date);
  if (t == null) return null;
  let hit: ValuationPoint | null = null;
  for (const p of points) {
    const pt = new Date(p.date).getTime();
    if (pt <= t) hit = p;
    else break;
  }
  if (!hit) return null;
  return t - new Date(hit.date).getTime() <= maxGapDays * DAY_MS ? hit : null;
}

/** fresh <= 180 days, aging 181-365, stale > 365, unknown without a date. */
export function staleness(asOf: string | Date | null | undefined, now: Date): Staleness {
  const t = toTime(asOf);
  if (t == null) return "unknown";
  const days = Math.floor((now.getTime() - t) / DAY_MS);
  if (days <= 180) return "fresh";
  if (days <= 365) return "aging";
  return "stale";
}

function utcIso(y: number, m: number, d: number): string | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString();
}

/**
 * Contract end from a source string: ISO ("2029-06-30", "2029-06-30T00:00:00.000Z"),
 * "30/06/2029" or "30.06.2029". Anything else returns null. Result is an ISO string.
 */
export function parseContractUntil(raw: string | Date | null | undefined): string | null {
  if (raw == null) return null;
  if (raw instanceof Date) return Number.isFinite(raw.getTime()) ? raw.toISOString() : null;
  const s = String(raw).trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/);
  if (iso) {
    if (s.length > 10) {
      const t = new Date(s).getTime();
      return Number.isFinite(t) && utcIso(+iso[1], +iso[2], +iso[3]) ? new Date(t).toISOString() : null;
    }
    return utcIso(+iso[1], +iso[2], +iso[3]);
  }

  const dmy = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (dmy) return utcIso(+dmy[3], +dmy[2], +dmy[1]);

  return null;
}

/** Whole calendar months from now until the date (UTC); negative when it has passed. */
export function monthsUntil(date: string | Date | null | undefined, now: Date): number | null {
  const t = toTime(date);
  if (t == null) return null;
  const d = new Date(t);
  let months = (d.getUTCFullYear() - now.getUTCFullYear()) * 12 + (d.getUTCMonth() - now.getUTCMonth());
  if (t >= now.getTime()) {
    if (d.getUTCDate() < now.getUTCDate()) months--;
  } else if (d.getUTCDate() > now.getUTCDate()) {
    months++;
  }
  return months;
}
