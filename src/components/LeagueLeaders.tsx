"use client";

import Link from "next/link";
import { EntityImage } from "@/components/EntityImage";
import { Trophy, Flame, Compass, ChevronRight } from "lucide-react";
import type { LeaguePlayerLeader } from "@/lib/fotmob/client";

interface LeagueLeadersProps {
  topScorers: LeaguePlayerLeader[];
  topAssists: LeaguePlayerLeader[];
  otherLeagues: Array<{ id: string; name: string; country: string; logoUrl: string | null }>;
  currentLeagueId: string;
  season?: string;
}

export function LeagueLeaders({
  topScorers = [],
  topAssists = [],
  otherLeagues = [],
  currentLeagueId,
  season = "2026/2027",
}: LeagueLeadersProps) {
  const hasScorers = topScorers && topScorers.length > 0;
  const hasAssists = topAssists && topAssists.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Performers Section */}
      {(hasScorers || hasAssists) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Competition Leaders
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              Season {season}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Scorers Card */}
            {hasScorers && (
              <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3 bg-slate-900/30">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Top Goalscorers</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Goals</span>
                </div>

                <div className="space-y-2">
                  {topScorers.slice(0, 3).map((scorer, idx) => (
                    <div
                      key={scorer.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-amber-400 w-4 text-center">
                          #{scorer.rank || idx + 1}
                        </span>
                        <div className="relative w-8 h-8 rounded-full bg-slate-800 p-0.5 overflow-hidden border border-slate-700">
                          <EntityImage
                            src={scorer.imageUrl || ""}
                            alt=""
                            fill
                            sizes="32px"
                            entityType="player"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {scorer.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {scorer.teamName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-amber-400 tabular-nums">
                          {scorer.value}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">
                          goals
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Assists Card */}
            {hasAssists && (
              <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3 bg-slate-900/30">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Flame className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Assist Leaders</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Assists</span>
                </div>

                <div className="space-y-2">
                  {topAssists.slice(0, 3).map((assister, idx) => (
                    <div
                      key={assister.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-emerald-400 w-4 text-center">
                          #{assister.rank || idx + 1}
                        </span>
                        <div className="relative w-8 h-8 rounded-full bg-slate-800 p-0.5 overflow-hidden border border-slate-700">
                          <EntityImage
                            src={assister.imageUrl || ""}
                            alt=""
                            fill
                            sizes="32px"
                            entityType="player"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {assister.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {assister.teamName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-400 tabular-nums">
                          {assister.value}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">
                          assists
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* European Leagues Quick Links */}
      {otherLeagues.length > 0 && (
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/20 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Explore Other Top European Leagues
              </h4>
            </div>
            <Link
              href="/leagues"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              All Leagues <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {otherLeagues.map((l) => (
              <Link
                key={l.id}
                href={`/leagues/${l.id}`}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-900/80 transition-all group"
              >
                <div className="relative w-6 h-6 rounded-md bg-slate-800 p-0.5 flex-shrink-0 overflow-hidden">
                  <EntityImage
                    src={l.logoUrl}
                    alt=""
                    fill
                    sizes="24px"
                    entityType="league"
                    className="object-contain"
                  />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors block truncate">
                    {l.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {l.country}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
