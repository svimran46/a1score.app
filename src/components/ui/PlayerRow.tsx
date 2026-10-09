import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, TrendingUp, TrendingDown } from "lucide-react";
import { formatCompactEur } from "@/lib/utils";
import { FollowButton } from "@/components/watchlist/FollowButton";

export interface PlayerRowProps {
  rank?: number | string;
  id?: string;
  name: string;
  slug?: string | null;
  href?: string;
  avatarUrl?: string | null;
  clubName?: string | null;
  clubCrest?: string | null;
  position?: string | null;
  age?: number | null;
  nationality?: string | null;
  marketValue?: number | null;
  trendPercentage?: number | null;
  trendDiff?: number | null;
  className?: string;
}

/**
 * FotMob-style PlayerRow component (valuation-first, height --row-height):
 * rank (24px, muted) | avatar 40px round | name (600) over club crest + club (muted, text-sm) | ... | value (amber, tabular-nums, right-aligned, 700) + trend arrow with % | star
 * - Trend uses arrow + number, never color alone.
 * - On mobile, hide secondary columns but always keep name, club, and value.
 * - Star button is desktop hover/focus, always visible when followed, 44px tap target.
 */
export function PlayerRow({
  rank,
  id,
  name,
  slug,
  href = slug ? `/players/${slug}` : id ? `/players/${id}` : "/players",
  avatarUrl,
  clubName,
  clubCrest,
  position,
  age,
  nationality,
  marketValue,
  trendPercentage,
  trendDiff,
  className = "",
}: PlayerRowProps) {
  const hasTrend = typeof trendPercentage === "number" || typeof trendDiff === "number";
  const isUp = (trendDiff ?? trendPercentage ?? 0) >= 0;
  const pctStr =
    typeof trendPercentage === "number"
      ? `${isUp ? "+" : ""}${trendPercentage.toFixed(1)}%`
      : typeof trendDiff === "number"
      ? `${isUp ? "+" : ""}${formatCompactEur(trendDiff)}`
      : null;

  return (
    <div
      className={`group relative flex items-center justify-between gap-3 px-3 sm:px-4 h-[var(--row-height)] min-h-[64px] rounded-xl hover:bg-[var(--bg-hover)] transition-colors select-none ${className}`}
    >
      <Link
        href={href}
        aria-label={name}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      />

      {/* Left side: Rank + Avatar + Name / Club */}
      <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10 pointer-events-none">
        {/* Rank (24px width, muted) */}
        {rank !== undefined && rank !== null && (
          <span className="w-6 text-center text-xs sm:text-sm font-bold text-[var(--text-muted)] shrink-0 tabular-nums">
            {rank}
          </span>
        )}

        {/* Avatar 40px round */}
        <div className="w-10 h-10 rounded-full bg-[var(--bg-chip)] overflow-hidden shrink-0 flex items-center justify-center relative">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <User className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </div>

        {/* Name over Club Crest + Club Name */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors">
            {name}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5 truncate">
            {clubCrest && (
              <div className="w-3.5 h-3.5 rounded shrink-0 overflow-hidden relative inline-block">
                <Image
                  src={clubCrest}
                  alt=""
                  width={14}
                  height={14}
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <span className="truncate">{clubName || "Free Agent"}</span>
            {/* Phones keep the club readable instead of truncating both */}
            {position && (
              <>
                <span className="hidden sm:inline text-[var(--divider)]">·</span>
                <span className="hidden sm:inline truncate">{position}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Secondary columns (hidden on mobile, visible on tablet/desktop) */}
      {((age !== null && age !== undefined) || nationality) && (
        <div className="hidden md:flex items-center gap-4 text-xs text-[var(--text-muted)] shrink-0 px-2 relative z-10 pointer-events-none">
          {age !== null && age !== undefined && (
            <span className="tabular-nums">{age} yrs</span>
          )}
          {nationality && <span className="truncate max-w-[100px]">{nationality}</span>}
        </div>
      )}

      {/* Right side: Value + Trend + FollowButton */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 relative z-10">
        <div className="text-right pointer-events-none">
          <div className="text-sm sm:text-base font-bold text-[var(--value-text)] figure tabular-nums leading-tight">
            {marketValue ? formatCompactEur(marketValue) : "—"}
          </div>
          {hasTrend && pctStr && (
            <div
              className={`flex items-center justify-end gap-0.5 text-xs font-bold figure leading-tight mt-0.5 ${
                isUp ? "text-[var(--trend-up)]" : "text-[var(--trend-down)]"
              }`}
            >
              {isUp ? (
                <TrendingUp className="w-3 h-3 shrink-0" aria-label="Valuation increased" />
              ) : (
                <TrendingDown className="w-3 h-3 shrink-0" aria-label="Valuation decreased" />
              )}
              <span>{pctStr}</span>
            </div>
          )}
        </div>

        <FollowButton
          id={id || slug || name}
          type="player"
          name={name}
          slug={slug}
          avatarUrl={avatarUrl}
          clubName={clubName}
          clubCrest={clubCrest}
          position={position}
          marketValue={marketValue}
          variant="icon"
          desktopHoverOnly={true}
          className="pointer-events-auto shrink-0"
        />
      </div>
    </div>
  );
}
