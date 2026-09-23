import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

/** URL-safe nullable string for logos/photos served by the API CDN. */
const nullableUrl = z
  .string()
  .url()
  .nullable()
  .catch(null)
  .transform((v) => (v === "" ? null : v));

/** Free-text fields the API occasionally omits or sends as empty strings. */
const nullableText = z
  .string()
  .nullable()
  .catch(null)
  .transform((v) => (v !== null && v.trim() === "" ? null : v));

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

export const FixtureSchema = z.object({
  id: z.number(),
  referee: nullableText,
  date: z.string(),
  timestamp: z.number(),
  venueName: nullableText,
  venueCity: nullableText,
  statusShort: z.string(),
  statusLong: z.string(),
  elapsed: z.number().int().nullable().catch(null),
  leagueId: z.number(),
  leagueName: z.string(),
  leagueCountry: nullableText,
  leagueLogoUrl: nullableUrl,
  season: z.number(),
  round: nullableText,
  homeTeamId: z.number(),
  homeTeamName: z.string(),
  homeTeamLogoUrl: nullableUrl,
  awayTeamId: z.number(),
  awayTeamName: z.string(),
  awayTeamLogoUrl: nullableUrl,
  goalsHome: z.number().int().nullable().catch(null),
  goalsAway: z.number().int().nullable().catch(null),
  winnerHome: z.boolean().nullable().catch(null),
  winnerAway: z.boolean().nullable().catch(null),
});
export type Fixture = z.infer<typeof FixtureSchema>;

/* ------------------------------------------------------------------ */
/* Standings                                                           */
/* ------------------------------------------------------------------ */

export const StandingRowSchema = z.object({
  rank: z.number(),
  teamId: z.number(),
  teamName: z.string(),
  teamLogoUrl: nullableUrl,
  points: z.number(),
  goalsDiff: z.number(),
  played: z.number(),
  win: z.number(),
  draw: z.number(),
  lose: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  form: nullableText,
  /** e.g. "Promotion - Champions League" — drives row coloring, not rank math. */
  description: nullableText,
});
export type StandingRow = z.infer<typeof StandingRowSchema>;

export const StandingSchema = z.object({
  leagueId: z.number(),
  season: z.number(),
  rows: z.array(StandingRowSchema),
});
export type Standing = z.infer<typeof StandingSchema>;

/* ------------------------------------------------------------------ */
/* Match detail                                                        */
/* ------------------------------------------------------------------ */

export const MatchEventSchema = z.object({
  elapsed: z.number(),
  elapsedExtra: z.number().nullable().catch(null),
  teamId: z.number(),
  playerName: nullableText,
  assistName: nullableText,
  /** "Goal" | "Card" | "Subst" | "Var" */
  type: z.string(),
  detail: nullableText,
});
export type MatchEvent = z.infer<typeof MatchEventSchema>;

export const LineupPlayerSchema = z.object({
  playerId: z.number(),
  name: z.string(),
  number: z.number().int().nullable().catch(null),
  position: nullableText,
});
export type LineupPlayer = z.infer<typeof LineupPlayerSchema>;

export const LineupSchema = z.object({
  teamId: z.number(),
  coachName: nullableText,
  formation: nullableText,
  startXI: z.array(LineupPlayerSchema),
  substitutes: z.array(LineupPlayerSchema),
});
export type Lineup = z.infer<typeof LineupSchema>;

/* ------------------------------------------------------------------ */
/* Statistics                                                          */
/* ------------------------------------------------------------------ */

export const TeamStatValueSchema = z.object({
  label: z.string(),
  home: z.number().nullable(),
  away: z.number().nullable(),
});
export type TeamStatValue = z.infer<typeof TeamStatValueSchema>;

export const MatchStatisticsSchema = z.object({
  homeTeamId: z.number().nullable(),
  awayTeamId: z.number().nullable(),
  stats: z.array(TeamStatValueSchema),
});
export type MatchStatistics = z.infer<typeof MatchStatisticsSchema>;

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */

