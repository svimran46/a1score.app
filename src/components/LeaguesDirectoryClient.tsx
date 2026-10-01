"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { PageHeader } from "./PageHeader";
import { formatCompactEur } from "@/lib/utils";
import { getLeagueSlug } from "@/lib/slugs";
import { SlidersHorizontal } from "lucide-react";

export interface LeagueListItem {
  id: string;
  name: string;
  country: string;
  tier: number;
  logoUrl?: string | null;
  clubCount: number;
  totalPlayers: number;
  totalMarketValue: number;
  avgSquadValue: number;
}

interface LeaguesDirectoryClientProps {
  initialLeagues: LeagueListItem[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Spain: "🇪🇸",
  Germany: "🇩🇪",
  Italy: "🇮🇹",
  France: "🇫🇷",
  Portugal: "🇵🇹",
  Netherlands: "🇳🇱",
};

export function formatDetailedLeagueValue(value: number): string {
  if (!value || value === 0) return "N/A";
  if (value >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    return `€${b.toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `€${m.toFixed(1)}M`;
  }
  return formatCompactEur(value);
}

export function LeaguesDirectoryClient({ initialLeagues }: LeaguesDirectoryClientProps) {
  const [sortOption, setSortOption] = useState<"val_desc" | "val_asc" | "avg_desc" | "name_asc">("val_desc");

  const sortedLeagues = useMemo(() => {
    return [...initialLeagues].sort((a, b) => {
      if (sortOption === "val_desc") return b.totalMarketValue - a.totalMarketValue;
      if (sortOption === "val_asc") return a.totalMarketValue - b.totalMarketValue;
      if (sortOption === "avg_desc") return b.avgSquadValue - a.avgSquadValue;
      if (sortOption === "name_asc") return a.name.localeCompare(b.name);
      return b.totalMarketValue - a.totalMarketValue;
    });
  }, [initialLeagues, sortOption]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Page Header (20/600 title, 13/400 subtitle) */}
      <PageHeader
        title="Leagues"
        subtitle="Top 7 European leagues • Standings & market valuations"
        actions={
          <div className="flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0 hidden sm:block" />
            <label htmlFor="league-sort" className="sr-only">
              Sort leagues
            </label>
            <select
              id="league-sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="min-h-[44px] px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-[13px] font-medium focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
            >
              <option value="val_desc">Value: High to low</option>
              <option value="val_asc">Value: Low to high</option>
              <option value="avg_desc">Avg per club</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        }
      />

      {/* 2. Grid of Compact League Cards (<=96px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
        {sortedLeagues.map((league) => {
          const flag = COUNTRY_FLAGS[league.country] || "🌐";
          return (
            <Link
              key={league.id}
              href={`/leagues/${getLeagueSlug(league)}`}
              className="group rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 flex items-center justify-between gap-2.5 min-h-[76px] transition-colors hover:border-[var(--color-accent)]"
            >
              {/* Left: Crest / Flag + Name & Country */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative w-10 h-10 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  {league.logoUrl ? (
                    <EntityImage
                      src={league.logoUrl}
                      alt=""
                      fill
                      sizes="40px"
                      entityType="league"
                      className="object-contain p-0.5"
                    />
                  ) : (
                    <span className="text-xl">{flag}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)]">
                    <span>{flag}</span>
                    <span className="truncate">{league.country}</span>
                    <span>• Tier {league.tier}</span>
                  </div>
                  <h3 className="text-[15px] font-medium text-[var(--color-text)] tracking-tight truncate group-hover:text-[var(--color-accent)] transition-colors">
                    {league.name}
                  </h3>
                  <div className="text-[13px] text-[var(--color-text-secondary)] mt-0.5 flex items-center gap-2 truncate">
                    <span>{league.clubCount} clubs</span>
                    <span>• {league.totalPlayers.toLocaleString("en-US")} players</span>
                  </div>
                </div>
              </div>

              {/* Right: Valuation Metrics */}
              <div className="text-right shrink-0 pl-1">
                <span className="text-[15px] font-semibold text-[var(--color-accent)] tabular-nums whitespace-nowrap block">
                  {formatDetailedLeagueValue(league.totalMarketValue)}
                </span>
                <span className="text-[13px] text-[var(--color-text-secondary)] block font-normal">
                  avg {formatCompactEur(league.avgSquadValue)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
