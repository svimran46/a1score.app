"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ArrowRight, User, TrendingUp, TrendingDown } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";
import { formatCompactEur } from "@/lib/utils";

export function WatchlistRightRailCard() {
  const { isMounted, playerFavorites } = useWatchlist();

  if (!isMounted) {
    return (
      <div className="bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] shadow-xs animate-pulse">
        <div className="h-4 w-28 bg-[var(--bg-chip)] rounded mb-3" />
        <div className="h-12 bg-[var(--bg-chip)] rounded" />
      </div>
    );
  }

  const topPlayers = playerFavorites.slice(0, 5);

  return (
    <div className="bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] shadow-xs">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Your Watchlist
          </h2>
        </div>
        <Link
          href="/watchlist"
          className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
        >
          <span>All</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {topPlayers.length === 0 ? (
        <div className="p-3 text-center rounded-xl bg-bg-elevated/50">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            You&apos;re not following anyone yet. Tap the star on a player or club to add them.
          </p>
          <Link
            href="/values"
            className="inline-block mt-2 text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            Browse market values
          </Link>
        </div>
      ) : (
        <div className="flex flex-col space-y-1">
          {topPlayers.map((player) => {
            const currentVal = player.currentValueEur || player.initialValueEur || 0;
            const initialVal = player.initialValueEur || currentVal;
            const diff = currentVal - initialVal;
            const isPos = diff >= 0;
            const hasChange = diff !== 0 && initialVal > 0;
            const pct = initialVal > 0 ? Math.abs((diff / initialVal) * 100).toFixed(1) : "0.0";
            const href = player.slug ? `/players/${player.slug}` : `/players/${player.id}`;

            return (
              <Link
                key={player.id}
                href={href}
                className="group flex items-center justify-between gap-2.5 p-2 -mx-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-chip)] overflow-hidden shrink-0 relative flex items-center justify-center">
                    {player.avatarUrl ? (
                      <Image
                        src={player.avatarUrl}
                        alt={player.name}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <User className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors">
                      {player.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      {player.clubName || "Free Agent"}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[var(--value-text)] figure tabular-nums">
                    {currentVal > 0 ? formatCompactEur(currentVal) : "—"}
                  </div>
                  {hasChange && (
                    <div
                      className={`flex items-center justify-end gap-0.5 text-[10px] font-bold tabular-nums ${
                        isPos ? "text-[var(--trend-up)]" : "text-[var(--trend-down)]"
                      }`}
                    >
                      {isPos ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      <span>{isPos ? `+${pct}%` : `-${pct}%`}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
