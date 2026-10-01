import React from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { KickoffTime } from "./KickoffTime";
import { getClubShortName } from "@/lib/data/clubs";
import type { FotmobMatch } from "@/lib/fotmob/client";

interface HomeMatchRowProps {
  match: FotmobMatch;
}

/**
 * HomeMatchRow (56px):
 * [home name right-aligned + crest]
 * [score or time in a 64px centre column, live minute in green under the score]
 * [crest + away name left-aligned].
 * No border box per row, dividers only.
 */
export function HomeMatchRow({ match }: HomeMatchRowProps) {
  const homeShortName = getClubShortName(match.home?.name || "");
  const awayShortName = getClubShortName(match.away?.name || "");

  const isLive = match.isLive;
  const isFinished = match.isFinished;
  const isUpcoming = !isLive && !isFinished;

  const scoreText =
    match.status?.scoreStr ||
    (typeof match.home?.score === "number" && typeof match.away?.score === "number"
      ? `${match.home.score} - ${match.away.score}`
      : "-");

  const liveMinute =
    match.status?.liveTime?.short ||
    (match.status?.reason?.short ? match.status.reason.short : "LIVE");

  const kickoffDate = match.status?.utcTime || match.timeTS || match.time;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="h-[56px] min-h-[56px] max-h-[56px] px-3 flex items-center hover:bg-white/[0.02] transition-colors"
      style={{
        backgroundColor: "transparent",
      }}
    >
      {/* Home Team (right-aligned name + crest) */}
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span
          className="text-right text-[15px] font-medium leading-tight text-[#F2F4F8] line-clamp-2"
          style={{ color: "var(--token-text, #F2F4F8)" }}
        >
          {homeShortName}
        </span>
        <div className="relative w-5 h-5 shrink-0 flex items-center justify-center overflow-hidden">
          {match.home?.imageUrl ? (
            <EntityImage
              src={match.home.imageUrl}
              alt={homeShortName}
              width={20}
              height={20}
              className="object-contain w-5 h-5"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold">
              {homeShortName.slice(0, 1)}
            </div>
          )}
        </div>
      </div>

      {/* Centre Column (64px wide: score or time, live minute in green) */}
      <div className="w-16 min-w-[64px] max-w-[64px] flex flex-col items-center justify-center shrink-0 text-center px-1">
        {isLive ? (
          <>
            <span
              className="text-[15px] font-semibold text-[#F2F4F8] tabular-nums leading-none"
              style={{ color: "var(--token-text, #F2F4F8)" }}
            >
              {scoreText}
            </span>
            <span
              className="text-[12px] font-normal text-[#22C55E] leading-none mt-1"
              style={{ color: "var(--token-green, #22C55E)" }}
            >
              {liveMinute}
            </span>
          </>
        ) : isFinished ? (
          <>
            <span
              className="text-[15px] font-semibold text-[#F2F4F8] tabular-nums leading-none"
              style={{ color: "var(--token-text, #F2F4F8)" }}
            >
              {scoreText}
            </span>
            <span
              className="text-[12px] font-normal text-[#8B93A5] leading-none mt-1"
              style={{ color: "var(--token-text-muted, #8B93A5)" }}
            >
              FT
            </span>
          </>
        ) : (
          <KickoffTime
            date={kickoffDate}
            timeOnly
            className="text-[15px] font-semibold text-[#F2F4F8] tabular-nums leading-none"
          />
        )}
      </div>

      {/* Away Team (crest + left-aligned name) */}
      <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
        <div className="relative w-5 h-5 shrink-0 flex items-center justify-center overflow-hidden">
          {match.away?.imageUrl ? (
            <EntityImage
              src={match.away.imageUrl}
              alt={awayShortName}
              width={20}
              height={20}
              className="object-contain w-5 h-5"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold">
              {awayShortName.slice(0, 1)}
            </div>
          )}
        </div>
        <span
          className="text-left text-[15px] font-medium leading-tight text-[#F2F4F8] line-clamp-2"
          style={{ color: "var(--token-text, #F2F4F8)" }}
        >
          {awayShortName}
        </span>
      </div>
    </Link>
  );
}
