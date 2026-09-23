import "server-only";

/**
 * Fixture fetchers. Every function returns `Promise<Result<T>>` and reads
 * through the shared Next.js Data Cache — one upstream call per deployment
 * per cache window, no matter how many visitors ask (Section 2).
 */

import type { Fixture } from "@/lib/schemas";
import { ok, type Result } from "@/types/result";
import { apiGet } from "./client";
import { mapFixtures } from "./mappers";
import type { RawFixture } from "./raw";

/** Status shorts that mean the match is in play right now. */
const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"]);
/** Status shorts meaning the match is finished (Section 2: cache ~forever). */
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

/** True when the fixture is in play. */
export function isLive(fixture: Fixture): boolean {
  return LIVE_STATUSES.has(fixture.statusShort);
}

/** True when the fixture has ended. */
export function isFinished(fixture: Fixture): boolean {
  return FINISHED_STATUSES.has(fixture.statusShort);
}

/** Group fixtures by league, preserving API order within each group. */
export function groupByLeague<T extends { leagueId: number; leagueName: string; leagueCountry: string | null; leagueLogoUrl: string | null }>(
  fixtures: T[],
): { leagueId: number; leagueName: string; leagueCountry: string | null; leagueLogoUrl: string | null; fixtures: T[] }[] {
  const map = new Map<number, { leagueId: number; leagueName: string; leagueCountry: string | null; leagueLogoUrl: string | null; fixtures: T[] }>();
  for (const f of fixtures) {
    const group = map.get(f.leagueId);
    if (group) {
      group.fixtures.push(f);
    } else {
      map.set(f.leagueId, {
        leagueId: f.leagueId,
        leagueName: f.leagueName,
        leagueCountry: f.leagueCountry,
        leagueLogoUrl: f.leagueLogoUrl,
        fixtures: [f],
      });
    }
  }
  return [...map.values()];
}

/**
 * All in-play fixtures across every league.
 * Cached for 25s and shared by every visitor (Section 2).
 */
export async function getLiveFixtures(): Promise<Result<Fixture[]>> {
  const res = await apiGet<RawFixture>("fixtures", { live: "all" }, "liveFixtures");
  if (!res.ok) return res;
  return mapFixtures(res.data.response);
}

/**
 * Fixtures for one date (YYYY-MM-DD). Today uses a 5-minute window;
 * past/future dates are effectively static so we cache them for days.
 */
export async function getFixturesByDate(date: string): Promise<Result<Fixture[]>> {
  const today = new Date().toISOString().slice(0, 10);
  const window: Parameters<typeof apiGet>[2] = date === today ? "dateFixtures" : "finishedFixtures";
  const res = await apiGet<RawFixture>("fixtures", { date }, window);
  if (!res.ok) return res;
  return mapFixtures(res.data.response);
}

/**
 * A single fixture by id. Uses the finished window when the stored status
 * allows it; the Route Handler decides freshness for in-play matches.
 */
export async function getFixtureById(id: number): Promise<Result<Fixture | null>> {
  const res = await apiGet<RawFixture>("fixtures", { id }, "matchDetail", [`fixture:${id}`]);
  if (!res.ok) return res;
  const mapped = mapFixtures(res.data.response);
  if (!mapped.ok) return mapped;
  return ok(mapped.data[0] ?? null);
}

/**
 * League fixtures: `next` upcoming or `last` played games. `last` responses
 * are immutable, so they are cached with the finished window.
 */
export async function getLeagueFixtures(
  leagueId: number,
  season: number,
  scope: "next" | "last",
  count = 20,
): Promise<Result<Fixture[]>> {
  const window: Parameters<typeof apiGet>[2] = scope === "last" ? "finishedFixtures" : "dateFixtures";
  const res = await apiGet<RawFixture>(
    "fixtures",
    { league: leagueId, season, [scope]: count },
    window,
    [`league:${leagueId}`],
  );
  if (!res.ok) return res;
  return mapFixtures(res.data.response);
}

/**
 * Team fixtures: `next` upcoming or `last` played games, across leagues.
 */
export async function getTeamFixtures(
  teamId: number,
  season: number,
  scope: "next" | "last",
  count = 15,
): Promise<Result<Fixture[]>> {
  const window: Parameters<typeof apiGet>[2] = scope === "last" ? "finishedFixtures" : "dateFixtures";
  const res = await apiGet<RawFixture>(
    "fixtures",
    { team: teamId, season, [scope]: count },
    window,
    [`team:${teamId}`],
  );
  if (!res.ok) return res;
  return mapFixtures(res.data.response);
}

/**
 * Head-to-head history between two teams. Finished matches dominate, so a
 * long cache window is safe.
 */
export async function getHeadToHead(teamA: number, teamB: number, last = 10): Promise<Result<Fixture[]>> {
  const res = await apiGet<RawFixture>(
    "fixtures/headtohead",
    { h2h: `${teamA}-${teamB}`, last },
    "finishedFixtures",
    [`h2h:${teamA}-${teamB}`],
  );
  if (!res.ok) return res;
  return mapFixtures(res.data.response);
}

/**
 * Recent finished fixtures for one team (used to build "form" strips).
 */
export async function getTeamRecentResults(teamId: number, season: number, last = 5): Promise<Result<Fixture[]>> {
  const res = await apiGet<RawFixture>(
    "fixtures",
    { team: teamId, season, last },
    "finishedFixtures",
    [`team:${teamId}`],
  );
  if (!res.ok) return res;
  return mapFixtures(res.data.response);
}
