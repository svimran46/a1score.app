import React from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getClubShortName } from "@/lib/data/clubs";
import { getPositionAbbreviation } from "@/lib/positions";
import { TrendingUp, TrendingDown } from "lucide-react";
import { FollowButton } from "@/components/watchlist/FollowButton";

export interface PlayerRowProps {
  rank?: number | string;
  id: string;
  name: string;
  slug?: string | null;
  photoUrl?: string | null;
  avatarUrl?: string | null;
  club?: {
    name?: string | null;
    shortName?: string | null;
    logoUrl?: string | null;
  } | null;
  clubName?: string | null;
  clubCrest?: string | null;
  position?: string | null;
  age?: number | null;
  nationality?: string | string[] | null;
  marketValue?: number | null;
  change?: number | null;
  trendPercentage?: number | null;
  trendDiff?: number | null;
  className?: string;
}

/**
 * a1score PlayerRow Component (valuation-first, height --row-height):
 * rank (24px, muted) | avatar 40px round | name (600) over club crest + club (muted, text-sm) | ... | value (amber, tabular-nums, right-aligned, 700) + trend arrow with % | star button
 * - Trend uses arrow + number, never color alone.
 * - On mobile, hide secondary columns but always keep name, club, and value.
 * - Star button is desktop hover/focus, always visible when followed, 44px tap target.
 */
export function PlayerRow({
  rank,
  id,
  name,
  slug,
  photoUrl,
  avatarUrl,
  club,
  clubName,
  clubCrest,
  position,
  age,
  nationality,
  marketValue,
  change,
  trendPercentage,
  trendDiff,
  className = "",
}: PlayerRowProps) {
  const href = slug ? `/players/${slug}` : `/players/${id}`;
  const effectivePhoto = photoUrl || avatarUrl;
  const effectiveClubName = club ? getClubShortName(club.shortName || club.name || "") : clubName ? getClubShortName(clubName) : null;
  const effectiveClubLogo = club?.logoUrl || clubCrest;
  const posAbbr = position ? getPositionAbbreviation(position) : null;

  const diffVal = trendDiff ?? change;
  const hasTrend = typeof trendPercentage === "number" || (typeof diffVal === "number" && diffVal !== 0);
  const isUp = (diffVal ?? trendPercentage ?? 0) >= 0;
  const sign = isUp ? "+" : "−";

  const trendStr =
    typeof trendPercentage === "number"
      ? `${isUp ? "+" : ""}${trendPercentage.toFixed(1)}%`
      : typeof diffVal === "number" && diffVal !== 0
      ? `${sign}${formatCompactEur(Math.abs(diffVal))}`
      : null;

  const natStr = Array.isArray(nationality) ? nationality[0] : nationality;

  return (
    <div
      className={`group relative flex items-center justify-between gap-3 px-3 sm:px-4 h-[var(--row-height)] min-h-[64px] rounded-xl hover:bg-[var(--bg-hover)] transition-colors select-none ${className}`}
    >
      <Link
        href={href}
        aria-label={name}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      />

      {/* 1. Left side: Rank + Avatar + Name / Club */}
      <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10 pointer-events-none">
        {rank != null && (
          <span className="w-6 text-center text-xs sm:text-sm font-bold text-[var(--text-muted)] shrink-0 tabular-nums">
            {rank}
          </span>
        )}

        {/* Avatar (40px round) */}
        <div className="w-10 h-10 rounded-full bg-[var(--bg-chip)] overflow-hidden shrink-0 flex items-center justify-center relative">
          <EntityImage
            src={effectivePhoto}
            alt={name}
            width={40}
            height={40}
            entityType="player"
            className="object-cover w-full h-full"
          />
        </div>

        {/* Name over Club Crest + Club Name */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors leading-tight">
            {name}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5 truncate">
            {effectiveClubLogo && (
              <span className="relative w-3.5 h-3.5 shrink-0 inline-block overflow-hidden">
                <EntityImage
                  src={effectiveClubLogo}
                  alt=""
                  width={14}
                  height={14}
                  entityType="club"
                  className="object-contain w-3.5 h-3.5"
                />
              </span>
            )}
            {effectiveClubName && <span className="truncate">{effectiveClubName}</span>}
            {posAbbr && (
              <>
                <span className="text-[var(--divider)]">·</span>
                <span className="truncate">{posAbbr}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Middle: Secondary info (hidden on mobile) */}
      {(age != null || natStr) && (
        <div className="hidden md:flex items-center gap-3 text-xs text-[var(--text-muted)] shrink-0 px-2 relative z-10 pointer-events-none">
          {age != null && <span className="tabular-nums">{age} yrs</span>}
          {natStr && <span className="truncate max-w-[90px]">{natStr}</span>}
        </div>
      )}

      {/* 3. Right side: Value + Trend + FollowButton */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 relative z-10">
        <div className="text-right pointer-events-none">
          <div className="text-sm sm:text-base font-bold text-[var(--value-text)] tabular-nums leading-tight">
            {marketValue ? formatCompactEur(marketValue) : "—"}
          </div>
          {hasTrend && trendStr && (
            <div
              className={`flex items-center justify-end gap-0.5 text-xs font-bold tabular-nums leading-tight mt-0.5 ${
                isUp ? "text-[var(--trend-up)]" : "text-[var(--trend-down)]"
              }`}
            >
              {isUp ? (
                <TrendingUp className="w-3 h-3 shrink-0" aria-label="Valuation increased" />
              ) : (
                <TrendingDown className="w-3 h-3 shrink-0" aria-label="Valuation decreased" />
              )}
              <span>{trendStr}</span>
            </div>
          )}
        </div>

        <FollowButton
          id={id}
          type="player"
          name={name}
          slug={slug}
          avatarUrl={effectivePhoto}
          clubName={effectiveClubName}
          clubCrest={effectiveClubLogo}
          position={posAbbr}
          marketValue={marketValue}
          variant="icon"
          desktopHoverOnly={true}
          className="pointer-events-auto shrink-0"
        />
      </div>
    </div>
  );
}
