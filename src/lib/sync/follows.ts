/**
 * Pure helpers for syncing follows between this device (WatchlistItem in
 * localStorage) and the account (public.user_follows rows).
 */
import type { WatchlistItem, WatchlistType } from "@/lib/watchlist/storage";

export interface FollowRow {
  type: WatchlistType;
  entity_id: string;
  data: Omit<WatchlistItem, "id" | "type" | "savedAt">;
  saved_at: string;
}

export const followKey = (f: { type: string; id: string }) => `${f.type}:${f.id}`;

export function toRow(item: WatchlistItem): FollowRow {
  const { id, type, savedAt, ...data } = item;
  return { type, entity_id: id, data, saved_at: savedAt };
}

export function fromRow(row: FollowRow): WatchlistItem {
  return { ...(row.data ?? {}), id: row.entity_id, type: row.type, savedAt: row.saved_at } as WatchlistItem;
}

/**
 * First sign-in on a device: keep everything followed on either side. For a
 * follow on both, the earlier one sets "followed since" (savedAt and the
 * value baseline); the device's copy supplies the freshest display fields.
 */
export function mergeFollows(local: WatchlistItem[], remote: WatchlistItem[]): WatchlistItem[] {
  const out = new Map<string, WatchlistItem>();
  for (const r of remote) out.set(followKey(r), r);
  for (const l of local) {
    const r = out.get(followKey(l));
    if (!r) {
      out.set(followKey(l), l);
      continue;
    }
    const earlier = Date.parse(r.savedAt) <= Date.parse(l.savedAt) ? r : l;
    out.set(followKey(l), {
      ...r,
      ...l,
      savedAt: earlier.savedAt,
      initialValueEur: earlier.initialValueEur ?? l.initialValueEur ?? r.initialValueEur,
      currentValueEur: l.currentValueEur ?? r.currentValueEur,
    });
  }
  // Newest follow first, like the device list.
  return Array.from(out.values()).sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
}

/** What changed between two snapshots of the device's follows. */
export function diffFollows(
  before: WatchlistItem[],
  after: WatchlistItem[]
): { upserts: WatchlistItem[]; deletes: { type: WatchlistType; id: string }[] } {
  const prev = new Map(before.map((f) => [followKey(f), f]));
  const next = new Map(after.map((f) => [followKey(f), f]));
  const upserts = after.filter((f) => {
    const p = prev.get(followKey(f));
    return !p || JSON.stringify(p) !== JSON.stringify(f);
  });
  const deletes = before.filter((f) => !next.has(followKey(f))).map((f) => ({ type: f.type, id: f.id }));
  return { upserts, deletes };
}
