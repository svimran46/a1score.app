"use client";

/**
 * Favorites — client-only state persisted to localStorage (Section 8.8).
 * There is deliberately no account system in this build; a real one
 * (Auth.js + database) is a natural later addition.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FavoriteKind = "team" | "league";

export interface FavoriteItem {
  kind: FavoriteKind;
  id: number;
  name: string;
  logoUrl: string | null;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  toggle: (item: FavoriteItem) => void;
  remove: (kind: FavoriteKind, id: number) => void;
  clear: () => void;
  isFavorite: (kind: FavoriteKind, id: number) => boolean;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggle: (item) =>
        set((state) => {
          const exists = state.favorites.some(
            (f) => f.kind === item.kind && f.id === item.id,
          );
          return {
            favorites: exists
              ? state.favorites.filter((f) => !(f.kind === item.kind && f.id === item.id))
              : [...state.favorites, item],
          };
        }),
      remove: (kind, id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => !(f.kind === kind && f.id === id)),
        })),
      clear: () => set({ favorites: [] }),
      isFavorite: (kind, id) =>
        get().favorites.some((f) => f.kind === kind && f.id === id),
    }),
    { name: "livescore.favorites" },
  ),
);
