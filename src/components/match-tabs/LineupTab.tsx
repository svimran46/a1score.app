"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCompactEur } from "@/lib/utils";
import { EntityImage } from "@/components/EntityImage";
import { Users, LayoutGrid, Shield, Sparkles, User, ExternalLink, X } from "lucide-react";

interface LineupTabProps {
  match: any;
}

export function LineupTab({ match }: LineupTabProps) {
  const { lineup = {}, teams = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  const homeLineup = lineup?.homeTeam || {};
  const awayLineup = lineup?.awayTeam || {};

  const homeStarters = homeLineup.starters || [];
  const awayStarters = awayLineup.starters || [];
  const homeSubs = homeLineup.subs || [];
  const awaySubs = awayLineup.subs || [];
  const homeCoach = homeLineup.coach;
  const awayCoach = awayLineup.coach;

  const [activeSide, setActiveSide] = useState<"home" | "away">("home");
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  const hasLineups = homeStarters.length > 0 || awayStarters.length > 0;

  if (!hasLineups) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-8 sm:p-12 text-center space-y-3 shadow-xl">
        <Users className="w-10 h-10 text-slate-500 mx-auto" />
        <h4 className="text-base font-bold text-white">Lineups Pending Confirmation</h4>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Lineups are usually confirmed about an hour before kickoff. Tactical formations, confirmed starting XIs, and Value-to-Pitch metrics will be published here.
        </p>
      </div>
    );
  }

  const homeTotalVal =
    homeLineup.totalStarterMarketValue ||
    homeStarters.reduce((acc: number, p: any) => acc + (p.marketValue || 0), 0);
  const awayTotalVal =
    awayLineup.totalStarterMarketValue ||
    awayStarters.reduce((acc: number, p: any) => acc + (p.marketValue || 0), 0);

  const currentStarters = activeSide === "home" ? homeStarters : awayStarters;
  const currentSubs = activeSide === "home" ? homeSubs : awaySubs;
  const currentCoach = activeSide === "home" ? homeCoach : awayCoach;
  const currentFormation = activeSide === "home" ? homeLineup.formation : awayLineup.formation;
  const currentTeamName = activeSide === "home" ? homeTeam?.name : awayTeam?.name;
  const currentTeamTotalVal = activeSide === "home" ? homeTotalVal : awayTotalVal;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Value-to-Pitch Starting XI Overview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <button
          type="button"
          onClick={() => setActiveSide("home")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeSide === "home"
              ? "bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-lg"
              : "bg-slate-900/50 border-slate-800 hover:bg-slate-800/40 text-slate-400"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded bg-slate-800 p-0.5 shrink-0 flex items-center justify-center">
              <EntityImage
                src={homeTeam?.imageUrl}
                alt={homeTeam?.name || "Home"}
                width={20}
                height={20}
                entityType="club"
                className="object-contain"
              />
            </div>
            <span className="font-bold text-xs sm:text-sm text-white truncate">
              {homeTeam?.name || "Home"}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-[11px] text-slate-400">
              {homeLineup.formation ? `Formation: ${homeLineup.formation}` : "Starting XI"}
            </span>
            <span className="font-black text-xs sm:text-sm text-emerald-400 font-mono">
              {homeTotalVal > 0 ? formatCompactEur(homeTotalVal) : "—"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSide("away")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeSide === "away"
              ? "bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-lg"
              : "bg-slate-900/50 border-slate-800 hover:bg-slate-800/40 text-slate-400"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded bg-slate-800 p-0.5 shrink-0 flex items-center justify-center">
              <EntityImage
                src={awayTeam?.imageUrl}
                alt={awayTeam?.name || "Away"}
                width={20}
                height={20}
                entityType="club"
                className="object-contain"
              />
            </div>
            <span className="font-bold text-xs sm:text-sm text-white truncate">
              {awayTeam?.name || "Away"}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-[11px] text-slate-400">
              {awayLineup.formation ? `Formation: ${awayLineup.formation}` : "Starting XI"}
            </span>
            <span className="font-black text-xs sm:text-sm text-emerald-400 font-mono">
              {awayTotalVal > 0 ? formatCompactEur(awayTotalVal) : "—"}
            </span>
          </div>
        </button>
      </div>

      {/* 2. Tactical Pitch View */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {currentTeamName} Formation: {currentFormation || "4-3-3"}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tap any player to inspect profile and career valuation
            </p>
          </div>
          {currentTeamTotalVal > 0 && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              XI Value: {formatCompactEur(currentTeamTotalVal)}
            </span>
          )}
        </div>

        {/* The Football Pitch Graphic */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] rounded-2xl bg-gradient-to-b from-[#122818] via-[#0e2113] to-[#0a180e] border border-emerald-900/60 shadow-inner overflow-hidden p-4">
          {/* Pitch markings */}
          <div className="absolute inset-3 border-2 border-emerald-600/30 rounded-xl pointer-events-none" />
          <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 border-b-2 border-emerald-600/30 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 border-2 border-emerald-600/30 rounded-full pointer-events-none" />
          {/* Penalty Boxes */}
          <div className="absolute left-1/2 -translate-x-1/2 top-3 w-40 h-20 sm:w-56 sm:h-28 border-2 border-t-0 border-emerald-600/30 rounded-b-xl pointer-events-none" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 w-40 h-20 sm:w-56 sm:h-28 border-2 border-b-0 border-emerald-600/30 rounded-t-xl pointer-events-none" />

          {/* Starters on pitch */}
          {currentStarters.map((player: any) => {
            const posX = (player.verticalLayout?.x ?? 0.5) * 100;
            const posY = (player.verticalLayout?.y ?? 0.5) * 100;

            const isSelected = selectedPlayer?.id === player.id;

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => setSelectedPlayer(player)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group focus:outline-none transition-transform active:scale-95"
                style={{ left: `${posX}%`, top: `${posY}%` }}
              >
                {/* Player Shirt Badge & Number */}
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg border-2 transition-all ${
                    isSelected
                      ? "bg-amber-400 text-slate-950 border-white scale-110 ring-4 ring-amber-400/40"
                      : "bg-slate-900/90 text-white border-emerald-400/80 group-hover:border-amber-400 group-hover:scale-105"
                  }`}
                >
                  {player.shirtNumber || "•"}
                </div>

                {/* Player Name */}
                <span className="text-[10px] sm:text-xs font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded shadow-sm mt-1 max-w-[90px] truncate text-center leading-tight">
                  {player.name?.split(" ")?.slice(-1)[0] || player.name}
                </span>

                {/* Value-to-Pitch Chip */}
                {player.marketValue && player.marketValue > 0 ? (
                  <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 px-1 rounded shadow-sm -mt-0.5">
                    {formatCompactEur(player.marketValue)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Selected Player Mini Preview Modal / Card */}
        {selectedPlayer && (
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xl flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-black text-amber-400 text-sm shrink-0">
                #{selectedPlayer.shirtNumber || "—"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-white truncate">{selectedPlayer.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  {selectedPlayer.marketValue && (
                    <span className="font-bold text-emerald-400 font-mono">
                      {formatCompactEur(selectedPlayer.marketValue)}
                    </span>
                  )}
                  {selectedPlayer.primaryTeamName && (
                    <span>• {selectedPlayer.primaryTeamName}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/players/${encodeURIComponent(
                  selectedPlayer.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                )}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors"
              >
                <span>Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Substitutes & Coach List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Substitutes & Staff
          </h3>
          <span className="text-[11px] text-slate-400">{currentSubs.length} Available</span>
        </div>

        {/* Coach */}
        {currentCoach && (
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-semibold text-white">{currentCoach.name}</span>
                {currentCoach.countryName && (
                  <span className="text-slate-400 text-xs ml-1.5">({currentCoach.countryName})</span>
                )}
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              Head Coach
            </span>
          </div>
        )}

        {/* Subs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {currentSubs.map((sub: any) => (
            <div
              key={sub.id}
              className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800/60 flex items-center justify-between gap-2 hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-5 text-center font-mono font-bold text-slate-400 text-[11px]">
                  {sub.shirtNumber || "—"}
                </span>
                <span className="font-medium text-slate-200 truncate">{sub.name}</span>
              </div>
              {sub.marketValue && sub.marketValue > 0 && (
                <span className="font-mono font-bold text-emerald-400 text-[11px] shrink-0">
                  {formatCompactEur(sub.marketValue)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
