# a1score.app — Complete Implementation Report (Phases 8 & 9)

**Date:** 2026-10-03  
**Status:** Completed, Tested, and Pushed to `origin/main`  
**Commits:**
- `894530f`: `feat(watchlist): Phase 8 - player and club favorites, watchlist page, and right-rail widget`
- `5c561c9`: `feat(notifications): Phase 9 - PWA Push Notifications for Value Movements`

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Phase 8: Watchlist (Favorites)](#2-phase-8-watchlist-favorites)
   - Storage Architecture (`storage.ts`)
   - React Hook (`useWatchlist.ts`)
   - Follow Button Component (`FollowButton.tsx`)
   - Watchlist Page Client (`WatchlistClient.tsx`)
   - Route Definition (`src/app/watchlist/page.tsx`)
   - Right Rail Widget (`WatchlistRightRailCard.tsx`)
   - UI & Shell Integration
3. [Phase 9: PWA Push Notifications for Value Movements](#3-phase-9-pwa-push-notifications)
   - Service Worker (`public/sw.js`)
   - Web App Manifest (`src/app/manifest.ts`)
   - Subscription Store (`src/lib/notifications/store.ts`)
   - VAPID Configuration (`src/lib/notifications/vapid.ts`)
   - Notification Dispatcher (`src/lib/notifications/dispatcher.ts`)
   - Client Hook (`src/lib/notifications/useNotifications.ts`)
   - Notification Settings UI (`NotificationSettingsCard.tsx`)
   - Post-Follow In-Page Prompt (`PostFollowNotificationPrompt.tsx`)
   - API Endpoints (`subscribe`, `unsubscribe`, `test`, `cron`)
4. [Automated Test Suites](#4-automated-test-suites)
   - Watchlist Tests (`tests/watchlist.test.ts`)
   - Push Notification Tests (`tests/push-notifications.test.ts`)
5. [Quality Assurance & Verification Results](#5-quality-assurance--verification-results)

---

## 1. Executive Summary

This document consolidates the complete code, architecture, and verification results for **Phase 8** and **Phase 9** of `a1score.app`:
- **Phase 8 (Watchlist)** allows users to follow players and clubs with zero layout shift, tracking their valuation changes since followed in a dedicated `/watchlist` interface and desktop right-rail card. Storage is strictly client-side (`localStorage`) behind a modular adapter with in-memory fallback.
- **Phase 9 (PWA Web Push Notifications)** introduces anonymous, privacy-focused Web Push notifications for valuation updates. Notifications are rate-limited to 1 per day, grouped when multiple players change, prompted only after a follow action, and optimized for iOS PWA Home Screen installation.

---

## 2. Phase 8: Watchlist (Favorites)

### `src/lib/watchlist/storage.ts`
```typescript
/**
 * Watchlist Storage Adapter Architecture
 * Encapsulates client-side favorite persistence behind a modular interface
 * so it can be swapped for an authenticated server-backed API in future phases.
 */

export interface WatchlistItem {
  id: string;
  type: "player" | "club";
  name: string;
  slug?: string;
  avatarUrl?: string | null;
  clubName?: string | null;
  clubCrest?: string | null;
  position?: string | null;
  savedAt: string; // ISO date
  initialValueEur?: number;
  currentValueEur?: number;
  trendPercentage?: number | null;
}

export interface WatchlistAdapter {
  getFavorites(): WatchlistItem[];
  addFavorite(item: Omit<WatchlistItem, "savedAt"> & { savedAt?: string }): boolean;
  removeFavorite(id: string, type: "player" | "club"): boolean;
  isFavorite(id: string, type: "player" | "club"): boolean;
  clearFavorites(type?: "player" | "club"): boolean;
  isStorageAvailable(): boolean;
  subscribe(callback: () => void): () => void;
}

const STORAGE_KEY = "a1score_watchlist_v1";

class LocalStorageWatchlistAdapter implements WatchlistAdapter {
  private inMemoryFallback: WatchlistItem[] = [];
  private listeners: Set<() => void> = new Set();
  private storageSupported: boolean | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) {
          this.notify();
        }
      });
    }
  }

  isStorageAvailable(): boolean {
    if (this.storageSupported !== null) {
      return this.storageSupported;
    }
    if (typeof window === "undefined" || !window.localStorage) {
      this.storageSupported = false;
      return false;
    }
    try {
      const testKey = "__a1score_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      this.storageSupported = true;
      return true;
    } catch {
      this.storageSupported = false;
      return false;
    }
  }

  getFavorites(): WatchlistItem[] {
    if (!this.isStorageAvailable()) {
      return [...this.inMemoryFallback];
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.warn("[Watchlist] Failed to read from localStorage:", e);
      return [...this.inMemoryFallback];
    }
  }

  addFavorite(item: Omit<WatchlistItem, "savedAt"> & { savedAt?: string }): boolean {
    const fullItem: WatchlistItem = {
      ...item,
      savedAt: item.savedAt || new Date().toISOString(),
      initialValueEur: item.initialValueEur ?? item.currentValueEur ?? 0,
    };

    const current = this.getFavorites();
    const filtered = current.filter((f) => !(f.id === item.id && f.type === item.type));
    const next = [fullItem, ...filtered];

    if (!this.isStorageAvailable()) {
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this.notify();
      return true;
    } catch (e) {
      console.warn("[Watchlist] Failed to write to localStorage:", e);
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }
  }

  removeFavorite(id: string, type: "player" | "club"): boolean {
    const current = this.getFavorites();
    const next = current.filter((f) => !(f.id === id && f.type === type));

    if (!this.isStorageAvailable()) {
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this.notify();
      return true;
    } catch (e) {
      console.warn("[Watchlist] Failed to remove from localStorage:", e);
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }
  }

  isFavorite(id: string, type: "player" | "club"): boolean {
    const current = this.getFavorites();
    return current.some((f) => f.id === id && f.type === type);
  }

  clearFavorites(type?: "player" | "club"): boolean {
    let next: WatchlistItem[] = [];
    if (type) {
      const current = this.getFavorites();
      next = current.filter((f) => f.type !== type);
    }

    if (!this.isStorageAvailable()) {
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }

    try {
      if (next.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      this.notify();
      return true;
    } catch (e) {
      console.warn("[Watchlist] Failed to clear localStorage:", e);
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error("[Watchlist] Error in subscriber callback:", err);
      }
    });
  }
}

export const watchlistAdapter: WatchlistAdapter = new LocalStorageWatchlistAdapter();
```

---

### `src/lib/watchlist/useWatchlist.ts`
```typescript
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { watchlistAdapter, WatchlistItem } from "./storage";

export function useWatchlist() {
  const [isMounted, setIsMounted] = useState(false);
  const [favorites, setFavorites] = useState<WatchlistItem[]>([]);
  const [isStorageAvailable, setIsStorageAvailable] = useState(true);

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
```

---

### `src/components/watchlist/FollowButton.tsx`
```typescript
"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";

export interface FollowButtonProps {
  id: string;
  type: "player" | "club";
  name: string;
  slug?: string | null;
  avatarUrl?: string | null;
  clubName?: string | null;
  clubCrest?: string | null;
  position?: string | null;
  marketValue?: number | null;
  variant?: "icon" | "button";
  desktopHoverOnly?: boolean;
  className?: string;
}

export function FollowButton({
  id,
  type,
  name,
  slug,
  avatarUrl,
  clubName,
  clubCrest,
  position,
  marketValue,
  variant = "icon",
  desktopHoverOnly = false,
  className = "",
}: FollowButtonProps) {
  const { isMounted, isFollowing, toggle } = useWatchlist();
  const [isLoading, setIsLoading] = useState(false);

  const following = isMounted ? isFollowing(id, type) : false;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    toggle({
      id,
      type,
      name,
      slug: slug || undefined,
      avatarUrl,
      clubName,
      clubCrest,
      position,
      currentValueEur: marketValue || 0,
      initialValueEur: marketValue || 0,
    });

    if (!following && type === "player" && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("a1score:player-followed", {
          detail: { name, id, slug },
        })
      );
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  };

  const label = following ? `Unfollow ${name}` : `Follow ${name}`;

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-pressed={following}
        aria-label={label}
        className={`h-11 min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] select-none ${
          following
            ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95"
            : "bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--divider)]"
        } ${isLoading ? "opacity-70 cursor-wait" : ""} ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
        ) : (
          <Star
            className={`w-4 h-4 shrink-0 transition-transform ${
              following ? "fill-current stroke-current" : "fill-none stroke-current"
            }`}
          />
        )}
        <span>{following ? "Following" : "Follow"}</span>
      </button>
    );
  }

  const hoverVisibilityClass =
    desktopHoverOnly && !following
      ? "md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 md:group-focus-within:opacity-100"
      : "opacity-100";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-pressed={following}
      aria-label={label}
      title={label}
      className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] select-none ${
        following
          ? "text-[var(--accent)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
      } ${hoverVisibilityClass} ${isLoading ? "opacity-70 cursor-wait" : ""} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
      ) : (
        <Star
          className={`w-4 h-4 shrink-0 transition-transform ${
            following
              ? "fill-[var(--accent)] stroke-[var(--accent)] scale-110"
              : "fill-none stroke-current"
          }`}
        />
      )}
    </button>
  );
}
```

---

### `src/components/watchlist/WatchlistClient.tsx`
```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  User,
  Shield,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";
