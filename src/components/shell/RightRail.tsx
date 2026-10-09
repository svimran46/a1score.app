"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight, Newspaper, ExternalLink } from "lucide-react";
import { formatCompactEur } from "@/lib/utils";
import { NewsItem } from "@/types/news";
import { formatRelativeTime } from "@/lib/data/news";
import { WatchlistRightRailCard } from "@/components/watchlist/WatchlistRightRailCard";

export interface MoverItem {
  id: string;
  fullName: string;
  slug: string;
  position?: string;
  currentClub?: {
    name: string;
    logoUrl?: string | null;
  } | null;
  latestValue: number;
  prevValue?: number;
  diff: number;
  percentage: number;
}

export interface MoversData {
  risers: MoverItem[];
  fallers: MoverItem[];
}

export function RightRail({
  movers,
  news,
}: {
  movers?: MoversData;
  news?: NewsItem[];
}) {
  const [activeTab, setActiveTab] = useState<"risers" | "fallers">("risers");

  const risers = movers?.risers?.slice(0, 5) ?? [];
  const fallers = movers?.fallers?.slice(0, 5) ?? [];
  const currentMovers = activeTab === "risers" ? risers : fallers;
  const displayNews = news?.slice(0, 4) ?? [];

  return (
    <aside aria-label="News and market value movers" className="flex flex-col gap-4 w-full">
      {/* Watchlist Widget Card */}
      <WatchlistRightRailCard />

      {/* News Widget Card */}
      <div className="bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Latest News
            </h2>
          </div>
          <Link
            href="/news"
            className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
          >
            <span>All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-col space-y-2">
          {displayNews.length > 0 ? (
            displayNews.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-2.5 -mx-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--value-text)]">
                  <span className="truncate max-w-[170px]">
                    {item.entityTags?.[0]?.name || item.tags?.[0] || "Football"}
                  </span>
                  <span className="text-[var(--text-muted)] font-normal shrink-0">
                    {formatRelativeTime(item.publishedAt)}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] line-clamp-2 mt-0.5 leading-snug transition-colors">
                  {item.title}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mt-1">
                  <span>{item.source}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:text-[var(--accent)] transition-colors" />
                </div>
              </a>
            ))
          ) : (
            <p className="px-1 py-2 text-xs text-[var(--text-muted)]">
              Headlines are unavailable right now.
            </p>
          )}
        </div>
      </div>

      {/* Value Movers Card */}
      <div className="bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] shadow-xs">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Value Movers
          </h2>
          <Link
            href="/values"
            className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
          >
            <span>All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Risers / Fallers Toggle */}
        <div className="flex items-center p-1 bg-[var(--bg-chip)] rounded-[var(--chip-radius)] my-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("risers")}
            aria-pressed={activeTab === "risers"}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] lg:min-h-[32px] rounded-[var(--chip-radius)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              activeTab === "risers"
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[var(--trend-up)]" />
            <span>Risers</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("fallers")}
            aria-pressed={activeTab === "fallers"}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] lg:min-h-[32px] rounded-[var(--chip-radius)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              activeTab === "fallers"
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-[var(--trend-down)]" />
            <span>Fallers</span>
          </button>
        </div>

        {/* Top 5 list */}
        <div className="flex flex-col space-y-1">
          {currentMovers.length === 0 && (
            <p className="px-1 py-2 text-xs text-[var(--text-muted)]">
              No value changes recorded yet.
            </p>
          )}
          {currentMovers.map((player, idx) => {
            const isRiser = player.diff >= 0;
            // Sign + arrow + colour: direction never relies on colour alone
            const sign = isRiser ? "+" : "\u2212";
            const pct = typeof player.percentage === "number" ? Math.abs(player.percentage).toFixed(1) : "0.0";

            return (
              <Link
                key={player.id || idx}
                href={`/players/${player.slug}`}
                className="group flex items-center justify-between p-2 -mx-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <span className="text-xs font-bold text-[var(--text-muted)] w-4 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors">
                      {player.fullName}
                    </div>
                    {player.currentClub?.name && (
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {player.currentClub.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[var(--value-text)] figure tabular-nums">
                    {formatCompactEur(player.latestValue)}
                  </div>
                  <div
                    className={`text-[10px] font-bold flex items-center justify-end gap-0.5 tabular-nums ${
                      isRiser ? "text-[var(--trend-up)]" : "text-[var(--trend-down)]"
                    }`}
                  >
                    {isRiser ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    <span>
                      {sign}
                      {pct}%
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
