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
  if (!value || value === 0) return "N/A";
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
 * Standard ClubRow component (exact 72px tall).
 * [rank by value] [crest 44px] [short name / "LaLiga · 4th"] [value right].
 * "27 players · 25.7 yrs" belongs in club detail page, not in this row.
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
    leagueName || country || "Club",
    leagueRank ? getOrdinal(leagueRank) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={href}
      className={`h-[72px] flex items-center gap-3 px-3 sm:px-4 hover:bg-slate-800/40 transition-colors w-full group ${className}`}
    >
      {/* Rank (28px wide muted) */}
      <span className="w-7 text-center text-xs font-semibold text-slate-500 tabular-nums shrink-0">
        {rank ?? ""}
      </span>

      {/* Crest (44px) */}
      <div className="relative w-11 h-11 rounded-xl bg-slate-900/90 p-1 shrink-0 overflow-hidden border border-slate-800 group-hover:scale-105 transition-transform flex items-center justify-center">
        <EntityImage
          src={logoUrl}
          alt={name}
          fill
          sizes="44px"
          entityType="club"
          className="object-contain p-0.5"
        />
      </div>

      {/* Middle: Short Name (16px semibold) & Subline ("LaLiga · 4th") */}
      <div className="flex-1 min-w-0">
        <div className="text-[16px] font-semibold text-white truncate leading-tight group-hover:text-amber-400 transition-colors">
          {clubShortName}
        </div>
        <div className="text-[13px] text-slate-400 truncate mt-0.5">
          {sublineText}
        </div>
      </div>

      {/* Right: Squad Value (16px bold gold) */}
      <div className="shrink-0 text-right">
        <div className="text-[16px] font-bold text-amber-400 tabular-nums whitespace-nowrap">
          {totalSquadValue ? formatClubValue(totalSquadValue) : "N/A"}
        </div>
      </div>
    </Link>
  );
}