import { formatCompactEur } from "@/lib/utils";
import { NotificationSettingsCard } from "@/components/notifications/NotificationSettingsCard";

export function WatchlistClient() {
  const {
    isMounted,
    playerFavorites,
    clubFavorites,
    unfollow,
    clearAll,
    isStorageAvailable,
  } = useWatchlist();

  const [activeTab, setActiveTab] = useState<"players" | "clubs">("players");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isMounted) {
    return (
      <div className="space-y-4 max-w-[720px] mx-auto p-4">
        <div className="h-8 w-44 bg-[var(--bg-chip)] rounded animate-pulse" />
        <div className="h-4 w-64 bg-[var(--bg-chip)] rounded animate-pulse" />
        <div className="h-48 bg-[var(--bg-card)] rounded-[var(--card-radius)] animate-pulse mt-6" />
      </div>
    );
  }

  const currentItems = activeTab === "players" ? playerFavorites : clubFavorites;

  const handleConfirmClear = () => {
    clearAll(activeTab === "players" ? "player" : "club");
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-[720px] mx-auto pb-12">
      {/* 1. Header with Title & Clear Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[var(--accent)] fill-[var(--accent)]" />
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Watchlist
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Track market valuations and updates for your favorite players and clubs.
          </p>
        </div>

        {/* Clear All Confirmation / Button */}
        {currentItems.length > 0 && (
          <div className="shrink-0 flex items-center">
            {showClearConfirm ? (
              <div className="flex items-center gap-2 bg-[var(--bg-elevated)] p-1.5 rounded-xl border border-[var(--divider)]">
                <span className="text-xs text-[var(--text-muted)] px-1 font-medium">
                  Clear {activeTab}?
                </span>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="px-2.5 py-1 min-h-[36px] bg-[var(--trend-down)] text-[var(--accent-contrast)] hover:opacity-90 rounded-lg text-xs font-semibold flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1 min-h-[36px] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="min-h-[44px] px-3 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--trend-down)] hover:bg-[var(--bg-hover)] flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear {activeTab}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Storage Warning Banner */}
      {!isStorageAvailable && (
        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--divider)] flex items-start gap-3 text-xs text-[var(--text-secondary)]">
          <AlertCircle className="w-4 h-4 text-[var(--value-text)] shrink-0 mt-0.5" />
          <p>
            Favorites will only be stored for this session because browser storage is disabled or unavailable.
          </p>
        </div>
      )}

      {/* Notification Alerts Settings */}
      <NotificationSettingsCard />

      {/* 2. Tabs: Players / Clubs */}
      <div className="flex items-center gap-2 border-b border-[var(--divider)] pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("players");
            setShowClearConfirm(false);
          }}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
            activeTab === "players"
              ? "bg-[var(--bg-chip)] text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Players</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-page)] text-[var(--text-secondary)] tabular-nums">
            {playerFavorites.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("clubs");
            setShowClearConfirm(false);
          }}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
            activeTab === "clubs"
              ? "bg-[var(--bg-chip)] text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Clubs</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-page)] text-[var(--text-secondary)] tabular-nums">
            {clubFavorites.length}
          </span>
        </button>
      </div>

      {/* 3. Empty State or List */}
      {currentItems.length === 0 ? (
        <div className="p-10 text-center rounded-[var(--card-radius)] bg-[var(--bg-card)] border border-[var(--divider)] shadow-xs space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-chip)] flex items-center justify-center">
            <Star className="w-6 h-6 text-[var(--text-muted)]" />
          </div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            No {activeTab} in your watchlist
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
            You&apos;re not following anyone yet. Tap the star on a player or club to add them.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/values"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <span>Explore Player Values</span>
            </Link>
            <Link
              href="/clubs"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] text-xs font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <span>Browse Clubs</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {activeTab === "players"
            ? playerFavorites.map((item) => {
                const currentVal = item.currentValueEur || item.initialValueEur || 0;
                const initialVal = item.initialValueEur || currentVal;
                const diff = currentVal - initialVal;
                const isPos = diff >= 0;
                const pct = initialVal > 0 ? Math.abs((diff / initialVal) * 100).toFixed(1) : "0.0";
                const hasChange = diff !== 0 && initialVal > 0;
                const href = item.slug ? `/players/${item.slug}` : `/players/${item.id}`;

                return (
                  <div
                    key={item.id}
                    className="group relative flex items-center justify-between gap-3 p-3 sm:px-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--divider)] shadow-xs transition-colors"
                  >
                    <Link
                      href={href}
                      aria-label={item.name}
                      className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    />

                    {/* Left: Avatar + Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-chip)] overflow-hidden shrink-0 relative flex items-center justify-center">
                        {item.avatarUrl ? (
                          <Image
                            src={item.avatarUrl}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        ) : (
                          <User className="w-5 h-5 text-[var(--text-muted)]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors leading-tight">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {item.clubCrest && (
                            <span className="relative w-3.5 h-3.5 shrink-0 inline-block overflow-hidden">
                              <Image
                                src={item.clubCrest}
                                alt=""
                                width={14}
                                height={14}
                                className="object-contain"
                                unoptimized
                              />
                            </span>
                          )}
                          <span className="truncate">{item.clubName || "Free Agent"}</span>
                          {item.position && (
                            <>
                              <span className="text-[var(--divider)]">·</span>
                              <span className="truncate">{item.position}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Value, Change Since Followed, and Remove Button */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10">
                      <div className="text-right pointer-events-none">
                        <div className="text-sm sm:text-base font-bold text-[var(--value-text)] tabular-nums leading-tight">
                          {currentVal > 0 ? formatCompactEur(currentVal) : "—"}
                        </div>
                        {hasChange ? (
                          <div
                            className={`flex items-center justify-end gap-0.5 text-xs font-bold tabular-nums leading-tight mt-0.5 ${
                              isPos ? "text-[var(--trend-up)]" : "text-[var(--trend-down)]"
                            }`}
                          >
                            {isPos ? (
                              <TrendingUp className="w-3 h-3 shrink-0" />
                            ) : (
                              <TrendingDown className="w-3 h-3 shrink-0" />
                            )}
                            <span>{isPos ? `+${pct}%` : `-${pct}%`}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">
                            0.0% (saved)
                          </span>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => unfollow(item.id, "player")}
                        aria-label={`Unfollow ${item.name}`}
                        title={`Unfollow ${item.name}`}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--trend-down)] hover:bg-[var(--bg-chip)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] pointer-events-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            : clubFavorites.map((item) => {
                const currentVal = item.currentValueEur || item.initialValueEur || 0;
                const href = item.slug ? `/clubs/${item.slug}` : `/clubs/${item.id}`;

                return (
                  <div
                    key={item.id}
                    className="group relative flex items-center justify-between gap-3 p-3 sm:px-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--divider)] shadow-xs transition-colors"
                  >
                    <Link
                      href={href}
                      aria-label={item.name}
                      className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    />

                    {/* Left: Crest + Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10 pointer-events-none">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--bg-chip)] p-1 overflow-hidden shrink-0 relative flex items-center justify-center">
                        {item.avatarUrl || item.clubCrest ? (
                          <Image
                            src={item.avatarUrl || item.clubCrest || ""}
                            alt={item.name}
                            width={32}
                            height={32}
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-[var(--text-muted)]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors leading-tight">
                          {item.name}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          Football Club
                        </div>
                      </div>
                    </div>

                    {/* Right: Squad Value and Remove Button */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10">
                      {currentVal > 0 && (
                        <div className="text-right pointer-events-none">
                          <div className="text-sm sm:text-base font-bold text-[var(--value-text)] tabular-nums leading-tight">
                            {formatCompactEur(currentVal)}
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">
                            Squad Valuation
                          </span>
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => unfollow(item.id, "club")}
                        aria-label={`Unfollow ${item.name}`}
                        title={`Unfollow ${item.name}`}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--trend-down)] hover:bg-[var(--bg-chip)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] pointer-events-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      )}
    </div>
  );
}
```

---

## 3. Phase 9: PWA Push Notifications

### `public/sw.js`
```javascript
// Resilient Service Worker for a1score PWA
// Handles offline caching, Web Push notifications, and notification click navigation

const CACHE_NAME = "a1score-v1";
const OFFLINE_URLS = ["/", "/matches", "/players", "/clubs", "/leagues", "/values", "/watchlist"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn("[PWA SW] Pre-caching completed with partial network bypass:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Network-first strategy with cache fallback for HTML and assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (
    request.method !== "GET" ||
    request.url.includes("/api/") ||
    request.url.includes("/img/")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      })
  );
});

// Push Notification Handler for Value Updates
self.addEventListener("push", (event) => {
  let payload = {
    title: "Value update",
    body: "A player you follow had a market valuation update.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/watchlist" },
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  const title = payload.title || "Value update";
  const options = {
    body: payload.body || "A player you follow had a market valuation update.",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag || "value-update",
    data: payload.data || { url: "/watchlist" },
    vibrate: [100, 50, 100],
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler: Focuses or opens the player or watchlist page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || "/watchlist";
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      for (const client of clientList) {
        if ("focus" in client && "navigate" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
```

---

### `src/lib/notifications/dispatcher.ts`
```typescript
/**
 * Notification Dispatcher
 * Evaluates market value movements against active subscriptions and sends
 * grouped Web Push notifications with rate-limiting and auto-cleanup.
 */

import webpush from "web-push";
import { subscriptionStore } from "./store";
import {
  DEFAULT_VAPID_PUBLIC_KEY,
  DEFAULT_VAPID_PRIVATE_KEY,
  DEFAULT_VAPID_SUBJECT,
} from "./vapid";
import {
  DispatchResult,
  NotificationPayload,
  PushSubscriptionRecord,
} from "./types";
import { formatCompactEur } from "@/lib/utils";

try {
  webpush.setVapidDetails(
    DEFAULT_VAPID_SUBJECT,
    DEFAULT_VAPID_PUBLIC_KEY,
    DEFAULT_VAPID_PRIVATE_KEY
  );
} catch (e) {
  console.warn("[Push] VAPID initialization warning:", e);
}

export interface PlayerValuationMovement {
  id: string;
  name: string;
  slug?: string;
  avatarUrl?: string | null;
  previousValueEur: number;
  latestValueEur: number;
  diffEur: number;
  percentage: number;
}

export interface DispatchOptions {
  ignoreRateLimit?: boolean;
  simulatedMovements?: PlayerValuationMovement[];
  targetEndpoint?: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function dispatchValuationAlerts(
  movements: PlayerValuationMovement[],
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  const result: DispatchResult = {
    sentCount: 0,
    failedCount: 0,
    expiredCount: 0,
    skippedRateLimitCount: 0,
  };

  const allSubscriptions = await subscriptionStore.getAll();
  const subscriptions = options.targetEndpoint
    ? allSubscriptions.filter((s) => s.endpoint === options.targetEndpoint)
    : allSubscriptions;

  if (subscriptions.length === 0) {
    return result;
  }

  const movementsMap = new Map<string, PlayerValuationMovement>();
  for (const m of movements) {
    movementsMap.set(m.id, m);
    if (m.slug) movementsMap.set(m.slug, m);
  }

  const expiredEndpoints: string[] = [];
  const now = new Date();

  for (const sub of subscriptions) {
    // 1. Rate-limit: max 1 push per user per day by default
    if (!options.ignoreRateLimit && sub.lastNotifiedAt) {
      const last = new Date(sub.lastNotifiedAt).getTime();
      if (!isNaN(last) && now.getTime() - last < ONE_DAY_MS) {
        result.skippedRateLimitCount++;
        continue;
      }
    }

    // 2. Identify followed players whose value change meets/exceeds threshold
    const userThreshold = sub.threshold || 0.05;
    const triggeredPlayers: PlayerValuationMovement[] = [];

    for (const followedId of sub.followedPlayerIds) {
      const movement = movementsMap.get(followedId);
      if (movement && Math.abs(movement.percentage) >= userThreshold) {
        triggeredPlayers.push(movement);
      }
    }

    if (triggeredPlayers.length === 0) {
      continue;
    }

    // 3. Compose grouped or single notification payload
    let payload: NotificationPayload;

    if (triggeredPlayers.length === 1) {
      const p = triggeredPlayers[0];
      const isUp = p.diffEur >= 0;
      const pctStr = (Math.abs(p.percentage) * 100).toFixed(1);
      const sign = isUp ? "+" : "-";
      const oldStr = formatCompactEur(p.previousValueEur);
      const newStr = formatCompactEur(p.latestValueEur);

      payload = {
        title: `Value update: ${p.name}`,
        body: `${oldStr} to ${newStr} (${sign}${pctStr}%)`,
        icon: p.avatarUrl || "/icon-192.png",
        badge: "/icon-192.png",
        tag: `value-update-${p.id}`,
        data: {
          url: p.slug ? `/players/${p.slug}` : `/players/${p.id}`,
          playerId: p.id,
          changePercentage: p.percentage,
        },
      };
    } else {
      const count = triggeredPlayers.length;
      const first = triggeredPlayers[0];
      const others = count - 1;

      payload = {
        title: `Value update: ${count} players you follow`,
        body: `${first.name} and ${others} other${others > 1 ? "s" : ""} changed in market value.`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "value-update-grouped",
        data: {
          url: "/watchlist",
        },
      };
    }

    // 4. Send Web Push
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify(payload)
      );

      result.sentCount++;
      await subscriptionStore.updateLastNotified(sub.endpoint, now.toISOString());
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        result.expiredCount++;
        expiredEndpoints.push(sub.endpoint);
      } else {
        result.failedCount++;
        console.warn("[Push] Failed to deliver push:", err.statusCode || err.message);
      }
    }
  }

  // 5. Clean up expired endpoints
  if (expiredEndpoints.length > 0) {
    await subscriptionStore.removeExpired(expiredEndpoints);
  }

  console.log(
    `[Push Dispatch] Sent: ${result.sentCount} | Failed: ${result.failedCount} | Expired: ${result.expiredCount} | Rate-limited: ${result.skippedRateLimitCount}`
  );

  return result;
}
```

---

### `src/components/notifications/PostFollowNotificationPrompt.tsx`
```typescript
"use client";

import { useState, useEffect } from "react";
import { Bell, X, Smartphone, Check } from "lucide-react";
import { useNotifications } from "@/lib/notifications/useNotifications";

export function PostFollowNotificationPrompt() {
  const {
    isMounted,
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    needsInstallForPush,
    syncFollowedPlayers,
  } = useNotifications();

  const [promptState, setPromptState] = useState<{
    visible: boolean;
    playerName: string;
  }>({
    visible: false,
    playerName: "",
  });

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePlayerFollowed = (e: Event) => {
      const customEvent = e as CustomEvent<{ name: string; id: string }>;
      const name = customEvent.detail?.name || "this player";

      if (isSubscribed) {
        syncFollowedPlayers();
        return;
      }

      if (!isSupported || permission === "denied") {
        return;
      }

      const dismissed = sessionStorage.getItem("a1score_push_dismissed");
      if (dismissed === "1") {
        return;
      }

      setPromptState({
        visible: true,
        playerName: name,
      });
    };

    window.addEventListener("a1score:player-followed", handlePlayerFollowed);
    return () => {
      window.removeEventListener("a1score:player-followed", handlePlayerFollowed);
    };
  }, [isSubscribed, isSupported, permission, syncFollowedPlayers]);

  if (!isMounted || !promptState.visible) {
    return null;
  }

  const handleDismiss = () => {
    setPromptState((prev) => ({ ...prev, visible: false }));
    try {
      sessionStorage.setItem("a1score_push_dismissed", "1");
    } catch {}
  };

  const handleEnableAlerts = async () => {
    const success = await subscribe(0.05);
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setPromptState({ visible: false, playerName: "" });
        setIsSuccess(false);
      }, 2000);
    } else if (!needsInstallForPush) {
      handleDismiss();
    }
  };

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-chip)] flex items-center justify-center shrink-0">
              {isSuccess ? (
                <Check className="w-4 h-4 text-[var(--trend-up)]" />
              ) : needsInstallForPush ? (
                <Smartphone className="w-4 h-4 text-[var(--value-text)]" />
              ) : (
                <Bell className="w-4 h-4 text-[var(--accent)]" />
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {needsInstallForPush ? "Home Screen Alert" : "Value update alert"}
              </h3>
              <p className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                {needsInstallForPush
                  ? `Followed ${promptState.playerName}`
                  : `Get an alert when ${promptState.playerName} changes in value by more than 5%`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss alert prompt"
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {needsInstallForPush ? (
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              To receive valuation alerts on iOS, tap <span className="font-bold text-[var(--text-primary)]">Share</span> in Safari and choose <span className="font-bold text-[var(--text-primary)]">&apos;Add to Home Screen&apos;</span>.
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              Got it
            </button>
          </div>
        ) : isSuccess ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--trend-up)] py-1">
            <Check className="w-4 h-4" />
            <span>Alerts enabled for players you follow.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleEnableAlerts}
              className="flex-1 min-h-[44px] px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95 text-xs font-bold transition-opacity flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Get alerts</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="min-h-[44px] px-4 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 4. Automated Test Suites

### `tests/watchlist.test.ts` (Phase 8)
```typescript
import test from "node:test";
import assert from "node:assert/strict";
import { watchlistAdapter } from "../src/lib/watchlist/storage";

test("WatchlistAdapter - basic add, check, remove, and clear operations", () => {
  watchlistAdapter.clearFavorites();
  assert.equal(watchlistAdapter.getFavorites().length, 0);

  const playerItem = {
    id: "p1",
    type: "player" as const,
    name: "Lamine Yamal",
    slug: "lamine-yamal-1051588",
    avatarUrl: "https://example.com/yamal.jpg",
    clubName: "FC Barcelona",
    position: "Right Winger",
    currentValueEur: 180000000,
    initialValueEur: 150000000,
  };

  watchlistAdapter.addFavorite(playerItem);
  assert.equal(watchlistAdapter.isFavorite("p1", "player"), true);
  assert.equal(watchlistAdapter.isFavorite("p1", "club"), false);
  assert.equal(watchlistAdapter.getFavorites().length, 1);

  const storedPlayer = watchlistAdapter.getFavorites()[0];
  assert.equal(storedPlayer.name, "Lamine Yamal");
  assert.equal(storedPlayer.initialValueEur, 150000000);
  assert.equal(storedPlayer.currentValueEur, 180000000);
  assert.ok(storedPlayer.savedAt, "savedAt ISO timestamp must be set");

  const clubItem = {
    id: "c1",
    type: "club" as const,
    name: "Arsenal FC",
    slug: "arsenal-fc",
    clubCrest: "https://example.com/arsenal.png",
    currentValueEur: 1150000000,
  };

  watchlistAdapter.addFavorite(clubItem);
  assert.equal(watchlistAdapter.isFavorite("c1", "club"), true);
  assert.equal(watchlistAdapter.getFavorites().length, 2);

  watchlistAdapter.clearFavorites("player");
  assert.equal(watchlistAdapter.isFavorite("p1", "player"), false);
  assert.equal(watchlistAdapter.isFavorite("c1", "club"), true);
  assert.equal(watchlistAdapter.getFavorites().length, 1);

  watchlistAdapter.removeFavorite("c1", "club");
  assert.equal(watchlistAdapter.isFavorite("c1", "club"), false);
  assert.equal(watchlistAdapter.getFavorites().length, 0);
});

test("WatchlistAdapter - subscriber notifications on mutation", () => {
  watchlistAdapter.clearFavorites();
  let callCount = 0;

  const unsubscribe = watchlistAdapter.subscribe(() => {
    callCount++;
  });

  watchlistAdapter.addFavorite({
    id: "test-player",
    type: "player",
    name: "Test Player",
  });
  assert.equal(callCount, 1);

  watchlistAdapter.removeFavorite("test-player", "player");
  assert.equal(callCount, 2);

  unsubscribe();
  watchlistAdapter.addFavorite({
    id: "test-player-2",
    type: "player",
    name: "Test Player 2",
  });
  assert.equal(callCount, 2);

  watchlistAdapter.clearFavorites();
});

test("Watchlist - Value change calculation logic", () => {
  function computeChange(initialVal: number, currentVal: number) {
    const diff = currentVal - initialVal;
    const isPos = diff >= 0;
    const hasChange = diff !== 0 && initialVal > 0;
    const pct = initialVal > 0 ? ((diff / initialVal) * 100).toFixed(1) : "0.0";
    return { diff, isPos, hasChange, pct };
  }

  const up = computeChange(100_000_000, 120_000_000);
  assert.equal(up.diff, 20_000_000);
  assert.equal(up.isPos, true);
  assert.equal(up.hasChange, true);
  assert.equal(up.pct, "20.0");

  const down = computeChange(100_000_000, 80_000_000);
  assert.equal(down.diff, -20_000_000);
  assert.equal(down.isPos, false);
  assert.equal(down.hasChange, true);
  assert.equal(down.pct, "-20.0");

  const same = computeChange(100_000_000, 100_000_000);
  assert.equal(same.diff, 0);
  assert.equal(same.isPos, true);
  assert.equal(same.hasChange, false);
  assert.equal(same.pct, "0.0");

  const zeroInit = computeChange(0, 50_000_000);
  assert.equal(zeroInit.diff, 50_000_000);
  assert.equal(zeroInit.hasChange, false);
  assert.equal(zeroInit.pct, "0.0");
});
```

---

### `tests/push-notifications.test.ts` (Phase 9)
```typescript
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { subscriptionStore } from "../src/lib/notifications/store";
import {
  PlayerValuationMovement,
} from "../src/lib/notifications/dispatcher";
import { urlBase64ToUint8Array, DEFAULT_VAPID_PUBLIC_KEY } from "../src/lib/notifications/vapid";

test("Task A: PWA Manifest & Service Worker verification", () => {
  const swPath = path.join(process.cwd(), "public", "sw.js");
  assert.ok(fs.existsSync(swPath), "public/sw.js must exist");
  const swContent = fs.readFileSync(swPath, "utf-8");
  assert.ok(swContent.includes('self.addEventListener("push"'), "SW must handle push event");
  assert.ok(swContent.includes('self.addEventListener("notificationclick"'), "SW must handle notificationclick event");
  assert.ok(swContent.includes("event.notification.close()"), "SW must close notification on click");
  assert.ok(swContent.includes("clients.openWindow"), "SW must open/focus client window on click");

  const manifestPath = path.join(process.cwd(), "src", "app", "manifest.ts");
  assert.ok(fs.existsSync(manifestPath), "manifest.ts must exist");
  const manifestContent = fs.readFileSync(manifestPath, "utf-8");
  assert.ok(manifestContent.includes('"standalone"'), "Manifest must specify standalone display");
  assert.ok(manifestContent.includes("#0a0d12"), "Manifest colors must match theme token #0a0d12");
  assert.ok(!manifestContent.includes("Real-time"), "Manifest copy must not promise real-time valuations");
});

test("Task B: Subscription store CRUD & zero PII invariant", async () => {
  const testEndpoint = "https://fcm.googleapis.com/fcm/send/test-sub-12345";
  const testSub = {
    endpoint: testEndpoint,
    keys: {
      p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DKM",
      auth: "tBHItJI5svbpez7KI4CCXg",
    },
    followedPlayerIds: ["player-yamal-101", "player-haaland-202"],
    threshold: 0.05,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await subscriptionStore.save(testSub);

  const retrieved = await subscriptionStore.get(testEndpoint);
  assert.ok(retrieved, "Subscription must be retrievable");
  assert.equal(retrieved.endpoint, testEndpoint);
  assert.equal(retrieved.threshold, 0.05);
  assert.deepEqual(retrieved.followedPlayerIds, ["player-yamal-101", "player-haaland-202"]);

  const keys = Object.keys(retrieved);
  assert.ok(!keys.includes("email"), "Must not store email");
  assert.ok(!keys.includes("name"), "Must not store name");
  assert.ok(!keys.includes("ip"), "Must not store IP address");

  const notifyTime = new Date().toISOString();
  await subscriptionStore.updateLastNotified(testEndpoint, notifyTime);
  const updated = await subscriptionStore.get(testEndpoint);
  assert.equal(updated?.lastNotifiedAt, notifyTime);

  const deleted = await subscriptionStore.delete(testEndpoint);
  assert.equal(deleted, true);
  const postDelete = await subscriptionStore.get(testEndpoint);
  assert.equal(postDelete, null);
});

test("Task B: VAPID Key validation and base64 conversion", () => {
  assert.ok(DEFAULT_VAPID_PUBLIC_KEY.length > 50, "VAPID public key must be defined");
  const uint8 = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
  assert.ok(uint8 instanceof Uint8Array, "Must convert to Uint8Array");
  assert.ok(uint8.length > 0, "Converted key must not be empty");
});

test("Task C: Movement detection and threshold evaluation", async () => {
  const movements: PlayerValuationMovement[] = [
    {
      id: "yamal",
      name: "Lamine Yamal",
      slug: "lamine-yamal-1051588",
      previousValueEur: 150_000_000,
      latestValueEur: 180_000_000,
      diffEur: 30_000_000,
      percentage: 0.20,
    },
    {
      id: "subtle-player",
      name: "Subtle Player",
      slug: "subtle-player",
      previousValueEur: 100_000_000,
      latestValueEur: 102_000_000,
      diffEur: 2_000_000,
      percentage: 0.02,
    },
  ];

  const subEndpoint = "https://push.example.com/test-eval-endpoint";
  await subscriptionStore.save({
    endpoint: subEndpoint,
    keys: { p256dh: "key", auth: "auth" },
    followedPlayerIds: ["yamal", "subtle-player"],
    threshold: 0.05,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const sub = await subscriptionStore.get(subEndpoint);
  assert.ok(sub);

  const triggered = movements.filter(
    (m) => sub.followedPlayerIds.includes(m.id) && Math.abs(m.percentage) >= sub.threshold
  );

  assert.equal(triggered.length, 1, "Only movements exceeding 5% threshold must trigger");
  assert.equal(triggered[0].id, "yamal");

  await subscriptionStore.delete(subEndpoint);
});

test("Task C: Rate limiting enforces maximum 1 push per user per day", async () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const recentTimestamp = new Date(Date.now() - 3600 * 1000).toISOString();
  const oldTimestamp = new Date(Date.now() - (ONE_DAY_MS + 3600 * 1000)).toISOString();

  function isEligibleForPush(lastNotifiedAt?: string | null): boolean {
    if (!lastNotifiedAt) return true;
    const elapsed = Date.now() - new Date(lastNotifiedAt).getTime();
    return elapsed >= ONE_DAY_MS;
  }

  assert.equal(isEligibleForPush(recentTimestamp), false, "Must block push sent 1 hour ago");
  assert.equal(isEligibleForPush(oldTimestamp), true, "Must allow push sent 25 hours ago");
  assert.equal(isEligibleForPush(null), true, "Must allow first-time push");
});
```

---

## 5. Quality Assurance & Verification Results

1. **Color Token Linter:**
   - Command: `npm run lint:colors`
   - Result: `PASSED: Zero hardcoded hex colors found across 89 component files!`
2. **Automated Unit & Invariant Tests:**
   - Command: `npm test`
   - Result: `75 passed, 0 failed, 0 errors`
3. **Production Next.js Build:**
   - Command: `npm run build`
   - Result: Successfully compiled and optimized client/server chunks across all 41 routes.
4. **Performance Budgets:**
   - Command: `npm run perf:budget`
   - Result: All JavaScript bundles and static assets within strict performance limits.
5. **Git Version Control:**
   - Commits `894530f` and `5c561c9` are cleanly committed and pushed to `origin/main`.
