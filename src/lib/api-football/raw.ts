/**
 * Minimal typed views of API-Football v3's raw nested JSON. These are
 * intentionally loose (fields unknown-able via helpers) because the API
 * occasionally omits fields; the Zod schemas are the strict contract.
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
}

export interface RawLeague {
  id: number;
  name: string;
  type: string;
  logo: string | null;
}

export interface RawCountry {
  name: string | null;
  code: string | null;
  flag: string | null;
}

export interface RawScore {
  halftime: { home: number | null; away: number | null };
  fulltime: { home: number | null; away: number | null };
}

export interface RawStatus {
  long: string | null;
  short: string | null;
  elapsed: number | null;
}

export interface RawFixture {
  id: number;
  referee: string | null;
  date: string;
  timestamp: number | null;
  venue: { name: string | null; city: string | null } | null;
  status: RawStatus | null;
  league: RawLeague & { country: string | null; season: number | null; round: string | null };
  teams: {
    home: RawTeam & { winner: boolean | null };
    away: RawTeam & { winner: boolean | null };
  };
  goals: { home: number | null; away: number | null } | null;
  score: RawScore | null;
}

export interface RawStandingTeam {
  id: number;
  name: string;
  logo: string | null;
}

export interface RawStandingRow {
  rank: number;
  team: RawStandingTeam;
  points: number;
  goalsDiff: number;
  group: string | null;
  form: string | null;
  description: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { "for": number; against: number } };
}

export interface RawStandingEntry {
  league: { id: number; season: number };
  league_standings?: unknown;
}

export interface RawStandingResponse {
  league: { id: number; name: string; country: string | null; season: number };
  standings: RawStandingRow[][] | null;
}

export interface RawEventTeam {
  id: number | null;
  name: string | null;
  logo: string | null;
}

export interface RawEvent {
  time: { elapsed: number | null; extra: number | null };
  team: RawEventTeam;
  player: { id: number | null; name: string | null } | null;
  assist: { id: number | null; name: string | null } | null;
  type: string | null;
  detail: string | null;
}

export interface RawLineupPlayer {
  id: number;
  name: string;
  number: number | null;
  pos: string | null;
}

export interface RawLineup {
  team: { id: number; name: string; logo: string | null };
  coach: { id: number | null; name: string | null } | null;
  formation: string | null;
  startXI: { player: RawLineupPlayer }[] | null;
  substitutes: { player: RawLineupPlayer }[] | null;
}

export interface RawTeamProfile {
  id: number;
  name: string;
  code: string | null;
  country: string | null;
  founded: number | null;
  national: boolean | null;
  logo: string | null;
  venue?: {
    id: number | null;
    name: string | null;
    address: string | null;
    city: string | null;
  } | null;
}

export interface RawSquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
}

export interface RawPlayerIdentity {
  id: number;
  name: string;
  age: number | null;
  nationality: string | null;
  photo: string | null;
}

export interface RawPlayerStatistics {
  team: { id: number; name: string; logo: string | null };
  league: { id: number; name: string; season: number };
  games: { appearences: number | null; position: string | null; rating: string | number | null };
  goals: { total: number | null; assists: number | null };
}

export interface RawPlayer {
  player: RawPlayerIdentity;
  statistics: RawPlayerStatistics[] | null;
}

export interface RawLeagueSeason {
  id: number;
  name: string;
  type: string;
  logo: string | null;
  country: RawCountry;
  seasons: { year: number; current: boolean | null }[] | null;
}

/** Percentages arrive as "55%" or null; counts arrive as numbers. */
export type RawStatValue = string | number | null;

export interface RawTeamStatistics {
  league: { id: number; name: string; country: string | null; season: number };
  team: { id: number; name: string; logo: string | null };
  form: string | null;
  fixtures: {
    played: { home: number | null; away: number | null; total: number | null };
    wins: { home: number | null; away: number | null; total: number | null };
    draws: { home: number | null; away: number | null; total: number | null };
    loses: { home: number | null; away: number | null; total: number | null };
  };
  goals: {
    "for": { total: { home: number | null; away: number | null; total: number | null } | null };
    against: { total: { home: number | null; away: number | null; total: number | null } | null };
  };
}

export interface RawMatchStatistics {
  team: { id: number; name: string; logo: string | null };
  statistics: { type: string; value: RawStatValue }[] | null;
}

export interface RawCoach {
  id: number;
  name: string;
  age: number | null;
  nationality: string | null;
  team: { id: number; name: string } | null;
}

export interface RawInjury {
  player: { id: number | null; name: string | null; photo: string | null };
  team: { id: number; name: string; logo: string | null };
  fixture: string | null;
  type: string | null;
  reason: string | null;
}
