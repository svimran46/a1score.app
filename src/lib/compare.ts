/**
 * Utility functions for player and valuation comparisons.
 * Phase 15: Valuation history, comparison, and club value trends.
 */

export interface CompareChange12M {
  diff: number;
  pct: number;
  isPositive: boolean;
  isNegative: boolean;
  baselineValue: number;
}

export interface ComparePeakValuation {
  peakValue: number;
  peakDate: Date | null;
}

/**
 * Parses and sanitizes a players query parameter from the URL.
 * Constraints:
 * - Trims whitespace
 * - Discards empty values
 * - Deduplicates slugs
 * - Clamps to a maximum of 3 players
 */
export function parseCompareSlugs(rawQuery: string | string[] | null | undefined): string[] {
  if (!rawQuery) return [];

  let parts: string[] = [];

  if (Array.isArray(rawQuery)) {
    parts = rawQuery.flatMap((item) => (item || "").split(","));
  } else if (typeof rawQuery === "string") {
    parts = rawQuery.split(",");
  }

  const cleaned = parts
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && /^[a-z0-9_-]+$/.test(s));

  // Deduplicate preserving order
  const unique = Array.from(new Set(cleaned));

  // Maximum 3 players allowed
  return unique.slice(0, 3);
}

/**
 * Calculates 12-month market value change.
 * Finds the valuation point closest to 365 days ago, or the earliest recorded point.
 * Never fabricates numbers.
 */
export function calculate12MonthChange(
  marketValues: Array<{ date: string | Date; valueEur: number }>,
  currentValue: number
): CompareChange12M {
  const current = Number(currentValue) || 0;
  if (current <= 0 || !Array.isArray(marketValues) || marketValues.length === 0) {
    return {
      diff: 0,
      pct: 0,
      isPositive: false,
      isNegative: false,
      baselineValue: 0,
    };
  }

  // Filter valid points with real dates & numbers
  const validPoints = marketValues
    .map((p) => {
      const d = new Date(p.date);
      const val = Number(p.valueEur);
      return { date: d, valueEur: val, timestamp: d.getTime() };
    })
    .filter((p) => !isNaN(p.timestamp) && !isNaN(p.valueEur) && p.valueEur > 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (validPoints.length === 0) {
    return {
      diff: 0,
      pct: 0,
      isPositive: false,
      isNegative: false,
      baselineValue: 0,
    };
  }

  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

  // Find points on or before 1 year ago
  const olderPoints = validPoints.filter((p) => p.timestamp <= oneYearAgo);

  let baselinePoint: { date: Date; valueEur: number; timestamp: number };

  if (olderPoints.length > 0) {
    // Take the most recent point that was at least 1 year ago
    baselinePoint = olderPoints[olderPoints.length - 1];
  } else if (validPoints.length > 1) {
    // If player has history but all within the last year, use the earliest point
    baselinePoint = validPoints[0];
  } else {
    // Only 1 point exists
    baselinePoint = validPoints[0];
  }

  const baseline = baselinePoint.valueEur;
  const diff = current - baseline;
  const pct = baseline > 0 ? (diff / baseline) * 100 : 0;

  return {
    diff,
    pct,
    isPositive: diff > 0,
    isNegative: diff < 0,
    baselineValue: baseline,
  };
}

/**
 * Calculates historical peak market value and the date it was achieved.
 */
export function calculatePeakValuation(
  marketValues: Array<{ date: string | Date; valueEur: number }>,
  currentValue = 0
): ComparePeakValuation {
  let highest = Number(currentValue) || 0;
  let highestDate: Date | null = null;

  if (Array.isArray(marketValues)) {
    for (const point of marketValues) {
      if (!point) continue;
      const val = Number(point.valueEur);
      const d = new Date(point.date);
      if (!isNaN(val) && !isNaN(d.getTime())) {
        if (val > highest) {
          highest = val;
          highestDate = d;
        }
      }
    }
  }

  return {
    peakValue: highest,
    peakDate: highestDate,
  };
}

/**
 * Merges distinct player valuation timelines into a single sorted timeline.
 * Each data point corresponds to a real observed valuation date.
 * Points with null values for other players rely on recharts connectNulls.
 * INVARIANT: Never fabricates or interpolates points.
 */
export function mergeValuationTimelines(
  players: Array<{ slug: string; name: string; marketValues: Array<{ date: string | Date; valueEur: number }> }>
): Array<{ timestamp: number; dateStr: string; [slug: string]: any }> {
  const timestampMap = new Map<number, { timestamp: number; dateStr: string; [key: string]: any }>();

  for (const player of players) {
    if (!player || !Array.isArray(player.marketValues)) continue;

    for (const point of player.marketValues) {
      if (!point || !point.date) continue;
      const d = new Date(point.date);
      const t = d.getTime();
      const val = Number(point.valueEur);

      if (isNaN(t) || isNaN(val) || val <= 0) continue;

      // Group by day to eliminate sub-day jitter
      const dayTimestamp = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

      let entry = timestampMap.get(dayTimestamp);
      if (!entry) {
        entry = {
          timestamp: dayTimestamp,
          dateStr: d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        };
        timestampMap.set(dayTimestamp, entry);
      }

      entry[player.slug] = val;
    }
  }

  return Array.from(timestampMap.values()).sort((a, b) => a.timestamp - b.timestamp);
}
