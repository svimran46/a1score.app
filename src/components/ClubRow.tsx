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
  leagueName?: string | null;
  country?: string | null;
  leagueRank?: number | null;
  totalSquadValue?: number | null;
  className?: string;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatClubValue(value: number): string {
  if (!value || value === 0) return "";
  if (value >= 1_000_000_000) {
    const valInB = value / 1_000_000_000;
    return `€${valInB.toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    const valInM = value / 1_000_000;
    return `€${valInM.toFixed(1)}M`;
  }
  return formatCompactEur(value);
}

/**
 * a1score ClubRow Component (fixed height 64 to 72, dividers only, no border box):
 * [rank (secondary 13)] [crest 44px] [short name (15/500, no truncate) with meta below (13 secondary)] [value right (15/600 gold)].
 * Never shows 'N/A'.
 */
export function ClubRow({
  rank,
  id,
  name,
  shortName,
  slug,
  logoUrl,
  leagueName,
  country,
  leagueRank,
  totalSquadValue,
  className = "",
}: ClubRowProps) {
  const clubShortName = getClubShortName(shortName || name);
  const href = `/clubs/${slug || getClubSlug({ id, name })}`;

  const sublineText = [
    leagueName || country || null,
    leagueRank ? getOrdinal(leagueRank) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const formattedVal = totalSquadValue ? formatClubValue(totalSquadValue) : null;

  return (
    <Link
      href={href}
      className={`h-[68px] min-h-[64px] max-h-[72px] flex items-center gap-3 px-3 sm:px-4 hover:bg-white/[0.02] transition-colors w-full ${className}`}
    >
      {/* Rank (13px secondary) */}
      {rank != null && (
        <span
          className="w-6 text-center text-[13px] font-normal tabular-nums shrink-0"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {rank}
        </span>
      )}

      {/* Crest (44px) */}
      <div className="relative w-11 h-11 rounded-lg bg-white/[0.02] p-1 shrink-0 overflow-hidden border border-white/5 flex items-center justify-center">
        <EntityImage
          src={logoUrl}
          alt={name}
          width={44}
          height={44}
          entityType="club"
          className="object-contain p-0.5"
        />
      </div>

      {/* Middle: Short Name (15/500, wraps up to 2 lines, no ellipsis) & Meta (13 secondary) */}
      <div className="flex-1 min-w-0 pr-2">
        <div
          className="text-[15px] font-medium leading-snug line-clamp-2"
          style={{ color: "var(--color-text)" }}
        >
          {clubShortName}
        </div>
        {sublineText && (
          <div
            className="text-[13px] font-normal mt-0.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {sublineText}
          </div>
        )}
      </div>

      {/* Right: Squad Value (15/600 gold) */}
      {formattedVal && (
        <div className="shrink-0 text-right">
          <div
            className="text-[15px] font-semibold tabular-nums leading-tight"
            style={{ color: "var(--color-accent)" }}
          >
            {formattedVal}
          </div>
        </div>
      )}
    </Link>
  );
}
