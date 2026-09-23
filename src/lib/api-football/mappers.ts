/**
 * Mappers: API-Football v3's raw nested JSON → the flat shapes defined by
 * the Zod schemas in lib/schemas. Each mapper parses through Zod so a
 * malformed payload becomes a typed `validation` error, never a crash
 * (Sections 7, 11).
 */

import type { ZodType } from "zod";
import {
  FixtureSchema,
  LineupSchema,
  MatchStatisticsSchema,
  PlayerProfileSchema,
  TeamProfileSchema,
  StandingRowSchema,
  LeagueSummarySchema,
  MatchEventSchema,
  SquadPlayerSchema,
  TopPlayerEntrySchema,
  type Fixture,
  type LeagueSummary,
  type Lineup,
  type MatchEvent,
  type MatchStatistics,
  type PlayerProfile,
  type Standing,
  type StandingRow,
  type SquadPlayer,
  type TeamProfile,
  type TopPlayerEntry,
} from "@/lib/schemas";
import type { Result } from "@/types/result";
import { err, ok } from "@/types/result";
import { rewriteMediaUrl as media } from "./cdn";
import type {
  RawEvent,
  RawFixture,
  RawLeagueSeason,
  RawLineup,
  RawLineupPlayer,
  RawMatchStatistics,
  RawPlayer,
  RawPlayerStatistics,
  RawStandingResponse,
  RawStandingRow,
  RawStatValue,
  RawSquadPlayer,
  RawTeamProfile,
} from "./raw";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Map over raw API rows, collecting Zod issues instead of throwing. */
function parseAll<O>(schema: ZodType<O>, rows: unknown[]): Result<O[]> {
  const out: O[] = [];
  const issues: string[] = [];
  for (const [i, row] of rows.entries()) {
    const parsed = schema.safeParse(row);
    if (parsed.success) {
      out.push(parsed.data);
    } else {
      for (const issue of parsed.error.issues) {
        issues.push(`[${i}] ${issue.path.join(".")}: ${issue.message}`);
      }
    }
  }
  if (out.length === 0 && rows.length > 0 && issues.length > 0) {
    return err({ kind: "validation", issues: issues.slice(0, 8) });
  }
  return ok(out);
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

function mapFixture(raw: RawFixture): unknown {
  return {
    id: raw.fixture?.id,
    referee: text(raw.fixture?.referee),
    date: typeof raw.fixture?.date === "string" ? raw.fixture.date : new Date(0).toISOString(),
    timestamp: num(raw.fixture?.timestamp) ?? 0,
    venueName: text(raw.fixture?.venue?.name),
    venueCity: text(raw.fixture?.venue?.city),
    statusShort: text(raw.fixture?.status?.short) ?? "NS",
    statusLong: text(raw.fixture?.status?.long) ?? "Not Started",
    elapsed: num(raw.fixture?.status?.elapsed),
    leagueId: num(raw.league?.id) ?? 0,
    leagueName: text(raw.league?.name) ?? "Unknown league",
    leagueCountry: text(raw.league?.country),
    leagueLogoUrl: media(text(raw.league?.logo)),
    season: num(raw.league?.season) ?? 0,
    round: text(raw.league?.round),
    homeTeamId: num(raw.teams?.home?.id) ?? 0,
    homeTeamName: text(raw.teams?.home?.name) ?? "Home",
    homeTeamLogoUrl: media(text(raw.teams?.home?.logo)),
    awayTeamId: num(raw.teams?.away?.id) ?? 0,
    awayTeamName: text(raw.teams?.away?.name) ?? "Away",
    awayTeamLogoUrl: media(text(raw.teams?.away?.logo)),
    goalsHome: num(raw.goals?.home),
    goalsAway: num(raw.goals?.away),
    winnerHome: raw.teams?.home?.winner === true ? true : raw.teams?.home?.winner === false ? false : null,
    winnerAway: raw.teams?.away?.winner === true ? true : raw.teams?.away?.winner === false ? false : null,
  };
}

/** Map a list of raw fixtures into validated `Fixture` objects. */
export function mapFixtures(rows: RawFixture[]): Result<Fixture[]> {
  return parseAll<Fixture>(FixtureSchema, rows.map(mapFixture));
}

/* ------------------------------------------------------------------ */
/* Standings                                                           */
/* ------------------------------------------------------------------ */

function mapStandingRow(raw: RawStandingRow): unknown {
  return {
    rank: num(raw.rank) ?? 0,
    teamId: num(raw.team?.id) ?? 0,
    teamName: text(raw.team?.name) ?? "Unknown",
    teamLogoUrl: media(text(raw.team?.logo)),
    points: num(raw.points) ?? 0,
    goalsDiff: num(raw.goalsDiff) ?? 0,
    played: num(raw.all?.played) ?? 0,
    win: num(raw.all?.win) ?? 0,
    draw: num(raw.all?.draw) ?? 0,
    lose: num(raw.all?.lose) ?? 0,
    goalsFor: num(raw.all?.goals?.["for"]) ?? 0,
    goalsAgainst: num(raw.all?.goals?.against) ?? 0,
    form: text(raw.form),
    description: text(raw.description),
  };
}

/**
 * Map the /standings response. API-Football returns one entry per league
 * with a `standings` matrix (one inner array per group/conference); we
 * flatten all groups. Returns a validation error when empty.
 */
export function mapStanding(entries: RawStandingResponse[]): Result<Standing> {
  const first = entries[0];
  if (!first) {
    return err({ kind: "validation", issues: ["No standings table available."] });
  }
  const rowsRaw = first.league?.standings?.flat() ?? [];
  const rows = parseAll<StandingRow>(StandingRowSchema, rowsRaw.map(mapStandingRow));
  if (!rows.ok) return rows;
  return ok({
    leagueId: first.league?.id ?? 0,
    season: first.league?.season ?? 0,
    rows: rows.data,
  });
}

/* ------------------------------------------------------------------ */
/* Match detail                                                        */
/* ------------------------------------------------------------------ */

function mapEvent(raw: RawEvent): unknown {
  return {
    elapsed: num(raw.time?.elapsed) ?? 0,
    elapsedExtra: num(raw.time?.extra),
    teamId: num(raw.team?.id) ?? 0,
    playerName: text(raw.player?.name),
    assistName: text(raw.assist?.name),
    type: text(raw.type) ?? "Unknown",
    detail: text(raw.detail),
  };
}

/** Map raw match timeline events. */
export function mapEvents(rows: RawEvent[]): Result<MatchEvent[]> {
  return parseAll(MatchEventSchema, rows.map(mapEvent));
}

function mapLineupPlayer(p: RawLineupPlayer | null | undefined): unknown {
  return {
    playerId: num(p?.id) ?? 0,
    name: text(p?.name) ?? "Unknown",
    number: num(p?.number),
    position: text(p?.pos),
  };
}

/** Map a single team's lineup; `undefined` rows mean "not published yet". */
export function mapLineup(raw: RawLineup | undefined): Result<Lineup> {
  if (!raw) {
    return err({ kind: "validation", issues: ["Lineup not published yet."] });
  }
  const startXI = (raw.startXI ?? []).map((entry) => mapLineupPlayer(entry?.player));
  const subs = (raw.substitutes ?? []).map((entry) => mapLineupPlayer(entry?.player));
  const parsed = LineupSchema.safeParse({
    teamId: num(raw.team?.id) ?? 0,
    coachName: text(raw.coach?.name),
    formation: text(raw.formation),
    startXI,
    substitutes: subs,
  });
  if (!parsed.success) {
    return err({
      kind: "validation",
      issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`),
    });
  }
  return ok(parsed.data);
}

function statNumber(value: RawStatValue): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim().replace("%", "");
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function prettyStatLabel(type: string): string {
  return type
    .replace(/Total/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map /fixtures/statistics into a side-by-side stat list. */
export function mapMatchStatistics(rows: RawMatchStatistics[]): Result<MatchStatistics> {
  const home = rows[0];
  const away = rows[1];
  if (!home) {
    return err({ kind: "validation", issues: ["Statistics not available yet."] });
  }

  const awayByType = new Map<string, RawStatValue>();
  for (const stat of away?.statistics ?? []) {
    if (stat?.type) awayByType.set(stat.type, stat.value);
  }

  const statsRaw = (home.statistics ?? []).map((stat) => ({
    label: prettyStatLabel(stat.type ?? ""),
    home: statNumber(stat.value),
    away: statNumber(stat.type ? (awayByType.get(stat.type) ?? null) : null),
  }));

  const parsed = MatchStatisticsSchema.safeParse({
    homeTeamId: num(home.team?.id),
    awayTeamId: num(away?.team?.id),
    stats: statsRaw,
  });
  if (!parsed.success) {
    return err({
      kind: "validation",
      issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`),
    });
  }
  return ok(parsed.data);
}

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */

