"use client";

import Link from "next/link";
import { EntityImage } from "@/components/EntityImage";
import { Trophy, Flame, Compass, ChevronRight } from "lucide-react";
import { getLeagueSlug } from "@/lib/slugs";
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
            <Flame className="w-5 h-5 text-value-text" />
            <h3 className="text-lg font-bold text-text-primary tracking-tight">
              Competition Leaders
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-bg-chip text-text-muted">
              Season {season}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Scorers Card */}
            {hasScorers && (
              <div className="p-5 rounded-2xl glass-panel border border-divider space-y-3 bg-bg-card/30">
                <div className="flex items-center justify-between pb-2 border-b border-divider/80">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent/10 text-value-text">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">Top Goalscorers</h4>
                  </div>
                  <span className="text-[11px] text-text-muted uppercase font-semibold">Goals</span>
                </div>

                <div className="space-y-2">
                  {topScorers.slice(0, 3).map((scorer, idx) => (
                    <div
                      key={scorer.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-bg-page/60 border border-divider/70 hover:border-divider transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-value-text figure w-4 text-center">
                          #{scorer.rank || idx + 1}
                        </span>
                        <div className="relative w-8 h-8 rounded-full bg-bg-chip p-0.5 overflow-hidden border border-divider">
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
                          <span className="text-xs font-bold text-text-primary block">
                            {scorer.name}
                          </span>
                          <span className="text-[10px] text-text-muted block">
                            {scorer.teamName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-value-text figure tabular-nums">
                          {scorer.value}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-text-muted block">
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
              <div className="p-5 rounded-2xl glass-panel border border-divider space-y-3 bg-bg-card/30">
                <div className="flex items-center justify-between pb-2 border-b border-divider/80">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-trend-up/10 text-trend-up">
                      <Flame className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">Assist Leaders</h4>
                  </div>
                  <span className="text-[11px] text-text-muted uppercase font-semibold">Assists</span>
                </div>

                <div className="space-y-2">
                  {topAssists.slice(0, 3).map((assister, idx) => (
                    <div
                      key={assister.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-bg-page/60 border border-divider/70 hover:border-divider transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-trend-up w-4 text-center">
                          #{assister.rank || idx + 1}
                        </span>
                        <div className="relative w-8 h-8 rounded-full bg-bg-chip p-0.5 overflow-hidden border border-divider">
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
                          <span className="text-xs font-bold text-text-primary block">
                            {assister.name}
                          </span>
                          <span className="text-[10px] text-text-muted block">
                            {assister.teamName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-trend-up tabular-nums">
                          {assister.value}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-text-muted block">
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
        <div className="p-5 rounded-2xl glass-panel border border-divider bg-bg-card/20 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-divider/80">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-value-text" />
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Explore Other Top European Leagues
              </h4>
            </div>
            <Link
              href="/leagues"
              className="text-xs text-value-text hover:text-value-text font-semibold flex items-center gap-1"
            >
              All Leagues <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {otherLeagues.map((l) => (
              <Link
                key={l.id}
                href={`/leagues/${getLeagueSlug(l)}`}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-bg-page/60 border border-divider/80 hover:border-accent/40 hover:bg-bg-card/80 transition-all group"
              >
                <div className="relative w-6 h-6 rounded-md bg-bg-chip p-0.5 flex-shrink-0 overflow-hidden">
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
                  <span className="text-xs font-bold text-text-primary group-hover:text-value-text transition-colors block truncate">
                    {l.name}
                  </span>
                  <span className="text-[10px] text-text-muted block truncate">
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
