"use client";

import { useState } from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getClubDisplayName } from "@/lib/data/clubs";
import type { MarketMover } from "@/lib/data/players";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, User, Shield } from "lucide-react";

interface MarketMoversProps {
  risers: MarketMover[];
  fallers: MarketMover[];
}

export function MarketMovers({ risers, fallers }: MarketMoversProps) {
  const [activeTab, setActiveTab] = useState<"risers" | "fallers">("risers");

  const displayedList = activeTab === "risers" ? risers : fallers;

  // Dynamic valuation revision date label derived from actual database records (D7)
  const latestDateRaw = risers[0]?.lastUpdated || fallers[0]?.lastUpdated;
  const latestRevisionLabel = latestDateRaw
    ? new Date(latestDateRaw).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : null;

  return (
    <div className="rounded-3xl glass-panel p-4 sm:p-8 border border-divider space-y-4 sm:space-y-6">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-divider gap-3 sm:gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
            <h2 className="text-xl font-black text-text-primary tracking-tight [text-wrap:balance]">
              Market Value Movers
            </h2>
            <span className="self-start sm:self-auto text-xs px-2.5 py-0.5 rounded-full font-bold bg-accent/10 text-value-text border border-accent/20 whitespace-nowrap">
              {latestRevisionLabel ? `Data as of ${latestRevisionLabel}` : "Data as of Latest Market Revision"}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 [text-wrap:balance]">
            Significant valuation shifts across Europe&apos;s top flight competitions vs previous market revision
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">
            Note: Updates are issued in periodic league-wide cycles, which can cause clustering from recently updated clubs.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-bg-card/90 p-1 rounded-2xl border border-divider text-xs font-bold shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("risers")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "risers"
                ? "bg-trend-up/20 text-trend-up border border-trend-up/30 shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Top Risers ({risers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("fallers")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "fallers"
                ? "bg-trend-down/20 text-trend-down border border-trend-down/30 shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Top Fallers ({fallers.length})
          </button>
        </div>
      </div>

      {/* Grid of Movers */}
      {displayedList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {displayedList.map((player, idx) => {
            const isGain = player.diff > 0;
            return (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="group rounded-2xl glass-panel glass-panel-hover p-3 sm:p-4 border border-divider/80 hover:border-accent/30 flex items-center justify-between gap-2.5 transition-all"
              >
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                  <span className="w-4 sm:w-5 text-center font-black text-text-muted text-xs tabular-nums shrink-0">
                    #{idx + 1}
                  </span>

                  {/* Photo */}
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-bg-chip shrink-0 overflow-hidden border border-divider/60">
                    <EntityImage
                      src={player.photoUrl}
                      alt=""
                      fill
                      sizes="48px"
                      entityType="player"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-text-primary tracking-tight truncate group-hover:text-value-text transition-colors">
                      {player.commonName || player.fullName}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-text-muted mt-0.5 truncate">
                      <span className="truncate" title={player.currentClub?.name || "Club"}>
                        {player.currentClub ? getClubDisplayName(player.currentClub) : "Club"}
                      </span>
                      <span className="shrink-0">•</span>
                      <span className="shrink-0">{player.position}</span>
                    </div>
                  </div>
                </div>

                {/* Valuations and Delta Badge */}
                <div className="flex flex-col items-end shrink-0 text-right space-y-0.5">
                  <span className="text-xs sm:text-sm font-black text-value-text figure tabular-nums whitespace-nowrap">
                    {formatCompactEur(player.latestValue)}
                  </span>

                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums whitespace-nowrap ${
                      isGain
                        ? "bg-trend-up/15 text-trend-up border border-trend-up/30"
                        : "bg-trend-down/15 text-trend-down border border-trend-down/30"
                    }`}
                  >
                    {isGain ? (
                      <ArrowUpRight className="w-3 h-3 shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 shrink-0" />
                    )}
                    <span>
                      {isGain ? "+" : ""}
                      {formatCompactEur(player.diff)} ({Math.abs(player.percentage).toFixed(0)}%)
                    </span>
                  </span>

                  <span className="text-[10px] text-text-muted tabular-nums whitespace-nowrap">
                    vs prev: {formatCompactEur(player.prevValue)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-text-muted text-xs">
          No market value movers recorded.
        </div>
      )}
    </div>
  );
}
