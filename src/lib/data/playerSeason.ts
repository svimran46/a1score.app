/**
 * Season stats for the streamed Season section of the player profile.
 *
 * DB SeasonStats rows win. FotMob is only used when there are none, and only
 * when the team of FotMob's latest season matches the player's current club:
 * FotMob is matched by name search, so an unverified hit may be another player.
 * Nulls stay null, and any failure or a 2.5s timeout returns null (the section
 * is optional and simply does not render).
 */

import { getFotmobPlayerStats } from "@/lib/fotmob/client";
import { getClubShortName } from "@/lib/data/clubs";
import type { PlayerProfileVM, SeasonStatRow } from "@/lib/data/playerProfile.types";

export const SEASON_TIMEOUT_MS = 2500;

function countOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function textOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Normalise a raw stats row (DB or FotMob) without filling gaps. */
export function toSeasonStatRow(raw: any): SeasonStatRow | null {
  const season = textOrNull(raw?.season);
  if (!season) return null;
  const rating = countOrNull(raw?.rating);
  return {
    season,
    competition: textOrNull(raw?.competition),
    clubName: textOrNull(raw?.clubName),
    appearances: countOrNull(raw?.appearances),
    goals: countOrNull(raw?.goals),
    assists: countOrNull(raw?.assists),
    minutesPlayed: countOrNull(raw?.minutesPlayed),
    yellowCards: countOrNull(raw?.yellowCards),
    redCards: countOrNull(raw?.redCards),
    rating: rating != null && rating > 0 ? rating : null,
  };
}

/**
 * Start year of a season label: "2025/2026", "2025/26", "25/26", "2025-26" and
 * "2025" all map to 2025. Null when the label has no recognisable year.
 */
export function seasonStartYear(label: string | null | undefined): number | null {
  const s = (label ?? "").trim();
  if (!s) return null;
  const full = s.match(/(\d{4})/);
  if (full) return Number(full[1]);
  const short = s.match(/^(\d{2})\s*[/-]\s*(\d{2})$/);
  if (short) return 2000 + Number(short[1]);
  return null;
}

/** Lower case, accents and FC/CF-style affixes stripped, punctuation collapsed. */
export function normalizeClubName(name: string | null | undefined): string {
  return (name ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(fc|cf|afc|sc|ac)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when two club names refer to the same club after normalisation (full or short name). */
export function clubNamesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const forms = (n: string) =>
    new Set([normalizeClubName(n), normalizeClubName(getClubShortName(n))].filter(Boolean));
  const fa = forms(a);
  for (const f of Array.from(forms(b))) if (fa.has(f)) return true;
  return false;
}

/**
 * Keep FotMob rows only when a team in the latest season matches the current
 * club. Pure, so the verification is testable without the network.
 */
export function verifyFotmobRows(rows: SeasonStatRow[], verifyClubName: string | null): SeasonStatRow[] | null {
  if (!verifyClubName || rows.length === 0) return null;
  let latest: number | null = null;
  for (const r of rows) {
    const y = seasonStartYear(r.season);
    if (y != null && (latest == null || y > latest)) latest = y;
  }
  if (latest == null) return null;
  const latestTeams = rows.filter((r) => seasonStartYear(r.season) === latest).map((r) => r.clubName);
  return latestTeams.some((team) => clubNamesMatch(team, verifyClubName)) ? rows : null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Verified season rows for the profile: DB rows first, else FotMob rows whose
 * latest season's team matches the current club. Null when there are none.
 */
export async function getProfileSeasonStats(
  input: PlayerProfileVM["season"],
  { timeoutMs = SEASON_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<SeasonStatRow[] | null> {
  if (input.dbRows.length > 0) return input.dbRows;
  if (!input.verifyClubName || !input.lookupName) return null;

  try {
    const data = await withTimeout(getFotmobPlayerStats(input.lookupName), timeoutMs);
    if (!data || !Array.isArray(data.seasonStats)) return null;
    const rows = data.seasonStats
      .map(toSeasonStatRow)
      .filter((r): r is SeasonStatRow => r !== null && r.clubName !== null && r.competition !== null);
    return verifyFotmobRows(rows, input.verifyClubName);
  } catch {
    return null;
  }
}
