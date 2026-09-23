import "server-only";

/**
 * Season-range handling for API-Football plans.
 *
 * The Free plan only serves season-scoped endpoints for seasons
 * 2022–2024 ("Free plans do not have access to this season, try from
 * 2022 to 2024."). Paid plans unlock newer seasons, so the range is
 * configurable via API_FOOTBALL_SEASON_RANGE ("MIN-MAX", non-secret).
 * Fetchers clamp requested seasons into the allowed range so pages keep
 * working with the best data the plan can serve.
 */

const DEFAULT_MIN = 2022;
const DEFAULT_MAX = 2024;

function parseRange(): { min: number; max: number } {
  const raw = process.env.API_FOOTBALL_SEASON_RANGE?.trim();
  if (raw) {
    const match = /^(\d{4})\s*-\s*(\d{4})$/.exec(raw);
    if (match) {
      const min = Number(match[1]);
      const max = Number(match[2]);
      if (min <= max) return { min, max };
    }
  }
  return { min: DEFAULT_MIN, max: DEFAULT_MAX };
}

const range = parseRange();

/** Lowest season the current API plan serves. */
export const PLAN_MIN_SEASON = range.min;
/** Highest season the current API plan serves. */
export const PLAN_MAX_SEASON = range.max;

/**
 * Clamp a requested season into the plan's allowed range. Invalid values
 * (0, NaN) fall back to the newest allowed season.
 */
export function planSafeSeason(season: number): number {
  if (!Number.isFinite(season) || season <= 0) return range.max;
  return Math.min(Math.max(Math.trunc(season), range.min), range.max);
}
