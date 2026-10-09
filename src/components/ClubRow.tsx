import React from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getClubSlug } from "@/lib/slugs";
import { getClubShortName } from "@/lib/data/clubs";

export interface ClubRowProps {
  rank?: number | string;
  id: string;
  name: string;
  shortName?: string | null;
  slug?: string | null;
  logoUrl?: string | null;
  crestUrl?: string | null;
  leagueName?: string | null;
  country?: string | null;
  leagueRank?: number | null;
  totalSquadValue?: number | null;
  squadValue?: number | null;
  playerCount?: number | null;
  className?: string;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * a1score ClubRow Component:
 * crest | club name over league (muted) | squad value (amber, tabular-nums, right)
 */
export function ClubRow({
  rank,
  id,
  name,
  shortName,
  slug,
  logoUrl,
  crestUrl,
  leagueName,
  country,
  leagueRank,
  totalSquadValue,
  squadValue,
  playerCount,
  className = "",
}: ClubRowProps) {
  const clubShortName = getClubShortName(shortName || name);
  const href = `/clubs/${slug || getClubSlug({ id, name })}`;
  const effectiveLogo = logoUrl || crestUrl;
  const effectiveValue = totalSquadValue ?? squadValue;

  const sublineText = [
    leagueName || country || null,
    leagueRank ? getOrdinal(leagueRank) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-3 px-3 sm:px-4 h-[var(--row-height)] min-h-[64px] rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] w-full select-none ${className}`}
    >
      {/* Rank (13px secondary) */}
      {rank != null && (
        <span className="w-6 text-center text-xs sm:text-sm font-bold text-[var(--text-muted)] shrink-0 tabular-nums">
          {rank}
        </span>
      )}

      {/* Crest (40px) */}
      <div className="w-10 h-10 rounded-xl bg-[var(--bg-chip)] p-1 shrink-0 overflow-hidden flex items-center justify-center relative">
        <EntityImage
          src={effectiveLogo}
          alt={name}
          width={36}
          height={36}
          entityType="club"
          className="object-contain p-0.5"
        />
      </div>

      {/* Middle: Short Name & Meta */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors leading-tight">
          {clubShortName}
        </div>
        {sublineText && (
          <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
            {sublineText}
          </div>
        )}
      </div>

      {/* Player Count (optional) */}
      {playerCount != null && (
        <div className="hidden sm:block text-xs text-[var(--text-muted)] shrink-0 px-2 tabular-nums">
          {playerCount} players
        </div>
      )}

      {/* Right: Squad Value */}
      <div className="text-right shrink-0">
        <div className="text-sm sm:text-base font-bold text-[var(--value-text)] figure tabular-nums leading-tight">
          {effectiveValue ? formatCompactEur(effectiveValue) : "—"}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold leading-tight mt-0.5">
          Squad Value
        </div>
      </div>
    </Link>
  );
}
