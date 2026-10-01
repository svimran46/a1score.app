import React from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { KickoffTime } from "./KickoffTime";
import { getClubShortName } from "@/lib/data/clubs";
import type { FotmobMatch } from "@/lib/fotmob/client";

export interface MatchRowProps {
  match: FotmobMatch;
  className?: string;
}

/**
 * a1score MatchRow Component (fixed height 56 to 68, dividers only, no border box):
 * [home name right-aligned (15/500) + crest]
 * [score (15/600) or time in a 64px centre column, live minute in positive under score]
 * [crest + away name left-aligned (15/500)].
 * Live = green indicator.
 */
export function MatchRow({ match, className = "" }: MatchRowProps) {
  const homeShort = getClubShortName(match.home.name);
  const awayShort = getClubShortName(match.away.name);

  const isLive = match.isLive;
  const isFinished = match.isFinished;
  const isUpcoming = !isLive && !isFinished;

  const scoreText =
    match.status?.scoreStr ||
    (typeof match.home?.score === "number" && typeof match.away?.score === "number"
      ? `${match.home.score} - ${match.away.score}`
      : "0 - 0");

  const liveMinute =
    match.status?.liveTime?.short ||
    (match.status?.reason?.short ? match.status.reason.short : "LIVE");

  const kickoffDate = match.status?.utcTime || match.timeTS || match.time;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`relative grid grid-cols-[1fr_64px_1fr] items-center gap-2 px-3 h-[58px] min-h-[56px] max-h-[64px] hover:bg-[var(--color-surface-2)] transition-colors w-full ${className}`}
    >
      {/* Live Indicator on left */}
      {isLive && (
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
          style={{ backgroundColor: "var(--color-positive)" }}
          aria-label="Live match"
        />
      )}

      {/* Home: Name (15/500, right-aligned, wraps up to 2 lines, no ellipsis) + Crest */}
      <div className="flex items-center justify-end gap-2 text-right min-w-0 pr-1">
        <span
          className="text-[15px] font-medium leading-tight text-right line-clamp-2"
          style={{ color: "var(--color-text)" }}
        >
          {homeShort}
        </span>
        <div className="relative w-5 h-5 shrink-0 flex items-center justify-center overflow-hidden">
          <EntityImage
            src={match.home.imageUrl}
            alt=""
            width={20}
            height={20}
            entityType="club"
            className="object-contain"
          />
        </div>
      </div>

      {/* Centre Column (64px wide): Score or Kickoff time */}
      <div className="w-[64px] flex flex-col items-center justify-center shrink-0 text-center px-1">
        {isLive ? (
          <>
            <span
              className="text-[15px] font-semibold tabular-nums leading-none"
              style={{ color: "var(--color-text)" }}
            >
              {scoreText}
            </span>
            <span
              className="text-[12px] font-medium leading-none mt-1"
              style={{ color: "var(--color-positive)" }}
            >
              {liveMinute}
            </span>
          </>
        ) : isFinished ? (
          <>
            <span
              className="text-[15px] font-semibold tabular-nums leading-none"
              style={{ color: "var(--color-text)" }}
            >
              {scoreText}
            </span>
            <span
              className="text-[12px] font-normal leading-none mt-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              FT
            </span>
          </>
        ) : (
          <KickoffTime
            date={kickoffDate}
            timeOnly
            className="text-[15px] font-semibold tabular-nums leading-none"
          />
        )}
      </div>

      {/* Away: Crest + Name (15/500, left-aligned, wraps up to 2 lines, no ellipsis) */}
      <div className="flex items-center justify-start gap-2 text-left min-w-0 pl-1">
        <div className="relative w-5 h-5 shrink-0 flex items-center justify-center overflow-hidden">
          <EntityImage
            src={match.away.imageUrl}
            alt=""
            width={20}
            height={20}
            entityType="club"
            className="object-contain"
          />
        </div>
        <span
          className="text-[15px] font-medium leading-tight text-left line-clamp-2"
          style={{ color: "var(--color-text)" }}
        >
          {awayShort}
        </span>
      </div>
    </Link>
  );
}
