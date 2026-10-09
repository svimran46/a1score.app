import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";
import { formatCompactEur } from "@/lib/utils";

export interface ClubRowProps {
  rank?: number | string;
  id?: string;
  name: string;
  slug?: string | null;
  href?: string;
  crestUrl?: string | null;
  leagueName?: string | null;
  country?: string | null;
  squadSize?: number | null;
  squadValue?: number | null;
  className?: string;
}

/**
 * FotMob-style ClubRow component:
 * crest | club name over league (muted) | squad value (amber, tabular-nums, right)
 */
export function ClubRow({
  rank,
  id,
  name,
  slug,
  href = slug ? `/clubs/${slug}` : id ? `/clubs/${id}` : "/clubs",
  crestUrl,
  leagueName,
  country,
  squadSize,
  squadValue,
  className = "",
}: ClubRowProps) {
  const subline = [leagueName, country].filter(Boolean).join(" · ");

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-3 px-3 sm:px-4 h-[var(--row-height)] min-h-[64px] rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] w-full select-none ${className}`}
    >
      {/* Left side: Rank + Crest + Club Name over League */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {rank !== undefined && rank !== null && (
          <span className="w-6 text-center text-xs sm:text-sm font-bold text-[var(--text-muted)] shrink-0 tabular-nums">
            {rank}
          </span>
        )}

        {/* Club Crest 40px */}
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-chip)] flex items-center justify-center shrink-0 overflow-hidden relative">
          {crestUrl ? (
            <Image
              src={crestUrl}
              alt={name}
              width={28}
              height={28}
              className="object-contain"
              unoptimized
            />
          ) : (
            <Shield className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </div>

        {/* Name over League */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors">
            {name}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
            {subline || "Football Club"}
          </div>
        </div>
      </div>

      {/* Middle: Squad Size (desktop/tablet) */}
      {squadSize !== null && squadSize !== undefined && (
        <div className="hidden sm:block text-xs text-[var(--text-muted)] shrink-0 px-2 tabular-nums">
          {squadSize} players
        </div>
      )}

      {/* Right side: Squad Value (amber, tabular-nums, right-aligned, 700) */}
      <div className="text-right shrink-0">
        <div className="text-sm sm:text-base font-bold text-[var(--value-text)] figure tabular-nums leading-tight">
          {squadValue ? formatCompactEur(squadValue) : "—"}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold leading-tight mt-0.5">
          Squad Value
        </div>
      </div>
    </Link>
  );
}
