"use client";

import { EntityImage } from "@/components/EntityImage";
import { LiveMinute } from "@/components/LiveMinute";

interface StickyMatchBarProps {
  match: any;
  isVisible: boolean;
}

export function StickyMatchBar({ match, isVisible }: StickyMatchBarProps) {
  const { teams = {}, status = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  const isLive = status?.isLive;
  const isHT = status?.isHT;
  const isFinished = status?.finished;
  const isUpcoming = status?.isUpcoming;

  if (!isVisible) return null;

  return (
    <div
      className="w-full bg-[var(--bg-page)]/95 border-b border-[var(--divider)] backdrop-blur-md py-2 px-3 transition-all duration-200 shadow-xs animate-in fade-in slide-in-from-top-2"
      aria-label="Compact Live Score"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Home Team Compact */}
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate text-right">
            {homeTeam?.name || "Home"}
          </span>
          <div className="w-6 h-6 rounded-lg bg-[var(--bg-chip)] p-0.5 shrink-0 flex items-center justify-center border border-[var(--border-subtle)]">
            <EntityImage
              src={homeTeam?.imageUrl}
              alt={homeTeam?.name || "Home"}
              width={24}
              height={24}
              entityType="club"
              className="object-contain"
            />
          </div>
        </div>

        {/* Score & Live Status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shrink-0 tabular-nums">
          {isUpcoming ? (
            <span className="text-xs font-bold text-[var(--text-secondary)]">VS</span>
          ) : (
            <div className="flex items-center gap-1.5 font-black text-sm sm:text-base">
              <span className={isLive ? "text-[var(--value-text)]" : "text-[var(--text-primary)]"}>
                {homeTeam?.score ?? 0}
              </span>
              <span className="text-[var(--text-muted)]">-</span>
              <span className={isLive ? "text-[var(--value-text)]" : "text-[var(--text-primary)]"}>
                {awayTeam?.score ?? 0}
              </span>
            </div>
          )}

          {isLive && (
            <div className="border-l border-[var(--divider)] pl-2">
              <LiveMinute
                shortTime={status?.liveTime?.short}
                longTime={status?.liveTime?.long}
                isLive={true}
                isHT={isHT}
                isFinished={false}
                showPulsingDot={false}
                className="text-[11px]"
              />
            </div>
          )}
          {isFinished && (
            <span className="text-[11px] text-[var(--text-muted)] font-medium border-l border-[var(--divider)] pl-2">
              FT
            </span>
          )}
        </div>

        {/* Away Team Compact */}
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-start">
          <div className="w-6 h-6 rounded-lg bg-[var(--bg-chip)] p-0.5 shrink-0 flex items-center justify-center border border-[var(--border-subtle)]">
            <EntityImage
              src={awayTeam?.imageUrl}
              alt={awayTeam?.name || "Away"}
              width={24}
              height={24}
              entityType="club"
              className="object-contain"
            />
          </div>
          <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate text-left">
            {awayTeam?.name || "Away"}
          </span>
        </div>
      </div>
    </div>
  );
}
