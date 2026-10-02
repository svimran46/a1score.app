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

      {/* Storage Warning Banner (if private mode or blocked storage) */}
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
