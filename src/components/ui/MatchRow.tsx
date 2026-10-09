import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";

export interface MatchRowProps {
  id?: string | number;
  href?: string;
  homeName: string;
  homeCrest?: string | null;
  awayName: string;
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
 * FotMob-style MatchRow component (compact, centered):
 * home name (right-aligned) | crest | time or score | crest | away name (left-aligned)
 * - Live: minute shown in --live plus a text "LIVE" label (state must not rely on color alone).
 * - Entire row is a link with a visible focus state.
 */
export function MatchRow({
  id,
  href = id ? `/matches/${id}` : "/matches",
  homeName,
  homeCrest,
  awayName,
  awayCrest,
  homeScore,
  awayScore,
  statusText,
  kickoffTime,
  isLive = false,
  liveMinute,
  isFinished = false,
  className = "",
}: MatchRowProps) {
  const hasScore =
    (homeScore !== null && homeScore !== undefined) &&
    (awayScore !== null && awayScore !== undefined);

  return (
    <Link
      href={href}
      className={`group grid grid-cols-[1fr_80px_1fr] sm:grid-cols-[1fr_96px_1fr] items-center gap-2 sm:gap-3 px-3 sm:px-4 h-14 min-h-[56px] rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] w-full select-none ${className}`}
    >
      {/* Home: Name (right-aligned) + Crest */}
      <div className="flex items-center justify-end gap-2 sm:gap-2.5 min-w-0 pr-1">
        <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] text-right truncate group-hover:text-[var(--accent)] transition-colors">
          {homeName}
        </span>
        <div className="w-6 h-6 rounded-md bg-[var(--bg-chip)] flex items-center justify-center shrink-0 overflow-hidden relative">
          {homeCrest ? (
            <Image
              src={homeCrest}
              alt={homeName}
              width={20}
              height={20}
              className="object-contain"
              unoptimized
            />
          ) : (
            <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          )}
        </div>
      </div>

      {/* Center: Score or Time or Status */}
      <div className="flex flex-col items-center justify-center shrink-0 text-center px-1">
        {isLive ? (
          <>
            <span className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] figure leading-tight">
              {homeScore ?? 0} - {awayScore ?? 0}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--live)] leading-tight mt-0.5 tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] animate-ping" />
              <span>{liveMinute ? `${liveMinute}'` : ""} LIVE</span>
            </span>
          </>
        ) : isFinished ? (
          <>
            <span className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] figure leading-tight">
              {homeScore ?? 0} - {awayScore ?? 0}
            </span>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] leading-tight mt-0.5 uppercase tracking-wider">
              {statusText || "FT"}
            </span>
          </>
        ) : hasScore ? (
          <>
            <span className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] figure leading-tight">
              {homeScore} - {awayScore}
            </span>
            {statusText && (
              <span className="text-[10px] font-medium text-[var(--text-muted)] leading-tight mt-0.5">
                {statusText}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] tabular-nums leading-tight">
              {kickoffTime || "Upcoming"}
            </span>
            {statusText && (
              <span className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                {statusText}
              </span>
            )}
          </>
        )}
      </div>

      {/* Away: Crest + Name (left-aligned) */}
      <div className="flex items-center justify-start gap-2 sm:gap-2.5 min-w-0 pl-1">
        <div className="w-6 h-6 rounded-md bg-[var(--bg-chip)] flex items-center justify-center shrink-0 overflow-hidden relative">
          {awayCrest ? (
            <Image
              src={awayCrest}
              alt={awayName}
              width={20}
              height={20}
              className="object-contain"
              unoptimized
            />
          ) : (
            <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          )}
        </div>
        <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] text-left truncate group-hover:text-[var(--accent)] transition-colors">
          {awayName}
        </span>
      </div>
    </Link>
  );
}
