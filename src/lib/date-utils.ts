/**
 * src/lib/date-utils.ts
 *
 * Unified Date and Freshness Utilities for Matches and Fixtures
 */

/**
 * Format a Date object to YYYYMMDD string in UTC.
 */
export function formatToYyyyMmDd(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * Determine default active date in YYYYMMDD.
 * If user passes an explicit date parameter, use it.
 * Otherwise, default to today in UTC.
 */
export function getDefaultMatchDate(dateParam?: string | null): string {
  if (dateParam && /^\d{8}$/.test(dateParam)) {
    return dateParam;
  }
  return formatToYyyyMmDd(new Date());
}

/**
 * Check if a YYYYMMDD date string represents "today" in UTC.
 */
export function isTodayUtc(dateStr: string, now: Date = new Date()): boolean {
  return dateStr === formatToYyyyMmDd(now);
}

/**
 * Check if a date string is in the past (before today in UTC).
 */
export function isPastDateUtc(dateStr: string, now: Date = new Date()): boolean {
  return dateStr < formatToYyyyMmDd(now);
}

/**
 * Check if a date string is in the future (after today in UTC).
 */
export function isFutureDateUtc(dateStr: string, now: Date = new Date()): boolean {
  return dateStr > formatToYyyyMmDd(now);
}

/**
 * Compute edge and fetch cache TTL (in seconds) based on active date and live presence.
 * - Live matches present / Today: 30–60s TTL (ultra-fresh).
 * - Future fixtures: 300s (5 min).
 * - Past / Finished dates: 86400s (24 hours).
 */
export function getMatchCacheTtl(dateStr: string, hasLiveMatches = false, now: Date = new Date()): number {
  if (hasLiveMatches) {
    return 30; // 30s during active live play
  }
  if (isTodayUtc(dateStr, now)) {
    return 60; // 60s for today
  }
  if (isPastDateUtc(dateStr, now)) {
    return 86400; // 24h for past/completed matchdays
  }
  return 300; // 5m for upcoming matchdays
}

export interface StaleStatusResult {
  isStale: boolean;
  statusLabel: string; // e.g. "45+3'", "Live", "Status unconfirmed"
  isUnconfirmed: boolean;
}

/**
 * Evaluate if a live match is stale or has an implausible stoppage minute.
 *
 * Rules:
 * 1. If match is marked live, but last update timestamp is older than maxAgeMinutes (default 3m),
 *    mark as "Status unconfirmed".
 * 2. Implausible minute checks:
 *    - 1st half: greater than 45+10' (unless feed explicitly specifies reason/penalty shootout)
 *    - 2nd half / normal time: greater than 90+15' (unless explicitly extra time / ET)
 */
export function evaluateLiveMatchFreshness(params: {
  isLive: boolean;
  liveMinuteStr?: string | null;
  liveTimeLong?: string | null;
  lastUpdatedMs?: number | null;
  nowMs?: number;
  reason?: string | null;
}): StaleStatusResult {
  const { isLive, liveMinuteStr, liveTimeLong, lastUpdatedMs, nowMs = Date.now(), reason } = params;

  if (!isLive) {
    return {
      isStale: false,
      statusLabel: liveMinuteStr || "",
      isUnconfirmed: false,
    };
  }

  // 1. Time-since-last-update check (3-minute threshold)
  if (lastUpdatedMs && nowMs - lastUpdatedMs > 3 * 60 * 1000) {
    return {
      isStale: true,
      statusLabel: "Status unconfirmed",
      isUnconfirmed: true,
    };
  }

  const rawMinute = (liveMinuteStr || "").trim();
  const isHT = rawMinute.toUpperCase() === "HT" || (reason && reason.toUpperCase() === "HT");
  if (isHT) {
    return {
      isStale: false,
      statusLabel: "HT",
      isUnconfirmed: false,
    };
  }

  // 2. Parse minute number and added time
  // Matches patterns like "45+13'", "45+13", "105'", "47'"
  const stoppageMatch = rawMinute.match(/^(\d+)\+(\d+)/);
  if (stoppageMatch) {
    const baseMin = parseInt(stoppageMatch[1], 10);
    const addedMin = parseInt(stoppageMatch[2], 10);

    // First half stoppage check: > 45+10
    if (baseMin === 45 && addedMin > 10) {
      return {
        isStale: true,
        statusLabel: "Status unconfirmed",
        isUnconfirmed: true,
      };
    }

    // Second half stoppage check: > 90+15 (unless extra time)
    if (baseMin === 90 && addedMin > 15) {
      const isExtraTime = reason && (reason.toLowerCase().includes("extra") || reason.toLowerCase().includes("et"));
      if (!isExtraTime) {
        return {
          isStale: true,
          statusLabel: "Status unconfirmed",
          isUnconfirmed: true,
        };
      }
    }
  } else {
    // Normal minute format: "58'", "112'"
    const directNum = parseInt(rawMinute.replace(/[^\d]/g, ""), 10);
    if (!isNaN(directNum)) {
      // 1st half implausible: between 56 and 60 when second half hasn't started
      // (usually represented as 45+X)
      // Second half implausible without ET: > 105
      if (directNum > 105) {
        const isExtraTime = reason && (reason.toLowerCase().includes("extra") || reason.toLowerCase().includes("et"));
        if (!isExtraTime) {
          return {
            isStale: true,
            statusLabel: "Status unconfirmed",
            isUnconfirmed: true,
          };
        }
      }
    }
  }

  return {
    isStale: false,
    statusLabel: rawMinute || "LIVE",
    isUnconfirmed: false,
  };
}
