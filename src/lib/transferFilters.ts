import type { TransferRecord } from "@/lib/data/transfers";

export type TransferTypeFilter = "all" | "permanent" | "loan" | "free";
export type TransferSort = "newest" | "fee";

export interface TransferFilters {
  type: TransferTypeFilter;
  /** League id, or "all". */
  league: string;
  /** Only disclosed fees of at least this many euros (0 = off). */
  minFeeEur: number;
  /** Only moves involving a followed player or club. */
  followingOnly: boolean;
}

export const DEFAULT_TRANSFER_FILTERS: TransferFilters = {
  type: "all",
  league: "all",
  minFeeEur: 0,
  followingOnly: false,
};

export const TRANSFER_TYPE_OPTIONS: { value: TransferTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "permanent", label: "Permanent" },
  { value: "loan", label: "Loan" },
  { value: "free", label: "Free transfer" },
];

export const TRANSFER_SORT_OPTIONS: { value: TransferSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "fee", label: "Highest fee" },
];

export interface FollowedIds {
  /** Followed player keys (DB id or Transfermarkt id, see FollowButton). */
  players: Set<string>;
  clubs: Set<string>;
}

function matchesType(r: TransferRecord, type: TransferTypeFilter): boolean {
  if (type === "all") return true;
  // A loan with an option to buy is still a loan.
  if (type === "loan") return r.transferType === "loan" || r.transferType === "loan_with_option";
  return r.transferType === type;
}

export function involvesFollowed(r: TransferRecord, followed: FollowedIds): boolean {
  const p = r.player;
  if (p && (followed.players.has(p.id) || (p.sourceId != null && followed.players.has(p.sourceId)))) return true;
  return (
    (r.fromClubId != null && followed.clubs.has(r.fromClubId)) ||
    (r.toClubId != null && followed.clubs.has(r.toClubId))
  );
}

export function filterTransfers(records: TransferRecord[], f: TransferFilters, followed: FollowedIds): TransferRecord[] {
  return records.filter(
    (r) =>
      matchesType(r, f.type) &&
      (f.league === "all" || (r.leagueIds ?? []).includes(f.league)) &&
      (f.minFeeEur <= 0 || (r.feeEur != null && r.feeEur >= f.minFeeEur)) &&
      (!f.followingOnly || involvesFollowed(r, followed))
  );
}

const time = (r: TransferRecord) => {
  const t = Date.parse(r.date);
  return Number.isFinite(t) ? t : 0;
};

/** Newest first, or highest disclosed fee first (undisclosed fees last, then newest). */
export function sortTransfers(records: TransferRecord[], sort: TransferSort): TransferRecord[] {
  const copy = [...records];
  if (sort === "fee") {
    return copy.sort((a, b) => (b.feeEur ?? -1) - (a.feeEur ?? -1) || time(b) - time(a));
  }
  return copy.sort((a, b) => time(b) - time(a));
}

/** Number of filters that differ from the defaults, for the Filter button badge. */
export function activeFilterCount(f: TransferFilters): number {
  return (
    Number(f.type !== "all") + Number(f.league !== "all") + Number(f.minFeeEur > 0) + Number(f.followingOnly)
  );
}
