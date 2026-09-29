"use client";

import { useState } from "react";
import { BarChart2, Target, Crosshair } from "lucide-react";
import { EntityImage } from "@/components/EntityImage";

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
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-8 sm:p-12 text-center space-y-3 shadow-xl">
        <BarChart2 className="w-10 h-10 text-slate-500 mx-auto" />
        <h4 className="text-base font-bold text-white">No Match Statistics Recorded</h4>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          {status?.isUpcoming
            ? "Official match statistics will begin tracking live once the referee blows the whistle."
            : "No official statistical data is available for this match."}
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
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Shot Map & Expected Goals (xG) Summary (if available) */}
      {shots.length > 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Shot Map &amp; Expected Goals (xG)
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono font-bold">
              <span className="text-emerald-400">
                {homeTeam?.name}: {homeXG.toFixed(2)} xG
              </span>
              <span className="text-blue-400">
                {awayTeam?.name}: {awayXG.toFixed(2)} xG
              </span>
            </div>
          </div>

          {/* Half Pitch Visual for Shots */}
          <div className="relative w-full aspect-[2/1] rounded-2xl bg-gradient-to-b from-[#122818] to-[#0a180e] border border-emerald-900/50 shadow-inner overflow-hidden p-3">
            {/* Goal Line & Box Markings */}
            <div className="absolute top-0 left-1/4 right-1/4 h-24 border-2 border-t-0 border-emerald-600/30 rounded-b-xl pointer-events-none" />
            <div className="absolute top-0 left-1/3 right-1/3 h-10 border-2 border-t-0 border-emerald-600/30 rounded-b-lg pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/40 rounded-full pointer-events-none" />

            {/* Shots Points */}
            {shots.map((shot: any, idx: number) => {
              const isHome = shot.teamId === homeTeam?.id;
              // Map x (0-105) and y (0-68) to pitch percentages
              const posX = Math.min(Math.max((shot.y / 68) * 100, 5), 95);
              const posY = Math.min(Math.max(((105 - shot.x) / 105) * 100 * 1.8, 5), 90);

              const isGoal = shot.eventType === "Goal";
              const xgSize = Math.max(Math.min((shot.expectedGoals || 0.1) * 32, 24), 8);

              return (
                <div
                  key={shot.id || idx}
                  title={`${shot.playerName || "Player"}: ${(shot.expectedGoals || 0).toFixed(
                    2
                  )} xG (${shot.eventType})`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer shadow-md ${
                    isGoal
                      ? "ring-2 ring-emerald-400 bg-emerald-400 text-slate-950 font-black"
                      : isHome
                      ? "bg-emerald-500/80 border border-white/60"
                      : "bg-blue-500/80 border border-white/60"
                  }`}
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    width: `${xgSize}px`,
                    height: `${xgSize}px`,
                  }}
                >
                  {isGoal && <span className="text-[9px]">⚽</span>}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Goal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {homeTeam?.name || "Home"} Shot
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              {awayTeam?.name || "Away"} Shot
            </span>
            <span className="text-[10px] text-slate-500 italic">
              • Circle size proportional to expected goal probability (xG)
            </span>
          </div>
        </div>
      )}

      {/* 2. Stat Categories Filter Pills */}
      {statGroups.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeCategory === "all"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
                : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Stats
          </button>
          {statGroups.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => setActiveCategory(group.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeCategory === group.key
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {group.title}
            </button>
          ))}
        </div>
      )}

      {/* 3. Paired Stat Bars */}
      <div className="space-y-6">
        {displayedGroups.map((group) => (
          <div
            key={group.key}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="text-slate-300">{homeTeam?.name}</span>
                <span className="text-slate-500">vs</span>
                <span className="text-slate-300">{awayTeam?.name}</span>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {(group.stats || []).map((stat: any, idx: number) => {
                const homeVal = Number(stat.stats?.[0]) || 0;
                const awayVal = Number(stat.stats?.[1]) || 0;
                const total = homeVal + awayVal;

                // Neutral bar when 0 vs 0 (no fake 50/50)
                const isZeroZero = total === 0;
                const homePct = total > 0 ? Math.round((homeVal / total) * 100) : 0;
                const awayPct = total > 0 ? 100 - homePct : 0;

                const isHomeLeading = homeVal > awayVal;
                const isAwayLeading = awayVal > homeVal;

                return (
                  <div key={idx} className="space-y-1.5 text-xs sm:text-sm">
                    {/* Stat labels */}
                    <div className="flex items-center justify-between font-bold tabular-nums">
                      <span
                        className={
                          isHomeLeading
                            ? "text-emerald-400 font-extrabold text-sm sm:text-base"
                            : "text-slate-300"
                        }
                      >
                        {stat.stats?.[0]}
                      </span>
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider text-center max-w-[200px] truncate">
                        {stat.title}
                      </span>
                      <span
                        className={
                          isAwayLeading
                            ? "text-emerald-400 font-extrabold text-sm sm:text-base"
                            : "text-slate-300"
                        }
                      >
                        {stat.stats?.[1]}
                      </span>
                    </div>

                    {/* Proportional paired bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                      {isZeroZero ? (
                        <div className="w-full h-full bg-slate-800" title="0 - 0" />
                      ) : (
                        <>
                          <div
                            className={`h-full transition-all duration-300 ${
                              isHomeLeading ? "bg-emerald-500" : "bg-slate-600"
                            }`}
                            style={{ width: `${homePct}%` }}
                          />
                          <div
                            className={`h-full transition-all duration-300 ${
                              isAwayLeading ? "bg-blue-500" : "bg-slate-700"
                            }`}
                            style={{ width: `${awayPct}%` }}
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
  );
}
