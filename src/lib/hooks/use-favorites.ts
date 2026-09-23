"use client";

/**
 * Hydration-safe favorites hooks. The persisted Zustand store rehydrates
 * after mount, so consumers must not render favorites during SSR.
 */

import { useFavorites, type FavoriteItem, type FavoriteKind } from "@/lib/store/favorites";
import { useIsClient } from "@/lib/hooks/use-is-client";

/** Favorites list, empty until the client has hydrated. */
export function useFavoritesHydrated(): FavoriteItem[] {
  const isClient = useIsClient();
  const favorites = useFavorites((s) => s.favorites);
  return isClient ? favorites : [];
}

/** Whether one item is favorited, false until hydration. */
export function useIsFavorite(kind: FavoriteKind, id: number): boolean {
  const isClient = useIsClient();
  const isFavorite = useFavorites((s) => s.isFavorite);
  return isClient && isFavorite(kind, id);
}
