"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCompactEur } from "@/lib/utils";
import { EntityImage } from "@/components/EntityImage";
import { Users, User, ExternalLink } from "lucide-react";
import { slugify } from "@/lib/slugs";

interface LineupTabProps {
  match: any;
}

function getPlayerProfileUrl(player: any): string {
  if (!player) return "/values";
  if (player.slug) return `/players/${player.slug}`;
  if (player.name) {
    const slug = slugify(String(player.name));
    return `/players/${slug || player.id}`;
  }
  return `/players/${player.id || ""}`;
}

export function LineupTab({ match }: LineupTabProps) {
  const { lineup = {}, teams = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  const homeLineup = lineup?.homeTeam || {};
  const awayLineup = lineup?.awayTeam || {};

  const homeStarters = (homeLineup.starters || []).filter(Boolean);
  const awayStarters = (awayLineup.starters || []).filter(Boolean);
  const homeSubs = (homeLineup.subs || []).filter(Boolean);
  const awaySubs = (awayLineup.subs || []).filter(Boolean);
  const homeCoach = homeLineup.coach;
  const awayCoach = awayLineup.coach;

  const [activeSide, setActiveSide] = useState<"home" | "away">("home");

  const hasLineups = homeStarters.length > 0 || awayStarters.length > 0;

  if (!hasLineups) {
    return (
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 sm:p-12 text-center space-y-3 shadow-xs">
        <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
        <h4 className="text-base font-bold text-[var(--text-primary)]">Lineups Pending Confirmation</h4>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
          Tactical formations, confirmed starting XIs, and pitch valuations are published approximately 60 minutes before kickoff.
        </p>
      </div>
    );
  }

  const homeTotalVal =
    homeLineup.totalStarterMarketValue ||
    homeStarters.reduce((acc: number, p: any) => acc + (Number(p?.marketValue) || 0), 0);
  const awayTotalVal =
    awayLineup.totalStarterMarketValue ||
    awayStarters.reduce((acc: number, p: any) => acc + (Number(p?.marketValue) || 0), 0);

  const currentStarters = activeSide === "home" ? homeStarters : awayStarters;
  const currentSubs = activeSide === "home" ? homeSubs : awaySubs;
  const currentCoach = activeSide === "home" ? homeCoach : awayCoach;
  const currentFormation = activeSide === "home" ? homeLineup.formation : awayLineup.formation;
  const currentTeamName = activeSide === "home" ? homeTeam?.name : awayTeam?.name;
  const currentTeamTotalVal = activeSide === "home" ? homeTotalVal : awayTotalVal;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Value-to-Pitch Starting XI Overview & Team Switcher */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Home Team Switcher */}
        <button
          type="button"
          onClick={() => setActiveSide("home")}
          className={`min-h-[44px] p-3 sm:p-4 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
            activeSide === "home"
              ? "bg-[var(--bg-card)] border-[var(--value-text)] ring-1 ring-[var(--value-text)]/40 shadow-xs"
              : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded bg-[var(--bg-chip)] p-0.5 shrink-0 flex items-center justify-center">
              <EntityImage
                src={homeTeam?.imageUrl}
                alt={homeTeam?.name || "Home"}
                width={20}
                height={20}
                entityType="club"
                className="object-contain"
              />
            </div>
            <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
              {homeTeam?.name || "Home"}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2 flex-wrap gap-1">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              {homeLineup.formation ? `Formation: ${homeLineup.formation}` : "Starting XI"}
            </span>
            <span className="font-black text-xs sm:text-sm text-[var(--value-text)] tabular-nums">
              {homeTotalVal > 0 ? formatCompactEur(homeTotalVal) : "—"}
            </span>
          </div>
        </button>

        {/* Away Team Switcher */}
        <button
          type="button"
          onClick={() => setActiveSide("away")}
          className={`min-h-[44px] p-3 sm:p-4 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
            activeSide === "away"
              ? "bg-[var(--bg-card)] border-[var(--value-text)] ring-1 ring-[var(--value-text)]/40 shadow-xs"
              : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded bg-[var(--bg-chip)] p-0.5 shrink-0 flex items-center justify-center">
              <EntityImage
                src={awayTeam?.imageUrl}
                alt={awayTeam?.name || "Away"}
                width={20}
                height={20}
                entityType="club"
                className="object-contain"
              />
            </div>
            <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
              {awayTeam?.name || "Away"}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2 flex-wrap gap-1">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              {awayLineup.formation ? `Formation: ${awayLineup.formation}` : "Starting XI"}
            </span>
            <span className="font-black text-xs sm:text-sm text-[var(--value-text)] tabular-nums">
              {awayTotalVal > 0 ? formatCompactEur(awayTotalVal) : "—"}
            </span>
          </div>
        </button>
      </div>

      {/* 2. Tactical Pitch View */}
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)] flex-wrap gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              {currentTeamName} Formation: {currentFormation || "4-3-3"}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Tap any player node to visit their career valuation profile
            </p>
          </div>
          {currentTeamTotalVal > 0 && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-[var(--value-text)] border border-amber-500/30 tabular-nums">
              Starting XI Value: {formatCompactEur(currentTeamTotalVal)}
            </span>
          )}
        </div>

        {/* The Football Pitch Graphic */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] rounded-2xl bg-gradient-to-b from-[var(--pitch-surface-alt)] to-[var(--pitch-surface)] border border-emerald-900/60 shadow-inner overflow-hidden p-4">
          {/* Pitch markings */}
          <div className="absolute inset-3 border-2 border-emerald-600/30 rounded-xl pointer-events-none" />
          <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 border-b-2 border-emerald-600/30 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 border-2 border-emerald-600/30 rounded-full pointer-events-none" />
          <div className="absolute left-1/2 -translate-x-1/2 top-3 w-40 h-20 sm:w-56 sm:h-28 border-2 border-t-0 border-emerald-600/30 rounded-b-xl pointer-events-none" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 w-40 h-20 sm:w-56 sm:h-28 border-2 border-b-0 border-emerald-600/30 rounded-t-xl pointer-events-none" />

          {/* Starters on pitch */}
          {currentStarters.map((player: any, idx: number) => {
            if (!player) return null;
            const posX = Math.min(Math.max((player.verticalLayout?.x ?? 0.5) * 100, 5), 95);
            const posY = Math.min(Math.max((player.verticalLayout?.y ?? 0.5) * 100, 8), 92);
            const profileUrl = getPlayerProfileUrl(player);
            const shortName = player.name ? (player.name.split(" ").slice(-1)[0] || player.name) : "Player";

            return (
              <Link
                key={player.id || idx}
                href={profileUrl}
                title={`${player.name || "Player"} — View Profile & Valuation`}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-xl transition-transform hover:scale-110 active:scale-95 z-10"
                style={{ left: `${posX}%`, top: `${posY}%` }}
              >
                {/* Shirt number badge */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-white/80 bg-[var(--bg-elevated)] text-[var(--text-primary)] group-hover:border-[var(--value-text)] group-hover:text-[var(--value-text)] transition-colors">
                  {player.shirtNumber || "•"}
                </div>

                {/* Player surname */}
                <span className="text-[10px] font-bold text-white bg-slate-950/90 px-1.5 py-0.5 rounded shadow-xs mt-0.5 max-w-[80px] truncate text-center leading-tight">
                  {shortName}
                </span>

                {/* Market Value chip (valuation-first in amber with tabular numbers) */}
                {player.marketValue && Number(player.marketValue) > 0 ? (
                  <span className="text-[9px] font-bold text-[var(--value-text)] tabular-nums bg-amber-950/90 border border-amber-500/40 px-1 rounded shadow-xs -mt-0.5">
                    {formatCompactEur(Number(player.marketValue))}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Starting XI List with Direct Player Links & Valuations */}
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
            {currentTeamName} Starting XI
          </h3>
          <span className="text-[11px] text-[var(--text-muted)] font-medium">11 Players</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {currentStarters.map((player: any, idx: number) => {
            if (!player) return null;
            const profileUrl = getPlayerProfileUrl(player);
            return (
              <Link
                key={player.id || idx}
                href={profileUrl}
                className="min-h-[44px] p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center font-bold text-[var(--text-muted)] text-[11px] shrink-0">
                    {player.shirtNumber || "—"}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)] truncate">
                    {player.name || "Player"}
                  </span>
                  {player.performance?.rating && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 shrink-0">
                      ★ {Number(player.performance.rating).toFixed(1)}
                    </span>
                  )}
                </div>
                {player.marketValue && Number(player.marketValue) > 0 ? (
                  <span className="font-bold text-[var(--value-text)] tabular-nums text-xs shrink-0">
                    {formatCompactEur(Number(player.marketValue))}
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">—</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Substitutes & Staff */}
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Substitutes & Staff
          </h3>
          <span className="text-[11px] text-[var(--text-muted)]">{currentSubs.length} Bench Players</span>
        </div>

        {/* Coach */}
        {currentCoach && (
          <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-semibold text-[var(--text-primary)]">{currentCoach.name}</span>
                {currentCoach.countryName && (
                  <span className="text-[var(--text-muted)] text-xs ml-1.5">({currentCoach.countryName})</span>
                )}
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] bg-[var(--bg-chip)] px-2 py-0.5 rounded">
              Head Coach
            </span>
          </div>
        )}

        {/* Bench Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {currentSubs.map((sub: any, idx: number) => {
            if (!sub) return null;
            const profileUrl = getPlayerProfileUrl(sub);
            return (
              <Link
                key={sub.id || idx}
                href={profileUrl}
                className="min-h-[44px] p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center font-bold text-[var(--text-muted)] text-[11px] shrink-0">
                    {sub.shirtNumber || "—"}
                  </span>
                  <span className="font-medium text-[var(--text-primary)] truncate">{sub.name || "Player"}</span>
                </div>
                {sub.marketValue && Number(sub.marketValue) > 0 ? (
                  <span className="font-bold text-[var(--value-text)] tabular-nums text-xs shrink-0">
                    {formatCompactEur(Number(sub.marketValue))}
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">—</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
