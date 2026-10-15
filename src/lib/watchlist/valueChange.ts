import type { WatchlistItem } from "./storage";

export interface FollowValueChange {
  /** Latest known value in EUR, or 0 when unknown. */
  current: number;
  /** Percentage change since the item was followed; null when there is nothing to compare. */
  pct: number | null;
}

/** Market value now vs. when the user followed the item. */
export function followValueChange(item: Pick<WatchlistItem, "currentValueEur" | "initialValueEur">): FollowValueChange {
  const current = item.currentValueEur || item.initialValueEur || 0;
  const initial = item.initialValueEur || current;
  if (!current || !initial || current === initial) return { current, pct: null };
  return { current, pct: ((current - initial) / initial) * 100 };
}