/** Map /teams?id= rows into a team profile. */
export function mapTeamProfile(rows: RawTeamProfile[]): Result<TeamProfile> {
  const first = rows[0];
  if (!first) return err({ kind: "validation", issues: ["Team not found."] });
  const parsed = TeamProfileSchema.safeParse({
    id: num(first.team?.id) ?? 0,
    name: text(first.team?.name) ?? "Unknown",
    logoUrl: media(text(first.team?.logo)),
    country: text(first.team?.country),
    founded: num(first.team?.founded),
    venueName: text(first.venue?.name),
  });
  if (!parsed.success) {
    return err({
      kind: "validation",
      issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`),
    });
  }
  return ok(parsed.data);
}

/** Map /players/squads player entries into validated squad players. */
export function mapSquad(players: (RawSquadPlayer | null | undefined)[] | null | undefined): Result<SquadPlayer[]> {
  const rows = players ?? [];
  return parseAll<SquadPlayer>(
    SquadPlayerSchema,
    rows.map((p) => ({
      playerId: num(p?.id) ?? 0,
      name: text(p?.name) ?? "Unknown",
      age: num(p?.age),
      number: num(p?.number),
      position: text(p?.position),
      photoUrl: media(text(p?.photo)),
    })),
  );
}

/* ------------------------------------------------------------------ */
/* Players                                                             */
/* ------------------------------------------------------------------ */

function ratingNumber(value: string | number | null): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickBestStatistics(stats: RawPlayerStatistics[] | null | undefined): RawPlayerStatistics | null {
  if (!stats || stats.length === 0) return null;
  // Prefer the entry with the most appearances as "the" season summary.
  return [...stats].sort(
    (a, b) => (b.games?.appearences ?? 0) - (a.games?.appearences ?? 0),
  )[0] ?? null;
}

/** Map /players?id=&season= into a flat player profile. */
export function mapPlayerProfile(rows: RawPlayer[]): Result<PlayerProfile> {
  const first = rows[0];
  if (!first) return err({ kind: "validation", issues: ["Player not found."] });
  const best = pickBestStatistics(first.statistics);
  const parsed = PlayerProfileSchema.safeParse({
    id: num(first.player?.id) ?? 0,
    name: text(first.player?.name) ?? "Unknown",
    photoUrl: media(text(first.player?.photo)),
    age: num(first.player?.age),
    nationality: text(first.player?.nationality),
    position: text(best?.games?.position),
    currentTeamId: num(best?.team?.id),
    seasonGoals: num(best?.goals?.total),
    seasonAssists: num(best?.goals?.assists),
    seasonAppearances: num(best?.games?.appearences),
    seasonRating: ratingNumber(best?.games?.rating ?? null),
  });
  if (!parsed.success) {
    return err({
      kind: "validation",
      issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`),
    });
  }
  return ok(parsed.data);
}

