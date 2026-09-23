/**
 * Minimal typed views of API-Football v3's raw nested JSON, matched to the
 * real response shapes (v3 nests fixture/team data — e.g. `fixture.id`,
 * `teams.home.id` — rather than flattening). Fields are intentionally loose
 * because the API occasionally omits them; the Zod schemas are the strict
 * contract applied afterwards by the mappers.
 */

export interface RawResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: unknown;
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

export interface RawTeam {
  id: number;
  name: string;
  logo: string | null;
  winner?: boolean | null;
}

export interface RawCountry {
  name: string | null;
  code: string | null;
  flag: string | null;
}

/** One element of `GET /fixtures` — everything sits under `fixture`. */
export interface RawFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string | null;
    date: string;
    timestamp: number | null;
    venue: { id: number | null; name: string | null; city: string | null } | null;
    status: { long: string | null; short: string | null; elapsed: number | null; extra: number | null } | null;
  };
  league: {
    id: number;
    name: string;
    country: string | null;
    logo: string | null;
    flag: string | null;
    season: number | null;
    round: string | null;
  };
  teams: {
    home: RawTeam | null;
    away: RawTeam | null;
  };
  goals: { home: number | null; away: number | null } | null;
  score: {
    halftime: { home: number | null; away: number | null } | null;
    fulltime: { home: number | null; away: number | null } | null;
    extratime?: { home: number | null; away: number | null } | null;
    penalty?: { home: number | null; away: number | null } | null;
  } | null;
}

/** `GET /standings` row — standings live under `league.standings[0]`. */
export interface RawStandingResponse {
  league: {
    id: number;
    name: string;
    country: string | null;
    logo: string | null;
    flag: string | null;
    season: number;
    standings: RawStandingRow[][] | null;
  };
}

export interface RawStandingRow {
  rank: number;
  team: { id: number; name: string; logo: string | null } | null;
  points: number | null;
  goalsDiff: number | null;
  group: string | null;
  form: string | null;
  status: string | null;
  description: string | null;
  all: {
    played: number | null;
    win: number | null;
    draw: number | null;
    lose: number | null;
    goals: { for: number | null; against: number | null } | null;
  } | null;
  home?: Record<string, number | null> | null;
  away?: Record<string, number | null> | null;
  update: string | null;
}

/** `GET /fixtures/events` row. */
export interface RawEvent {
  time: { elapsed: number | null; extra: number | null } | null;
  team: { id: number | null; name: string | null; logo: string | null } | null;
  player: { id: number | null; name: string | null } | null;
  assist: { id: number | null; name: string | null } | null;
  type: string | null;
  detail: string | null;
  comments: string[] | null;
}

/** `GET /fixtures/lineups` row. */
export interface RawLineupPlayer {
  id: number;
  name: string;
  number: number | null;
  pos: string | null;
  grid: string | null;
}

export interface RawLineup {
  team: { id: number; name: string; logo: string | null; colors?: unknown } | null;
  coach: { id: number | null; name: string | null; photo: string | null } | null;
  formation: string | null;
  startXI: { player: RawLineupPlayer | null }[] | null;
  substitutes: { player: RawLineupPlayer | null }[] | null;
}

/** `GET /teams?id=` row. */
export interface RawTeamProfile {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string | null;
    founded: number | null;
    national: boolean | null;
    logo: string | null;
  } | null;
  venue: {
    id: number | null;
    name: string | null;
    address: string | null;
    city: string | null;
    capacity: number | null;
    surface: string | null;
    image: string | null;
  } | null;
}

/** One player entry inside `GET /players/squads`. */
export interface RawSquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
}

/** `GET /players/squads` row. */
export interface RawSquad {
  team: { id: number; name: string; logo: string | null } | null;
  players: RawSquadPlayer[] | null;
}

/** Shared per-season statistics block used by /players and topscorers. */
export interface RawPlayerStatistics {
  team: { id: number; name: string; logo: string | null } | null;
  league: { id: number; name: string; season: number; logo: string | null } | null;
  games: {
    appearences: number | null;
    position: string | null;
    rating: string | number | null;
  } | null;
  goals: { total: number | null; assists: number | null } | null;
}

/** `GET /players` and top-scorers row. */
export interface RawPlayer {
  player: {
    id: number;
    name: string;
    firstname: string | null;
    lastname: string | null;
    age: number | null;
    birth: { date: string | null } | null;
    nationality: string | null;
    height: string | null;
    weight: string | null;
    photo: string | null;
    injured: boolean | null;
  } | null;
  statistics: RawPlayerStatistics[] | null;
}

/** `GET /coachs` row (note: flat, unlike teams). */
export interface RawCoach {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  birth: { date: string | null } | null;
  nationality: string | null;
  height: string | null;
  weight: string | null;
  photo: string | null;
  team: { id: number; name: string } | null;
  career: { team: { id: number; name: string; logo: string | null } | null; start: string | null; end: string | null }[] | null;
}

/** `GET /leagues` row. */
export interface RawLeagueSeason {
  league: { id: number; name: string; type: string; logo: string | null } | null;
  country: RawCountry | null;
  seasons: { year: number; start: string | null; end: string | null; current: boolean | null; coverage?: unknown }[] | null;
}

/** `GET /injuries` row. */
export interface RawInjury {
  player: { id: number | null; name: string | null; photo: string | null; type: string | null; reason: string | null } | null;
  fixture: { id: number | null } | null;
  team: { id: number; name: string; logo: string | null } | null;
  league: { id: number; name: string; season: number; logo: string | null } | null;
}

/** `GET /fixtures/statistics` row. */
export interface RawMatchStatistics {
  team: { id: number; name: string; logo: string | null } | null;
  statistics: { type: string | null; value: RawStatValue }[] | null;
}

/** Percentages arrive as "55%" or null; counts arrive as numbers. */
export type RawStatValue = string | number | null;

/** `GET /fixtures/players` row (per-player match stats). */
export interface RawFixturePlayers {
  team: { id: number; name: string; logo: string | null } | null;
  players: {
    player: { id: number; name: string; photo: string | null } | null;
    statistics: RawPlayerStatistics[] | null;
  }[] | null;
}
