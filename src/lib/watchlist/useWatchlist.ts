"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { watchlistAdapter, WatchlistItem } from "./storage";
import { trackEvent } from "@/lib/analytics";

export function useWatchlist() {
  const [isMounted, setIsMounted] = useState(false);
  const [favorites, setFavorites] = useState<WatchlistItem[]>([]);
  const [isStorageAvailable, setIsStorageAvailable] = useState(true);

  // Sync state from adapter
  const sync = useCallback(() => {
    setFavorites(watchlistAdapter.getFavorites());
    setIsStorageAvailable(watchlistAdapter.isStorageAvailable());
  }, []);

  useEffect(() => {
    setIsMounted(true);
    sync();
    const unsubscribe = watchlistAdapter.subscribe(sync);
    return () => {
      unsubscribe();
    };
  }, [sync]);

  const playerFavorites = useMemo(
    () => favorites.filter((f) => f.type === "player"),
    [favorites]
  );

  const clubFavorites = useMemo(
    () => favorites.filter((f) => f.type === "club"),
    [favorites]
  );

  const isFollowing = useCallback(
    (id: string, type: "player" | "club") => {
      if (!isMounted) return false;
      return favorites.some((f) => f.id === id && f.type === type);
    },
    [favorites, isMounted]
  );

  const follow = useCallback(
    (item: Omit<WatchlistItem, "savedAt">) => {
      watchlistAdapter.addFavorite(item);
      trackEvent("follow", { category: item.type });
    },
    []
  );

  const unfollow = useCallback((id: string, type: "player" | "club") => {
    watchlistAdapter.removeFavorite(id, type);
  }, []);

  const toggle = useCallback(
    (item: Omit<WatchlistItem, "savedAt">) => {
      if (watchlistAdapter.isFavorite(item.id, item.type)) {
        watchlistAdapter.removeFavorite(item.id, item.type);
      } else {
        watchlistAdapter.addFavorite(item);
        trackEvent("follow", { category: item.type });
      }
    },
    []
  );

  const clearAll = useCallback((type?: "player" | "club") => {
    watchlistAdapter.clearFavorites(type);
  }, []);

  return {
    isMounted,
    favorites,
    playerFavorites,
    clubFavorites,
    isFollowing,
    follow,
    unfollow,
    toggle,
    clearAll,
    isStorageAvailable,
  };
}