/* ------------------------------------------------------------------ */
/* Leagues                                                             */
/* ------------------------------------------------------------------ */

function mapLeagueSeason(raw: RawLeagueSeason): unknown {
  const currentSeason = raw.seasons?.find((s) => s.current === true) ?? raw.seasons?.[0];
  return {
    id: num(raw.league?.id) ?? 0,
    name: text(raw.league?.name) ?? "Unknown league",
    type: text(raw.league?.type) ?? "League",
    logoUrl: media(text(raw.league?.logo)),
    countryName: text(raw.country?.name),
    countryCode: text(raw.country?.code),
    countryFlagUrl: media(text(raw.country?.flag)),
    season: num(currentSeason?.year),
  };
}

/** Map /leagues rows into league summaries. */
export function mapLeagues(rows: RawLeagueSeason[]): Result<LeagueSummary[]> {
  return parseAll<LeagueSummary>(LeagueSummarySchema, rows.map(mapLeagueSeason));
}

/* ------------------------------------------------------------------ */
/* Top scorers / assists                                               */
/* ------------------------------------------------------------------ */

function mapTopEntry(raw: RawPlayer): unknown {
  const best = pickBestStatistics(raw.statistics);
  return {
    playerId: num(raw.player?.id) ?? 0,
    playerName: text(raw.player?.name) ?? "Unknown",
    photoUrl: media(text(raw.player?.photo)),
    teamId: num(best?.team?.id) ?? 0,
    teamName: text(best?.team?.name) ?? "Unknown",
    teamLogoUrl: media(text(best?.team?.logo)),
    value: num(best?.goals?.total) ?? 0,
    appearances: num(best?.games?.appearences),
    rating: ratingNumber(best?.games?.rating ?? null),
  };
}

/**
 * Map top scorers/top assists. For assists lists the API's `goals.total`
 * still holds goal counts, so callers pass `metric` to re-extract the
 * right number from the raw statistics.
 */
export function mapTopPlayers(rows: RawPlayer[], metric: "goals" | "assists"): Result<TopPlayerEntry[]> {
  const rawMapped = rows.map((raw) => {
    const base = mapTopEntry(raw) as Record<string, unknown>;
    if (metric === "assists") {
      const best = pickBestStatistics(raw.statistics);
      base.value = num(best?.goals?.assists) ?? 0;
    }
    return base;
  });
  const mapped = parseAll<TopPlayerEntry>(TopPlayerEntrySchema, rawMapped);
  if (!mapped.ok) return mapped;
  return ok([...mapped.data].sort((a, b) => b.value - a.value));
}
