"use client";

import { useState } from "react";
import { formatCompactEur } from "@/lib/utils";
import { Users, LayoutGrid, Shield, Sparkles } from "lucide-react";

interface StarterPlayer {
  id: number | string;
  name: string;
  firstName?: string;
  lastName?: string;
  shirtNumber?: string | number;
  marketValue?: number | null;
  positionId?: number;
  verticalLayout?: { x: number; y: number };
  horizontalLayout?: { x: number; y: number };
}

interface TeamLineup {
  name?: string;
  formation?: string;
  starters: StarterPlayer[];
  totalStarterMarketValue?: number | null;
  imageUrl?: string | null;
  averageStarterAge?: number | null;
}

interface PitchLineupProps {
  homeTeam: TeamLineup;
  awayTeam: TeamLineup;
  homeName: string;
  awayName: string;
}

export function PitchLineup({
  homeTeam,
  awayTeam,
  homeName,
  awayName,
}: PitchLineupProps) {
  const [viewMode, setViewMode] = useState<"pitch" | "list">("pitch");
  const [activeTeamTab, setActiveTeamTab] = useState<"home" | "away">("home");

  const activeTeam = activeTeamTab === "home" ? homeTeam : awayTeam;
  const activeTeamName = activeTeamTab === "home" ? homeName : awayName;

  const homeStarters = homeTeam.starters || [];
  const awayStarters = awayTeam.starters || [];

  const hasLineups = homeStarters.length > 0 || awayStarters.length > 0;

  if (!hasLineups) {
    return (
      <div className="rounded-3xl glass-panel p-8 border border-slate-800 text-center space-y-2">
        <Users className="w-8 h-8 text-slate-500 mx-auto" />
        <h4 className="text-sm font-semibold text-white">Lineups Pending Confirmation</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Tactical formations and confirmed starting XIs will be synchronized directly from the match officials prior to kickoff.
        </p>
      </div>
    );
  }

  // Calculate total market values if not given
  const homeTotalVal =
    homeTeam.totalStarterMarketValue ||
    homeStarters.reduce((acc, p) => acc + (p.marketValue || 0), 0);

  const awayTotalVal =
    awayTeam.totalStarterMarketValue ||
    awayStarters.reduce((acc, p) => acc + (p.marketValue || 0), 0);

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 space-y-6">
      {/* Header with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-pitch-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Confirmed Tactical Lineups
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-pitch-500/15 text-pitch-400 border border-pitch-500/30">
              Starting XI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed formations with on-pitch player market valuations
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("pitch")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                viewMode === "pitch"
                  ? "bg-pitch-500/20 text-pitch-400 border border-pitch-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Pitch View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                viewMode === "list"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Pitch View */}
      {viewMode === "pitch" && (
        <div className="space-y-4">
          {/* Team Switcher Tabs for Pitch */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTeamTab("home")}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  activeTeamTab === "home"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>{homeName}</span>
                {homeTeam.formation && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {homeTeam.formation}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTeamTab("away")}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  activeTeamTab === "away"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>{awayName}</span>
                {awayTeam.formation && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {awayTeam.formation}
                  </span>
                )}
              </button>
            </div>

            {/* Team Starter Valuation Summary */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Starting XI Value
                </span>
                <span className="text-base font-black text-amber-400 tabular-nums">
                  {formatCompactEur(activeTeamTab === "home" ? homeTotalVal : awayTotalVal)}
                </span>
              </div>
            </div>
          </div>

          {/* Tactical Pitch Board */}
          <div className="relative w-full h-[520px] rounded-3xl bg-gradient-to-b from-emerald-950/70 via-ink-950 to-emerald-950/80 border-2 border-emerald-500/20 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
            {/* Pitch Markings SVG overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer boundary */}
              <rect
                x="5%"
                y="5%"
                width="90%"
                height="90%"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                rx="8"
              />
              {/* Halfway line */}
              <line
                x1="5%"
                y1="50%"
                x2="95%"
                y2="50%"
                stroke="white"
                strokeWidth="1.5"
              />
              {/* Center Circle */}
              <circle
                cx="50%"
                cy="50%"
                r="12%"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              <circle cx="50%" cy="50%" r="2" fill="white" />
              {/* Top Penalty Area (Opponent) */}
              <rect
                x="28%"
                y="5%"
                width="44%"
                height="18%"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              {/* Bottom Penalty Area (Our Goal) */}
              <rect
                x="28%"
                y="77%"
                width="44%"
                height="18%"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              {/* Bottom 6-yard box */}
              <rect
                x="38%"
                y="89%"
                width="24%"
                height="6%"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              {/* Penalty Arc */}
              <path
                d="M 42% 77% A 10% 8% 0 0 1 58% 77%"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* Tactical Starters Layout */}
            <div className="relative w-full h-full">
              {activeTeam.starters.map((starter) => {
                // If FotMob provides verticalLayout coordinates
                // verticalLayout: x: [0..1] (horizontal), y: [0..1] (vertical: 0 top opponent, 1 bottom GK)
                let leftPct = 50;
                let topPct = 50;

                if (starter.verticalLayout) {
                  leftPct = Math.round(starter.verticalLayout.x * 100);
                  topPct = Math.round(starter.verticalLayout.y * 100);
                }

                // Invert so Goalkeeper is anchored at the bottom (88%)
                const adjustedTop = topPct > 80 ? 88 : topPct < 20 ? 15 : topPct;

                const displayName =
                  starter.lastName ||
                  starter.name.split(" ").slice(-1)[0] ||
                  starter.name;

                return (
                  <div
                    key={starter.id}
                    className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform hover:scale-110 z-10"
                    style={{ left: `${leftPct}%`, top: `${adjustedTop}%` }}
                  >
                    {/* Shirt Number Badge */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/95 border-2 border-amber-500/80 shadow-lg flex items-center justify-center text-white font-black text-xs sm:text-sm tabular-nums group-hover:border-amber-400 group-hover:shadow-amber-500/30">
                      {starter.shirtNumber || "-"}
                    </div>

                    {/* Player Surname */}
                    <span className="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-[10px] sm:text-[11px] font-bold text-white whitespace-nowrap shadow max-w-[90px] truncate text-center">
                      {displayName}
                    </span>

                    {/* Market Value Pill */}
                    {starter.marketValue ? (
                      <span className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 tabular-nums">
                        {formatCompactEur(starter.marketValue)}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Home Starters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span>{homeName} Starting XI</span>
                {homeTeam.formation && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {homeTeam.formation}
                  </span>
                )}
              </div>
              {homeTotalVal > 0 && (
                <span className="text-amber-400 font-extrabold tabular-nums">
                  {formatCompactEur(homeTotalVal)}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {homeStarters.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/40 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center font-bold text-slate-500 tabular-nums">
                      {player.shirtNumber || "-"}
                    </span>
                    <span className="font-semibold text-white truncate">
                      {player.name}
                    </span>
                  </div>
                  {player.marketValue ? (
                    <span className="text-[11px] font-bold text-amber-400 tabular-nums">
                      {formatCompactEur(player.marketValue)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Away Starters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span>{awayName} Starting XI</span>
                {awayTeam.formation && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {awayTeam.formation}
                  </span>
                )}
              </div>
              {awayTotalVal > 0 && (
                <span className="text-amber-400 font-extrabold tabular-nums">
                  {formatCompactEur(awayTotalVal)}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {awayStarters.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/40 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center font-bold text-slate-500 tabular-nums">
                      {player.shirtNumber || "-"}
                    </span>
                    <span className="font-semibold text-white truncate">
                      {player.name}
                    </span>
                  </div>
                  {player.marketValue ? (
                    <span className="text-[11px] font-bold text-amber-400 tabular-nums">
                      {formatCompactEur(player.marketValue)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
