import "server-only";

/**
 * League + standings fetchers.
 */

import type { LeagueSummary, Standing } from "@/lib/schemas";
import { ok, type Result } from "@/types/result";
import { apiGet } from "./client";
import { mapLeagues, mapStanding } from "./mappers";
import type { RawLeagueSeason, RawStandingResponse } from "./raw";

/** League ids treated as "Popular" across the app (Section 8.2). */
export const POPULAR_LEAGUE_IDS = [39, 140, 135, 78, 2, 3] as const;

/**
 * All leagues with a current season (7-day cache).
 */
export async function getLeagues(): Promise<Result<LeagueSummary[]>> {
  const res = await apiGet<RawLeagueSeason>("leagues", { current: "true" }, "leagues");
  if (!res.ok) return res;
  return mapLeagues(res.data.response);
}

/**
 * Leagues for one country (search field feeding the Leagues page).
 */
export async function getLeaguesByCountry(country: string): Promise<Result<LeagueSummary[]>> {
  const res = await apiGet<RawLeagueSeason>("leagues", { country }, "leagues");
  if (!res.ok) return res;
  return mapLeagues(res.data.response);
}

/**
 * A single league by id (profile + current season).
 */
export async function getLeagueById(id: number): Promise<Result<LeagueSummary | null>> {
  const res = await apiGet<RawLeagueSeason>("leagues", { id, current: "true" }, "leagues");
  if (!res.ok) return res;
  const mapped = mapLeagues(res.data.response);
  if (!mapped.ok) return mapped;
  return ok(mapped.data[0] ?? null);
}

/**
 * League search by name fragment (used by /search).
 */
export async function searchLeagues(term: string): Promise<Result<LeagueSummary[]>> {
  const res = await apiGet<RawLeagueSeason>("leagues", { search: term }, "leagues");
  if (!res.ok) return res;
  return mapLeagues(res.data.response);
}

/**
 * Standings for a league+season. The window is chosen dynamically:
 * 15 min inside a gameweek window (Fri–Thu), else 6 h (Section 2).
 */
export async function getStandings(leagueId: number, season: number): Promise<Result<Standing>> {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun .. 6=Sat
  const isGameweekWindow = day >= 5 || day <= 1; // Fri..Mon window
  const res = await apiGet<RawStandingResponse>(
    "standings",
    { league: leagueId, season },
    isGameweekWindow ? "standingsGameweek" : "standingsIdle",
    [`league:${leagueId}`],
  );
  if (!res.ok) return res;
  return mapStanding(res.data.response);
}
