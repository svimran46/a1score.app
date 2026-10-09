"use client";

import React, { useState } from "react";
import { BarChart2, Crosshair } from "lucide-react";
import { Chip } from "@/components/ui";

interface StatsTabProps {
  match: any;
}

export function StatsTab({ match }: StatsTabProps) {
  const { stats = [], shotmap = {}, teams = {}, status = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};
  const shots = shotmap?.shots || [];

  const [activeCategory, setActiveCategory] = useState<string>("all");

  const statGroups: Array<{ title: string; key: string; stats: any[] }> = stats || [];
  const hasStats = statGroups.length > 0;

  // Flattened or filtered stats
  const displayedGroups =
    activeCategory === "all"
      ? statGroups
      : statGroups.filter((g) => g.key === activeCategory);

  if (!hasStats && shots.length === 0) {
    return (
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 sm:p-12 text-center space-y-3 shadow-xs">
        <BarChart2 className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
        <h4 className="text-base font-bold text-[var(--text-primary)]">No Match Statistics Available</h4>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
          {status?.isUpcoming
            ? "Detailed match statistics (possession, shots, passes, and xG) will track live once the fixture begins."
            : "Detailed statistical metrics are not recorded for this fixture."}
        </p>
      </div>
    );
  }

  // Calculate total xG for home and away from shots
  const homeShots = shots.filter((s: any) => s.teamId === homeTeam?.id);
  const awayShots = shots.filter((s: any) => s.teamId === awayTeam?.id);

  const homeXG = homeShots.reduce((acc: number, s: any) => acc + (s.expectedGoals || 0), 0);
  const awayXG = awayShots.reduce((acc: number, s: any) => acc + (s.expectedGoals || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Shot Map & Expected Goals (xG) Summary (if available) */}
      {shots.length > 0 && (
        <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-trend-up" />
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Shot Map & Expected Goals (xG)
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono font-bold tabular-nums">
              <span className="text-trend-up">
                {homeTeam?.name}: {homeXG.toFixed(2)} xG
              </span>
              <span className="text-info">
                {awayTeam?.name}: {awayXG.toFixed(2)} xG
              </span>
            </div>
          </div>

          {/* Half Pitch Visual for Shots */}
          <div className="relative w-full aspect-[2/1] rounded-2xl bg-gradient-to-b from-[var(--pitch-surface-alt)] to-[var(--pitch-surface)] border border-emerald-900/50 shadow-inner overflow-hidden p-3">
            {/* Goal Line & Box Markings */}
            <div className="absolute top-0 left-1/4 right-1/4 h-24 border-2 border-t-0 border-emerald-600/30 rounded-b-xl pointer-events-none" />
            <div className="absolute top-0 left-1/3 right-1/3 h-10 border-2 border-t-0 border-emerald-600/30 rounded-b-lg pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/40 rounded-full pointer-events-none" />

            {/* Shots Points */}
            {shots.map((shot: any, idx: number) => {
              const isHome = shot.teamId === homeTeam?.id;
              const posX = Math.min(Math.max((shot.y / 68) * 100, 5), 95);
              const posY = Math.min(Math.max(((105 - shot.x) / 105) * 100 * 1.8, 5), 90);

              const isGoal = shot.eventType === "Goal";

              return (
                <div
                  key={shot.id || idx}
                  title={`${shot.playerName || "Player"}: ${(shot.expectedGoals || 0).toFixed(
                    2
                  )} xG (${shot.eventType})`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer shadow-md ${
                    isGoal
                      ? "ring-2 ring-trend-up bg-trend-up text-accent-contrast font-black w-6 h-6 text-xs"
                      : isHome
                      ? "bg-trend-up/80 border border-white/60 w-4 h-4"
                      : "bg-info/80 border border-white/60 w-4 h-4"
                  }`}
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                >
                  {isGoal && "⚽"}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Grouped Match Statistics (Paired Bars with Explicit Numbers) */}
      {hasStats && (
        <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--divider)]">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[var(--value-text)]" />
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Head-to-Head Match Stats
              </h3>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <Chip
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
                className="text-xs min-h-[36px]"
              >
                All Stats
              </Chip>
              {statGroups.map((g) => (
                <Chip
                  key={g.key}
                  active={activeCategory === g.key}
                  onClick={() => setActiveCategory(g.key)}
                  className="text-xs min-h-[36px]"
                >
                  {g.title}
                </Chip>
              ))}
            </div>
          </div>

          {/* Stats Groups */}
          <div className="space-y-6 pt-1">
            {displayedGroups.map((group) => (
              <div key={group.key} className="space-y-3">
                <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {group.title}
                </h4>

                <div className="space-y-3">
                  {group.stats.map((stat: any, idx: number) => {
                    const rawHome = stat.stats?.[0] ?? stat.home ?? stat.homeValue;
                    const rawAway = stat.stats?.[1] ?? stat.away ?? stat.awayValue;

                    // Parse numerical values for bar ratios
                    const homeNum = parseFloat(String(rawHome).replace(/[^0-9.]/g, "")) || 0;
                    const awayNum = parseFloat(String(rawAway).replace(/[^0-9.]/g, "")) || 0;
                    const total = homeNum + awayNum;

                    const homePct = total > 0 ? Math.round((homeNum / total) * 100) : 50;
                    const awayPct = total > 0 ? 100 - homePct : 50;

                    const isHomeSuperior = homeNum > awayNum;
                    const isAwaySuperior = awayNum > homeNum;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2 text-xs sm:text-sm"
                      >
                        {/* Numbers row (never color alone: exact numbers prominent on both sides) */}
                        <div className="flex items-center justify-between font-bold">
                          <span
                            className={`tabular-nums font-mono text-sm sm:text-base ${
                              isHomeSuperior ? "text-trend-up font-extrabold" : "text-[var(--text-primary)]"
                            }`}
                          >
                            {rawHome ?? "0"}
                          </span>
                          <span className="text-[var(--text-muted)] text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-center px-2">
                            {stat.title}
                          </span>
                          <span
                            className={`tabular-nums font-mono text-sm sm:text-base ${
                              isAwaySuperior ? "text-info font-extrabold" : "text-[var(--text-primary)]"
                            }`}
                          >
                            {rawAway ?? "0"}
                          </span>
                        </div>

                        {/* Paired comparison bar */}
                        <div className="w-full h-2 rounded-full bg-[var(--bg-chip)] overflow-hidden flex">
                          {total === 0 ? (
                            <div className="w-full h-full bg-[var(--bg-chip)]" />
                          ) : (
                            <>
                              <div
                                className="h-full bg-trend-up transition-all duration-300"
                                style={{ width: `${homePct}%` }}
                                title={`${homeTeam?.name || "Home"}: ${homePct}%`}
                              />
                              <div
                                className="h-full bg-info transition-all duration-300"
                                style={{ width: `${awayPct}%` }}
                                title={`${awayTeam?.name || "Away"}: ${awayPct}%`}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