export const TeamProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  logoUrl: nullableUrl,
  country: nullableText,
  founded: z.number().int().nullable().catch(null),
  venueName: nullableText,
});
export type TeamProfile = z.infer<typeof TeamProfileSchema>;

export const SquadPlayerSchema = z.object({
  playerId: z.number(),
  name: z.string(),
  age: z.number().nullable().catch(null),
  number: z.number().int().nullable().catch(null),
  position: nullableText,
  photoUrl: nullableUrl,
});
export type SquadPlayer = z.infer<typeof SquadPlayerSchema>;

export const TeamFormEntrySchema = z.object({
  fixtureId: z.number(),
  date: z.string(),
  homeTeamId: z.number(),
  homeTeamName: z.string(),
  homeTeamLogoUrl: nullableUrl,
  awayTeamId: z.number(),
  awayTeamName: z.string(),
  awayTeamLogoUrl: nullableUrl,
  goalsHome: z.number().nullable().catch(null),
  goalsAway: z.number().nullable().catch(null),
  result: z.enum(["W", "D", "L"]),
  leagueName: nullableText,
});
export type TeamFormEntry = z.infer<typeof TeamFormEntrySchema>;

/* ------------------------------------------------------------------ */
/* Players                                                             */
/* ------------------------------------------------------------------ */

export const PlayerProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  photoUrl: nullableUrl,
  age: z.number().int().nullable().catch(null),
  nationality: nullableText,
  position: nullableText,
  currentTeamId: z.number().nullable().catch(null),
  seasonGoals: z.number().int().nullable().catch(null),
  seasonAssists: z.number().int().nullable().catch(null),
  seasonAppearances: z.number().int().nullable().catch(null),
  seasonRating: z.number().nullable().catch(null),
});
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;

/* ------------------------------------------------------------------ */
/* Leagues                                                             */
/* ------------------------------------------------------------------ */

export const LeagueSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  logoUrl: nullableUrl,
  countryName: nullableText,
  countryCode: nullableText,
  countryFlagUrl: nullableUrl,
  season: z.number().nullable().catch(null),
});
export type LeagueSummary = z.infer<typeof LeagueSummarySchema>;

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

export const SearchResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("team"),
    id: z.number(),
    name: z.string(),
    logoUrl: nullableUrl,
    country: nullableText,
  }),
  z.object({
    kind: z.literal("league"),
    id: z.number(),
    name: z.string(),
    logoUrl: nullableUrl,
    country: nullableText,
    season: z.number().nullable().catch(null),
  }),
  z.object({
    kind: z.literal("player"),
    id: z.number(),
    name: z.string(),
    photoUrl: nullableUrl,
    age: z.number().nullable().catch(null),
  }),
]);
export type SearchResult = z.infer<typeof SearchResultSchema>;

/* ------------------------------------------------------------------ */
/* Top scorers / assists                                               */
/* ------------------------------------------------------------------ */

export const TopPlayerEntrySchema = z.object({
  playerId: z.number(),
  playerName: z.string(),
  photoUrl: nullableUrl,
  teamId: z.number(),
  teamName: z.string(),
  teamLogoUrl: nullableUrl,
  value: z.number(),
  appearances: z.number().nullable().catch(null),
  rating: z.number().nullable().catch(null),
});
export type TopPlayerEntry = z.infer<typeof TopPlayerEntrySchema>;

/* ------------------------------------------------------------------ */
/* API status introspection                                            */
/* ------------------------------------------------------------------ */

export const ApiStatusSchema = z.object({
  dailyCallCount: z.number(),
  lastCallAt: z.string().nullable(),
  upstreamOk: z.boolean(),
  trackedErrors: z.number(),
  revalidateWindows: z.record(z.string(), z.number()),
});
export type ApiStatus = z.infer<typeof ApiStatusSchema>;
