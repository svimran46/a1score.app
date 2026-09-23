import "server-only";

/**
 * Match-detail fetchers: timeline events, lineups, statistics, and injuries.
 * Empty responses are `ok([])` — callers render distinct "not available yet"
 * states rather than errors (Section 8.4).
 */

import type { Lineup, MatchEvent, MatchStatistics } from "@/lib/schemas";
import { ok, type Result } from "@/types/result";
import { apiGet } from "./client";
import { mapEvents, mapLineup, mapMatchStatistics } from "./mappers";
import type { RawEvent, RawInjury, RawLineup, RawMatchStatistics } from "./raw";

/**
 * Timeline events for a fixture. Empty list is a valid state (no goals yet).
 */
export async function getMatchEvents(fixtureId: number): Promise<Result<MatchEvent[]>> {
  const res = await apiGet<RawEvent>("fixtures/events", { fixture: fixtureId }, "matchEvents", [`fixture:${fixtureId}`]);
  if (!res.ok) return res;
  const mapped = mapEvents(res.data.response);
  return mapped.ok ? ok(mapped.data) : mapped;
}

/**
 * Lineups for a fixture. API-Football returns an empty array pre-kickoff;
 * we surface `ok([])` so the UI shows "not published yet" (Section 8.4).
 */
export async function getMatchLineups(fixtureId: number): Promise<Result<Lineup[]>> {
  const res = await apiGet<RawLineup>("fixtures/lineups", { fixture: fixtureId }, "matchLineups", [`fixture:${fixtureId}`]);
  if (!res.ok) return res;
  if (res.data.response.length === 0) return ok([]);
  const home = mapLineup(res.data.response[0]);
  const away = mapLineup(res.data.response[1]);
  const lineups: Lineup[] = [];
  if (home.ok) lineups.push(home.data);
  if (away.ok) lineups.push(away.data);
  return ok(lineups);
}

/**
 * Team-vs-team statistics for a fixture (possession, shots, etc.).
 */
export async function getMatchStatistics(fixtureId: number): Promise<Result<MatchStatistics | null>> {
  const res = await apiGet<RawMatchStatistics>("fixtures/statistics", { fixture: fixtureId }, "matchStats", [`fixture:${fixtureId}`]);
  if (!res.ok) return res;
  if (res.data.response.length === 0) return ok(null);
  return mapMatchStatistics(res.data.response);
}

/**
 * Injury list for a fixture (or empty when none/unknown). Kept for the
 * match Overview tab's availability panel.
 */
export async function getFixtureInjuries(fixtureId: number): Promise<Result<RawInjury[]>> {
  const res = await apiGet<RawInjury>("injuries", { fixture: fixtureId }, "injuries", [`fixture:${fixtureId}`]);
  if (!res.ok) return res;
  return ok(res.data.response);
}
