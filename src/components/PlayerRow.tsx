import React from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getClubShortName } from "@/lib/data/clubs";
import { getPositionAbbreviation } from "@/lib/positions";

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
  change?: number | null;
  className?: string;
}

/**
 * a1score PlayerRow Component (fixed height 64 to 72, dividers only, no border box):
 * [rank (secondary 13)] [photo circle] [name (15/500, no truncate) with meta (13 secondary) below] [value right (15/600 gold)].
 * Meta: club crest 14px + short club name + abbreviated position (RW, CF, CM).
 * Change: +€30M / −€10M with true minus sign.
 * Never shows 'N/A'.
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
  const posAbbr = position ? getPositionAbbreviation(position) : null;

  let changeFormatted: string | null = null;
  let isPositiveChange = true;
  if (typeof change === "number" && change !== 0) {
    isPositiveChange = change > 0;
    const sign = change > 0 ? "+" : "−"; // true minus sign \u2212
    const absVal = Math.abs(change);
    changeFormatted = `${sign}${formatCompactEur(absVal)}`;
  }

  return (
    <Link
      href={href}
      className={`h-[68px] min-h-[64px] max-h-[72px] flex items-center gap-3 px-3 sm:px-4 hover:bg-white/[0.02] transition-colors w-full ${className}`}
    >
      {/* Rank (secondary text 13px) */}
      {rank != null && (
        <span
          className="w-6 text-center text-[13px] font-normal tabular-nums shrink-0"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {rank}
        </span>
      )}

      {/* Photo circle */}
      <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/5 bg-slate-800/80">
        <EntityImage
          src={photoUrl}
          alt={name}
          width={44}
          height={44}
          entityType="player"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Middle: Name (15/500, wraps up to 2 lines, no ellipsis) & Meta (13 secondary) */}
      <div className="flex-1 min-w-0 pr-2">
        <div
          className="text-[15px] font-medium leading-snug line-clamp-2"
          style={{ color: "var(--color-text)" }}
        >
          {name}
        </div>
        <div
          className="text-[13px] font-normal flex items-center gap-1.5 mt-0.5"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {club?.logoUrl && (
            <span className="relative w-3.5 h-3.5 shrink-0 inline-block overflow-hidden">
              <EntityImage
                src={club.logoUrl}
                alt=""
                width={14}
                height={14}
                entityType="club"
                className="object-contain w-3.5 h-3.5"
              />
            </span>
          )}
          {clubShortName && <span>{clubShortName}</span>}
          {clubShortName && posAbbr && <span>·</span>}
          {posAbbr && <span>{posAbbr}</span>}
        </div>
      </div>

      {/* Right: Value (15/600 gold) + optional change */}
      <div className="shrink-0 text-right flex flex-col items-end justify-center">
        {marketValue != null && (
          <div
            className="text-[15px] font-semibold tabular-nums leading-tight"
            style={{ color: "var(--color-accent)" }}
          >
            {formatCompactEur(marketValue)}
          </div>
        )}
        {changeFormatted && (
          <div
            className="text-[12px] font-medium tabular-nums mt-0.5 leading-tight"
            style={{
              color: isPositiveChange ? "var(--color-positive)" : "var(--color-negative)",
            }}
          >
            {changeFormatted}
          </div>
        )}
      </div>
    </Link>
  );
}
