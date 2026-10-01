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
 * Standard MatchRow component (<= 68px tall).
 * Grid: 1fr auto 1fr.
 * Home name right-aligned + crest, centre 64px, crest + away name left-aligned.
 * Live = green minute badge at the row's left edge; finished = bold score with small "FT"; upcoming = time only, no "-" placeholders.
 * Whole row is the tap target.
 */
export function MatchRow({ match, className = "" }: MatchRowProps) {
  const homeShort = getClubShortName(match.home.name);
  const awayShort = getClubShortName(match.away.name);

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`relative grid grid-cols-[1fr_64px_1fr] items-center gap-2 px-3 py-1.5 h-[62px] min-h-[58px] max-h-[68px] hover:bg-slate-800/40 transition-colors w-full group ${className}`}
    >
      {/* Live Indicator at left edge */}
      {match.isLive && (
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-emerald-500 animate-pulse"
          aria-label="Live match"
        />
      )}

      {/* Home: Name (right-aligned) + Crest */}
      <div className="flex items-center justify-end gap-2 text-right min-w-0 pr-1">
        <span
          title={match.home.name}
          className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-tight text-right group-hover:text-amber-400 transition-colors"
        >
          {homeShort}
        </span>
        <div className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0 flex items-center justify-center overflow-hidden">
          <EntityImage
            src={match.home.imageUrl}
            alt=""
            width={22}
            height={22}
            entityType="club"
            className="object-contain"
          />
        </div>
      </div>

      {/* Centre 64px: Score / Live minute / Kickoff time */}
      <div className="w-[64px] flex flex-col items-center justify-center shrink-0 text-center">
        {match.isLive ? (
          <>
            <span className="text-sm sm:text-base font-black text-emerald-400 tabular-nums tracking-wider leading-none">
              {match.home.score ?? 0} - {match.away.score ?? 0}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 leading-none mt-1">
              {match.status.liveTime?.short || "LIVE"}
            </span>
          </>
        ) : match.isFinished ? (
          <>
            <span className="text-sm sm:text-base font-black text-white tabular-nums tracking-wider leading-none">
              {match.home.score ?? 0} - {match.away.score ?? 0}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase leading-none mt-1">
              FT
            </span>
          </>
        ) : (
          <KickoffTime
            date={match.status.utcTime}
            timeOnly={true}
            className="text-xs sm:text-sm font-bold text-slate-200 tabular-nums leading-none"
          />
        )}
      </div>

      {/* Away: Crest + Name (left-aligned) */}
      <div className="flex items-center justify-start gap-2 text-left min-w-0 pl-1">
        <div className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0 flex items-center justify-center overflow-hidden">
          <EntityImage
            src={match.away.imageUrl}
            alt=""
            width={22}
            height={22}
            entityType="club"
            className="object-contain"
          />
        </div>
        <span
          title={match.away.name}
          className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-tight text-left group-hover:text-amber-400 transition-colors"
        >
          {awayShort}
        </span>
      </div>
    </Link>
  );
}
