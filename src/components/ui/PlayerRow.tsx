import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { formatCompactEur } from "@/lib/utils";

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
 * rank (24px, muted) | avatar 40px round | name (600) over club crest + club (muted, text-sm) | ... | value (amber, tabular-nums, right-aligned, 700) + trend arrow with %
 * - Trend uses arrow + number, never color alone.
 * - On mobile, hide secondary columns but always keep name, club, and value.
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
    <Link
      href={href}
      className={`group flex items-center justify-between gap-3 px-3 sm:px-4 h-[var(--row-height)] min-h-[64px] rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] w-full select-none ${className}`}
    >
      {/* Left side: Rank + Avatar + Name / Club */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
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
            {position && (
              <>
                <span className="text-[var(--divider)]">·</span>
                <span className="truncate">{position}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Secondary columns (hidden on mobile, visible on tablet/desktop) */}
      {(age !== null && age !== undefined || nationality) && (
        <div className="hidden md:flex items-center gap-4 text-xs text-[var(--text-muted)] shrink-0 px-2">
          {age !== null && age !== undefined && (
            <span className="tabular-nums">{age} yrs</span>
          )}
          {nationality && <span className="truncate max-w-[100px]">{nationality}</span>}
        </div>
      )}

      {/* Right side: Value (amber, tabular-nums, right-aligned, 700) + Trend */}
      <div className="text-right shrink-0">
        <div className="text-sm sm:text-base font-bold text-[var(--value-text)] tabular-nums leading-tight">
          {marketValue ? formatCompactEur(marketValue) : "—"}
        </div>
        {hasTrend && pctStr && (
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
            <span>{pctStr}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
