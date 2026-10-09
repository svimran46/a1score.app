"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trophy, Award, ChevronDown, ChevronUp, Calendar, Shield } from "lucide-react";
import type {
  PlayerAchievementsGrouped,
  PlayerAchievementItem,
} from "@/lib/data/playerAchievements";
import { getClubSlug } from "@/lib/slugs";

interface PlayerAchievementsProps {
  achievements: PlayerAchievementsGrouped;
  playerName: string;
}

interface AchievementTileProps {
  item: PlayerAchievementItem;
  playerName: string;
}

function AchievementTile({ item }: AchievementTileProps) {
  const [expanded, setExpanded] = useState(false);
  const isIndividual = item.kind === "individual_award";
  const hasSeasons = item.seasons && item.seasons.length > 0;
  const tileId = `ach-tile-${item.id}`;
  const detailsId = `ach-details-${item.id}`;

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden">
      <button
        type="button"
        id={tileId}
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[var(--bg-hover)] transition-colors min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {/* Badge / Count */}
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-chip)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
              {item.titleCount}x
            </span>
          </div>

          {/* Name & Latest Season */}
          <div className="min-w-0">
            <div className="text-sm font-bold text-[var(--text-primary)] truncate">
              {item.competitionName}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-1.5 mt-0.5">
              <span>{isIndividual ? "Individual Honour" : "Team Trophy"}</span>
              {hasSeasons && (
                <>
                  <span>•</span>
                  <span>Latest: {item.seasons[0]}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expand Toggle */}
        <div className="shrink-0 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded Details List */}
      {expanded && (
        <div
          id={detailsId}
          role="region"
          aria-labelledby={tileId}
          className="border-t border-[var(--divider)] bg-[var(--bg-elevated)] p-3 space-y-2 text-xs"
        >
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Winning Seasons & Context
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.seasons.map((season, idx) => {
              const context = item.clubContext?.find((c) => c.season === season);
              return (
                <div
                  key={`${season}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs"
                >
                  <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-semibold tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>{season}</span>
                  </div>

                  {context?.clubName && (
                    <div className="text-[11px] text-[var(--text-secondary)] truncate max-w-[140px] text-right">
                      {context.clubTmId ? (
                        <Link
                          href={`/clubs/${context.clubTmId}`}
                          className="hover:text-[var(--value-text)] hover:underline transition-colors font-medium"
                          title={context.clubName}
                        >
                          {context.clubName}
                        </Link>
                      ) : (
                        <span>{context.clubName}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PlayerAchievements({
  achievements,
  playerName,
}: PlayerAchievementsProps) {
  if (!achievements || achievements.totalTitles === 0) {
    return null;
  }

  const { majorHonours, domesticCupsAndOther, individualAwards, totalTitles } =
    achievements;

  return (
    <div className="space-y-6">
      {/* Category 1: Major Honours */}
      {majorHonours.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[var(--value-text)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Major Honours ({majorHonours.reduce((a, b) => a + b.titleCount, 0)})
              </h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              Leagues & Continental Titles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {majorHonours.map((item) => (
              <AchievementTile
                key={`${item.kind}-${item.competitionKey}`}
                item={item}
                playerName={playerName}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category 2: Domestic Cups & Other Trophies */}
      {domesticCupsAndOther.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--trend-positive)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Domestic Cups & Trophies ({domesticCupsAndOther.reduce((a, b) => a + b.titleCount, 0)})
              </h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              National Cups & Super Cups
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {domesticCupsAndOther.map((item) => (
              <AchievementTile
                key={`${item.kind}-${item.competitionKey}`}
                item={item}
                playerName={playerName}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category 3: Individual Awards */}
      {individualAwards.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[var(--value-text)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Individual Awards ({individualAwards.reduce((a, b) => a + b.titleCount, 0)})
              </h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              Accolades & Best Player Recognitions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {individualAwards.map((item) => (
              <AchievementTile
                key={`${item.kind}-${item.competitionKey}`}
                item={item}
                playerName={playerName}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
