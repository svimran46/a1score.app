import React from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getClubShortName } from "@/lib/data/clubs";

export interface PlayerRowProps {
  rank?: number | string;
  id: string;
  name: string;
  slug?: string | null;
  photoUrl?: string | null;
  club?: {
    name?: string | null;
    shortName?: string | null;
    logoUrl?: string | null;
  } | null;
  position?: string | null;
  marketValue?: number | null;
  change?: number | null; // Net value change e.g. +10_000_000 or -5_000_000
  className?: string;
}

/**
 * Standard PlayerRow component (exact 72px tall).
 * [rank 28px muted] [photo 48px round]
 * [name 16px semibold, 1 line / club crest 14px + short name · position, 13px muted]
 * [right: value 16px bold gold, optional change chip below 12px green/red].
 * Position is plain muted text, NOT a pill.
 * Used on Home (Most Valuable + Movers), Players Rankings, and Players Movers.
 */
export function PlayerRow({
  rank,
  id,
  name,
  slug,
  photoUrl,
  club,
  position,
  marketValue,
  change,
  className = "",
}: PlayerRowProps) {
  const href = slug ? `/players/${slug}` : `/players/${id}`;
  const clubShortName = club ? getClubShortName(club.shortName || club.name || "") : null;

  return (
    <Link
      href={href}
      className={`h-[72px] flex items-center gap-3 px-3 sm:px-4 hover:bg-slate-800/40 transition-colors w-full group ${className}`}
    >
      {/* Rank (28px wide muted) */}
      <span className="w-7 text-center text-xs font-semibold text-slate-500 tabular-nums shrink-0">
        {rank ?? ""}
      </span>

      {/* Photo (48px round) */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60 group-hover:scale-105 transition-transform">
        <EntityImage
          src={photoUrl}
          alt={name}
          fill
          sizes="48px"
          entityType="player"
          className="object-cover"
        />
      </div>

      {/* Middle: Name (16px semibold) & Subline (13px muted: crest + short name · position) */}
      <div className="flex-1 min-w-0">
        <div className="text-[16px] font-semibold text-white truncate leading-tight group-hover:text-amber-400 transition-colors">
          {name}
        </div>
        <div className="text-[13px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
          {club?.logoUrl && (
            <span className="relative w-3.5 h-3.5 shrink-0 inline-block overflow-hidden">
              <EntityImage
                src={club.logoUrl}
                alt=""
                fill
                sizes="14px"
                entityType="club"
                className="object-contain"
              />
            </span>
          )}
          {clubShortName && <span className="truncate">{clubShortName}</span>}
          {clubShortName && position && <span className="text-slate-600">·</span>}
          {position && <span className="truncate text-slate-400 font-normal">{position}</span>}
        </div>
      </div>

      {/* Right: Value (16px bold gold) & optional change chip below (12px green/red) */}
      <div className="shrink-0 text-right">
        <div className="text-[16px] font-bold text-amber-400 tabular-nums whitespace-nowrap">
          {marketValue ? formatCompactEur(marketValue) : "N/A"}
        </div>
        {change != null && change !== 0 && (
          <div
            className={`text-[12px] font-semibold tabular-nums mt-0.5 inline-flex items-center px-1.5 py-0.2 rounded ${
              change > 0
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-rose-400 bg-rose-500/10"
            }`}
          >
            {change > 0 ? `+${formatCompactEur(change)}` : `-${formatCompactEur(Math.abs(change))}`}
          </div>
        )}
      </div>
    </Link>
  );
}
