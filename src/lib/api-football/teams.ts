import "server-only";

/**
 * Team fetchers: profiles, squads, team season statistics, coaches.
 */

import type { SquadPlayer, TeamProfile } from "@/lib/schemas";
import { ok, type Result } from "@/types/result";
import { apiGet } from "./client";
import { mapSquad, mapTeamProfile } from "./mappers";
import type { RawCoach, RawInjury, RawSquadPlayer, RawTeamProfile } from "./raw";

/**
 * Fetch a team profile by id.
 */
export async function getTeamProfile(teamId: number): Promise<Result<TeamProfile | null>> {
  const res = await apiGet<RawTeamProfile>("teams", { id: teamId }, "teamProfile", [`team:${teamId}`]);
  if (!res.ok) return res;
  const mapped = mapTeamProfile(res.data.response);
  if (!mapped.ok) return mapped;
  return ok(mapped.data);
}

/**
 * Team search by name fragment (used by /search). Uses the API's native
 * `/teams?search=` parameter.
 */
export async function searchTeams(term: string): Promise<Result<TeamProfile[]>> {
  const res = await apiGet<RawTeamProfile>("teams", { search: term }, "teamProfile");
  if (!res.ok) return res;
  const out: TeamProfile[] = [];
  const issues: string[] = [];
  for (const raw of res.data.response) {
    const parsed = mapTeamProfile([raw]);
    if (parsed.ok) {
      out.push(parsed.data);
    } else if (parsed.error.kind === "validation") {
      issues.push(...parsed.error.issues);
    }
  }
  if (out.length === 0 && issues.length > 0) {
    return { ok: false, error: { kind: "validation", issues: issues.slice(0, 5) } };
  }
  return ok(out);
}

/**
 * Teams belonging to a league+season (used by league "Teams" lists).
 */
export async function getTeamsByLeague(leagueId: number, season: number): Promise<Result<TeamProfile[]>> {
  const res = await apiGet<RawTeamProfile>("teams", { league: leagueId, season }, "teamProfile", [`league:${leagueId}`]);
  if (!res.ok) return res;
  const out: TeamProfile[] = [];
  const issues: string[] = [];
  for (const raw of res.data.response) {
    const parsed = mapTeamProfile([raw]);
    if (parsed.ok) {
      out.push(parsed.data);
    } else if (parsed.error.kind === "validation") {
      issues.push(...parsed.error.issues);
    }
  }
  if (out.length === 0 && issues.length > 0) {
    return { ok: false, error: { kind: "validation", issues: issues.slice(0, 5) } };
  }
  return ok(out);
}

/**
 * Full squad for a team (players/squads endpoint).
 */
export async function getTeamSquad(teamId: number): Promise<Result<SquadPlayer[]>> {
  const res = await apiGet<{ team: { id: number; name: string }; players: RawSquadPlayer[] }>(
    "players/squads",
    { team: teamId },
    "teamProfile",
    [`team:${teamId}`],
 );
  if (!res.ok) return res;
  const players = res.data.response[0]?.players ?? [];
  return mapSquad(players);
}

/**
 * Coach of a team (endpoint is spelled `coachs` in the API — Section 6).
 */
export async function getTeamCoach(teamId: number): Promise<Result<{ id: number; name: string; age: number | null; nationality: string | null } | null>> {
  const res = await apiGet<RawCoach>("coachs", { team: teamId }, "coach", [`team:${teamId}`]);
  if (!res.ok) return res;
  const first = res.data.response[0];
  if (!first) return ok(null);
  return ok({
    id: first.id,
    name: first.name,
    age: first.age ?? null,
    nationality: first.nationality ?? null,
  });
}

/**
 * Injuries for a team (Team page availability note).
 */
export async function getTeamInjuries(teamId: number, season: number): Promise<Result<RawInjury[]>> {
  const res = await apiGet<RawInjury>("injuries", { team: teamId, season }, "injuries", [`team:${teamId}`]);
  if (!res.ok) return res;
  return ok(res.data.response);
}
