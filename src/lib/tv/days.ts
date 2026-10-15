import type { TvListing } from "./types";

/** Broadcasts that started longer ago than this are treated as finished and hidden. */
export const FINISHED_AFTER_MS = 3 * 60 * 60 * 1000;

export interface TvDay {
  /** YYYY-MM-DD in the viewer's timezone. */
  key: string;
  /** "Today", "Tomorrow" or "Sat 17 Oct". */
  label: string;
  listings: TvListing[];
}

export function localDayKey(date: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function dayLabel(key: string, todayKey: string, tomorrowKey: string): string {
  if (key === todayKey) return "Today";
  if (key === tomorrowKey) return "Tomorrow";
  // Noon UTC of that calendar day formats to the same date in any timezone label.
  // Browsers print "Sat, 17 Oct" and Node "Sat 17 Oct"; drop the comma so both agree.
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(`${key}T12:00:00Z`))
    .replace(",", "");
}

/**
 * Groups upcoming broadcasts by calendar day in the viewer's timezone,
 * dropping ones that have finished. Days are in order; listings keep their
 * start-time order.
 */
export function groupByLocalDay(listings: TvListing[], now: Date, timeZone: string): TvDay[] {
  const todayKey = localDayKey(now, timeZone);
  const tomorrowKey = localDayKey(new Date(now.getTime() + 24 * 60 * 60 * 1000), timeZone);
  const days = new Map<string, TvListing[]>();
  for (const l of listings) {
    const start = new Date(l.startTime);
    if (Number.isNaN(start.getTime()) || now.getTime() - start.getTime() > FINISHED_AFTER_MS) continue;
    const key = localDayKey(start, timeZone);
    if (key < todayKey) continue;
    days.set(key, [...(days.get(key) ?? []), l]);
  }
  return Array.from(days.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({ key, label: dayLabel(key, todayKey, tomorrowKey), listings: items }));
}
