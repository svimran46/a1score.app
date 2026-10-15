import type { FotmobLeagueGroup, FotmobMatch } from "@/lib/fotmob/client";
import { sortMatchesByTime, type TimedMatch } from "./byTime";

export interface MappedMatch extends TimedMatch {
  /** a1score club ids for the two sides (null when a side isn't mapped). */
  homeClubId: string | null;
  awayClubId: string | null;
}

type TeamMappings = Record<number, { clubId?: string }>;

/**
 * Server side: the day's matches in which at least one team maps to an
 * a1score club, in kick-off order. Followed clubs are stored by a1score club
 * id, so this exact id mapping (not team names) decides what is "following".
 */
export function matchesWithMappedClubs(leagues: FotmobLeagueGroup[], mappings: TeamMappings): MappedMatch[] {
  const clubOf = (teamId: number | undefined) => (teamId != null ? mappings[teamId]?.clubId ?? null : null);
  return sortMatchesByTime(leagues)
    .map((row) => ({ ...row, homeClubId: clubOf(row.match.home?.id), awayClubId: clubOf(row.match.away?.id) }))
    .filter((row) => row.homeClubId || row.awayClubId);
}

/** Client side: the subset involving a followed club. */
export function followedMatches(rows: MappedMatch[], followedClubIds: Iterable<string>): MappedMatch[] {
  const followed = new Set(followedClubIds);
  if (followed.size === 0) return [];
  return rows.filter(
    (r) => (r.homeClubId && followed.has(r.homeClubId)) || (r.awayClubId && followed.has(r.awayClubId))
  );
}

/** Applies the Matches status filter (Live / Finished / Upcoming) to single matches. */
export function matchPassesFilter(match: FotmobMatch, filter: "all" | "live" | "finished" | "upcoming"): boolean {
  if (filter === "live") return match.isLive;
  if (filter === "finished") return match.isFinished;
  if (filter === "upcoming") return match.isUpcoming;
  return true;
}
