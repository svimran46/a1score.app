import "server-only";

/**
 * Player fetchers: player profiles, top scorers / top assists.
 */

import type { PlayerProfile, TopPlayerEntry } from "@/lib/schemas";
import { ok, type Result } from "@/types/result";
import { apiGet } from "./client";
import { mapPlayerProfile, mapTopPlayers } from "./mappers";
import type { RawPlayer } from "./raw";
import { planSafeSeason } from "./season";

/**
 * A player profile with season statistics.
 */
export async function getPlayerProfile(playerId: number, season: number): Promise<Result<PlayerProfile | null>> {
  const res = await apiGet<RawPlayer>("players", { id: playerId, season: planSafeSeason(season) }, "playerProfile", [`player:${playerId}`]);
  if (!res.ok) return res;
  if (res.data.response.length === 0) return ok(null);
  const mapped = mapPlayerProfile(res.data.response);
  if (!mapped.ok) return mapped;
  return ok(mapped.data);
}

/**
 * Top scorers for a league+season.
 */
export async function getTopScorers(leagueId: number, season: number): Promise<Result<TopPlayerEntry[]>> {
  const res = await apiGet<RawPlayer>("players/topscorers", { league: leagueId, season: planSafeSeason(season) }, "topScorers", [`league:${leagueId}`]);
  if (!res.ok) return res;
  return mapTopPlayers(res.data.response, "goals");
}

/**
 * Top assists for a league+season.
 */
export async function getTopAssists(leagueId: number, season: number): Promise<Result<TopPlayerEntry[]>> {
  const res = await apiGet<RawPlayer>("players/topassists", { league: leagueId, season: planSafeSeason(season) }, "topScorers", [`league:${leagueId}`]);
  if (!res.ok) return res;
  return mapTopPlayers(res.data.response, "assists");
}
