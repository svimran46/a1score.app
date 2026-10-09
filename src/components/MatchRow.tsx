import React from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { KickoffTime } from "./KickoffTime";
import { getClubShortName } from "@/lib/data/clubs";
import { evaluateLiveMatchFreshness } from "@/lib/date-utils";
import type { FotmobMatch } from "@/lib/fotmob/client";

export interface MatchRowProps {
  match?: FotmobMatch;
  id?: string | number;
  href?: string;
  homeName?: string;
  homeCrest?: string | null;
  awayName?: string;
  awayCrest?: string | null;
  homeScore?: number | string | null;
  awayScore?: number | string | null;
  statusText?: string | null;
  kickoffTime?: string | null;
  isLive?: boolean;
  liveMinute?: string | number | null;
  isFinished?: boolean;
  className?: string;
}

/**
 * a1score MatchRow Component (compact, centered):
 * home name (right-aligned) | crest | time or score | crest | away name (left-aligned)
 * - Live: minute shown in --live plus a text "LIVE" label (state must not rely on color alone).
 * - Entire row is a link with a visible focus state.
 */
export function MatchRow({
  match,
  id,
  href,
  homeName,
  homeCrest,
  awayName,
  awayCrest,
  homeScore,
  awayScore,
  statusText,
  kickoffTime,
  isLive: isLiveProp,
  liveMinute: liveMinuteProp,
  isFinished: isFinishedProp,
  className = "",
}: MatchRowProps) {
  // If match object is provided, derive props
  const effectiveId = match ? match.id : id;
  const effectiveHref = href || (effectiveId ? `/matches/${effectiveId}` : "/matches");
  const effectiveHomeName = match ? getClubShortName(match.home.name) : homeName || "";
  const effectiveAwayName = match ? getClubShortName(match.away.name) : awayName || "";
  const effectiveHomeCrest = match ? match.home.imageUrl : homeCrest;
  const effectiveAwayCrest = match ? match.away.imageUrl : awayCrest;

  const isLive = match ? match.isLive : isLiveProp ?? false;
  const isFinished = match ? match.isFinished : isFinishedProp ?? false;

  const scoreText = match
    ? match.status?.scoreStr ||
      (typeof match.home?.score === "number" && typeof match.away?.score === "number"
        ? `${match.home.score} - ${match.away.score}`
        : "0 - 0")
    : (homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined)
    ? `${homeScore} - ${awayScore}`
    : null;

  const liveMinute = match
    ? match.status?.liveTime?.short || match.status?.reason?.short || "LIVE"
    : liveMinuteProp;

  const freshness = evaluateLiveMatchFreshness({
    isLive,
    liveMinuteStr: liveMinute !== null && liveMinute !== undefined ? String(liveMinute) : null,
    liveTimeLong: match?.status?.liveTime?.long,
    reason: match?.status?.reason?.short || match?.status?.reason?.long,
  });

  const kickoffDate = match ? (match.status?.utcTime || match.timeTS || match.time) : null;

  return (
    <Link
      href={effectiveHref}
      className={`group relative grid grid-cols-[1fr_80px_1fr] sm:grid-cols-[1fr_96px_1fr] items-center gap-2 sm:gap-3 px-3 sm:px-4 h-14 min-h-[56px] rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] w-full select-none ${className}`}
    >
      {/* 1. Home: Name (right-aligned) + Crest */}
      <div className="flex items-center justify-end gap-2 sm:gap-2.5 min-w-0 pr-1">
        <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] text-right truncate group-hover:text-[var(--accent)] transition-colors">
          {effectiveHomeName}
        </span>
        <div className="w-6 h-6 rounded-md bg-[var(--bg-chip)] flex items-center justify-center shrink-0 overflow-hidden relative">
          <EntityImage
            src={effectiveHomeCrest}
            alt={effectiveHomeName}
            width={20}
            height={20}
            entityType="club"
            className="object-contain"
          />
        </div>
      </div>

      {/* 2. Centre Column: Score / Live Minute / Kickoff */}
      <div className="flex flex-col items-center justify-center shrink-0 text-center px-1">
        {isLive ? (
          <>
            <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] tabular-nums leading-tight">
              {scoreText || "0 - 0"}
            </span>
            {freshness.isUnconfirmed ? (
              <span className="text-[10px] font-semibold text-value-text/90 leading-tight mt-0.5 tracking-tight">
                Status unconfirmed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--live)] leading-tight mt-0.5 tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] animate-ping" />
                <span>{liveMinute ? `${liveMinute}' ` : ""}LIVE</span>
              </span>
            )}
          </>
        ) : isFinished ? (
          <>
            <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] tabular-nums leading-tight">
              {scoreText || "0 - 0"}
            </span>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] leading-tight mt-0.5 uppercase tracking-wider">
              {statusText || "FT"}
            </span>
          </>
        ) : scoreText ? (
          <>
            <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] tabular-nums leading-tight">
              {scoreText}
            </span>
            {statusText && (
              <span className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                {statusText}
              </span>
            )}
          </>
        ) : match && kickoffDate ? (
          <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] tabular-nums leading-tight">
            <KickoffTime date={kickoffDate} timeOnly={true} />
          </div>
        ) : (
          <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] tabular-nums leading-tight">
            {kickoffTime || "Upcoming"}
          </span>
        )}
      </div>

      {/* 3. Away: Crest + Name (left-aligned) */}
      <div className="flex items-center justify-start gap-2 sm:gap-2.5 min-w-0 pl-1">
        <div className="w-6 h-6 rounded-md bg-[var(--bg-chip)] flex items-center justify-center shrink-0 overflow-hidden relative">
          <EntityImage
            src={effectiveAwayCrest}
            alt={effectiveAwayName}
            width={20}
            height={20}
            entityType="club"
            className="object-contain"
          />
        </div>
        <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] text-left truncate group-hover:text-[var(--accent)] transition-colors">
          {effectiveAwayName}
        </span>
      </div>
    </Link>
  );
}
