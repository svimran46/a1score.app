/**
 * PlayerProfileVM: the single, normalised view model the player profile,
 * its metadata and its share card render from. Built server-side by
 * buildPlayerProfile (src/lib/data/playerProfile.ts) from either data path
 * (Transfermarkt proxy or Supabase). Components never see the raw player.
 *
 * Honesty contract: every field is nullable and null means "not on record".
 * Nothing here is ever defaulted, guessed or dated "now".
 * All dates are ISO-8601 strings so the VM serialises to client islands.
 */

import type { PlayerAchievementsGrouped } from "@/lib/data/playerAchievements";
import type { NewsItem } from "@/types/news";

export type ProfileStatusKind = "signed" | "on_loan" | "free_agent" | "retired" | "unknown";

/** fresh <= 180 days, aging 181-365, stale > 365, unknown when asOf is null */
export type Staleness = "fresh" | "aging" | "stale" | "unknown";

export type FeeStatus =
  | "disclosed" // a fee > 0 that is not a loan
  | "loan"
  | "loan_fee" // loan with a disclosed fee
  | "loan_return"
  | "free" // source explicitly says free transfer
  | "undisclosed" // source says the fee is unknown ("?")
  | "not_recorded"; // no fee information at all

export interface ValuationPoint {
  date: string;
  valueEur: number;
  clubName: string | null;
}

export interface CurrentValuation {
  valueEur: number;
  /** Date of the real history point carrying this value; null when unknown. */
  asOf: string | null;
}

export interface ValueDelta {
  diffEur: number;
  /** null when the base value is 0 */
  pct: number | null;
  /** Date of the valuation the change is measured against. */
  basisDate: string;
}

export interface PeakValuation {
  valueEur: number;
  /** First date the peak value was recorded. */
  date: string;
  /** 0..100, how far the current value sits below the peak. */
  pctBelow: number;
  isCurrent: boolean;
}

export interface FirstValuation {
  valueEur: number;
  date: string;
  ageAtDate: number | null;
}

export interface ProfileClubRef {
  name: string;
  shortName: string;
  logoUrl: string | null;
  /** Only set when the club resolves to a DB row (a real page exists). */
  href: string | null;
}

export interface ProfileTransfer {
  id: string;
  date: string;
  fromName: string | null;
  toName: string | null;
  feeStatus: FeeStatus;
  feeEur: number | null;
  /** Youth/reserve/academy moves (U19, II, B teams, promotions). */
  isYouth: boolean;
  /** Real valuation in effect at the move, at most 183 days before it. */
  valueThen: { valueEur: number; date: string } | null;
}

export interface ProfileInjury {
  id: string;
  type: string;
  isActive: boolean;
  /** DB start date only; FotMob start dates are not trustworthy. */
  since: string | null;
  /** Free text from the source, shown verbatim. */
  expectedReturn: string | null;
  source: "db" | "fotmob";
}

export interface SeasonStatRow {
  season: string;
  competition: string | null;
  clubName: string | null;
  appearances: number | null;
  goals: number | null;
  assists: number | null;
  minutesPlayed: number | null;
  yellowCards: number | null;
  redCards: number | null;
  rating: number | null;
}

export interface PlayerProfileVM {
  identity: {
    /** player.id as the data path returned it (TM numeric id or DB cuid); used as the follow key. */
    key: string;
    dbId: string | null;
    /** Canonical slug (getPlayerSlug). */
    slug: string;
    /** commonName || fullName */
    displayName: string;
    fullName: string;
    photoUrl: string | null;
    dob: string | null;
    age: number | null;
    nationality: string | null;
    heightCm: number | null;
    preferredFoot: string | null;
    /** Detailed position label, null when unknown. */
    position: string | null;
    /** Secondary position (TM path only). */
    alsoPlays: string | null;
  };

  club: (ProfileClubRef & { league: { name: string; href: string | null } | null }) | null;

  status: {
    kind: ProfileStatusKind;
    /** Parsed future contract end (TM only), never DB loanUntil. */
    contractUntil: string | null;
    contractMonthsLeft: number | null;
    parentClub: ProfileClubRef | null;
    activeInjury: { type: string } | null;
  };

  valuation: {
    /** Real points only, ascending, de-duplicated by date. */
    points: ValuationPoint[];
    current: CurrentValuation | null;
    staleness: Staleness;
    /** "Last market value" when stale or retired. */
    label: "Market value" | "Last market value";
    sincePrevious: ValueDelta | null;
    twelveMonth: ValueDelta | null;
    peak: PeakValuation | null;
    first: FirstValuation | null;
  };

  /** Newest first; invalid and future-dated rows already dropped. */
  transfers: ProfileTransfer[];
  /** Disclosed non-loan fees only; null when there are none. */
  transferSummary: {
    totalEur: number;
    count: number;
    record: { feeEur: number; toName: string | null; date: string };
  } | null;

  honours: PlayerAchievementsGrouped | null;
  injuries: ProfileInjury[];
  news: { items: NewsItem[]; scope: "player" | "club" } | null;

  /** Inputs for the streamed Season section. */
  season: {
    /** DB SeasonStats rows when present (never zero-filled). */
    dbRows: SeasonStatRow[];
    /** Name to look up on FotMob when there are no DB rows. */
    lookupName: string;
    /** Current club name used to verify a FotMob match; null disables FotMob. */
    verifyClubName: string | null;
  };
}

/**
 * Compact props for the lazily loaded value chart. Tuples keep the RSC payload
 * small; the raw player object never reaches the client.
 */
export interface ValueChartProps {
  /** [timestamp ms, valueEur, index into clubs or -1] ascending, real points only */
  points: [number, number, number][];
  clubs: string[];
  /** [timestamp ms, feeEur, destination club name or null] for disclosed / loan_fee senior moves */
  markers: [number, number, string | null][];
  playerName: string;
  /** true when the value is stale (> 365 days) or the player is retired */
  ended: boolean;
}
