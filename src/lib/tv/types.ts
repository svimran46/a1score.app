/**
 * TV schedule model, independent of where the listings come from. Swap the
 * provider in ./index.ts for an official listings API without touching the UI.
 */

export interface TvChannel {
  name: string;
  kind: "tv" | "stream" | "other";
}

export interface TvTeam {
  name: string;
  /** Provider team id, used for crests and match links when available. */
  id: string | null;
  logoUrl: string | null;
}

export interface TvListing {
  /** Match id in a1score's match feed (FotMob), for linking to /matches/[id]. */
  matchId: string;
  /** Kick-off / broadcast start, ISO 8601 (UTC). */
  startTime: string;
  home: TvTeam;
  away: TvTeam;
  /** True when at least one channel shows it live (not a replay). */
  live: boolean;
  channels: TvChannel[];
}

export interface TvProvider {
  /** Shown under the schedule so viewers know where listings come from. */
  sourceLabel: string;
  /** Upcoming listings for a country (ISO 3166-1 alpha-2), sorted by start time. */
  getListings(countryCode: string): Promise<TvListing[]>;
}
