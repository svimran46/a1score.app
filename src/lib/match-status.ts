/**
 * Client-safe status helpers shared by fixtures UI. (The server-side
 * duplicates in lib/api-football/fixtures.ts serve fetchers; these are
 * importable from Client Components.)
 */

/** Status shorts that mean the match is in play right now. */
export const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"]);
/** Status shorts meaning the match has finished. */
export const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

export function isLiveStatus(statusShort: string): boolean {
  return LIVE_STATUSES.has(statusShort);
}

export function isFinishedStatus(statusShort: string): boolean {
  return FINISHED_STATUSES.has(statusShort);
}

export function isUpcomingStatus(statusShort: string): boolean {
  return statusShort === "NS";
}

/**
 * Display chip for a fixture's status: live minute, kickoff time, or a
 * terminal state label.
 */
export function statusChip(
  fixture: { statusShort: string; elapsed: number | null; date: string },
): { label: string; tone: "live" | "muted" | "plain" } {
  const { statusShort, elapsed, date } = fixture;

  if (isLiveStatus(statusShort)) {
    if (statusShort === "HT") return { label: "HT", tone: "live" };
    const minute = elapsed ?? 0;
    return { label: `${minute}'`, tone: "live" };
  }

  if (statusShort === "FT") return { label: "FT", tone: "muted" };
  if (statusShort === "AET") return { label: "AET", tone: "muted" };
  if (statusShort === "PEN") return { label: "PEN", tone: "muted" };
  if (statusShort === "PST") return { label: "Postponed", tone: "plain" };
  if (statusShort === "CANC") return { label: "Cancelled", tone: "plain" };
  if (statusShort === "ABD") return { label: "Abandoned", tone: "plain" };
  if (statusShort === "AWD") return { label: "Awrd.", tone: "muted" };
  if (statusShort === "WO") return { label: "Walkover", tone: "muted" };

  if (isUpcomingStatus(statusShort)) {
    const kickoff = new Date(date);
    if (Number.isNaN(kickoff.getTime())) return { label: "—", tone: "plain" };
    // Fixed UTC + locale keeps SSR and hydration identical regardless of
    // the viewer's timezone (no hydration mismatch on kickoff times).
    return {
      label: kickoff.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }),
      tone: "plain",
    };
  }

  return { label: statusShort, tone: "plain" };
}

/** YYYY-MM-DD in local time for a Date. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Human label like "Today" / "Tomorrow" / "Mon 3 Nov". */
export function dateKeyLabel(dateKey: string): string {
  const today = toDateKey(new Date());
  const tomorrow = toDateKey(new Date(Date.now() + 86_400_000));
  const yesterday = toDateKey(new Date(Date.now() - 86_400_000));
  if (dateKey === today) return "Today";
  if (dateKey === tomorrow) return "Tomorrow";
  if (dateKey === yesterday) return "Yesterday";
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}
