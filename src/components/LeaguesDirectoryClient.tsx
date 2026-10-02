"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { PageHeader } from "./PageHeader";
import { formatCompactEur } from "@/lib/utils";
import { getLeagueSlug } from "@/lib/slugs";
import { Card, Chip } from "@/components/ui";

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

const SORT_OPTIONS = [
  { label: "Highest Value", val: "val_desc" as const },
  { label: "Lowest Value", val: "val_asc" as const },
  { label: "Avg per Club", val: "avg_desc" as const },
  { label: "Name (A–Z)", val: "name_asc" as const },
];

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
    <div className="space-y-4 max-w-[720px] mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Leagues"
        subtitle="Europe's top competitions ranked by total market valuation"
      />

      {/* 2. Quick Sort Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.val}
            active={sortOption === opt.val}
            onClick={() => setSortOption(opt.val)}
          >
            {opt.label}
          </Chip>
        ))}
      </div>

      {/* 3. Leagues List in Card */}
      <Card className="p-1 overflow-hidden">
        {/* Sticky Desktop List Header */}
        <div className="sticky top-[var(--nav-height)] z-20 bg-[var(--bg-card)]/95 backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--divider)]">
          <div className="flex items-center gap-3">
            <span className="w-6 text-center">#</span>
            <span>League & Country</span>
          </div>
          <span>Total Market Value</span>
        </div>

        <div className="divide-y divide-[var(--divider)]">
          {sortedLeagues.map((league, idx) => {
            const flag = COUNTRY_FLAGS[league.country] || "🌐";
            return (
              <Link
                key={league.id}
                href={`/leagues/${getLeagueSlug(league)}`}
                className="flex items-center justify-between gap-3 min-h-[64px] px-3 sm:px-4 py-2 hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-xl"
              >
                {/* Left: Rank + Crest + Name & Metadata */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-6 text-center text-xs font-bold text-[var(--text-muted)] shrink-0 tabular-nums">
                    {idx + 1}
                  </span>

                  <div className="relative w-10 h-10 rounded-xl bg-[var(--bg-page)] p-1 flex items-center justify-center shrink-0 overflow-hidden">
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
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
                      {league.name}
                    </h3>
                    <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 truncate">
                      <span>{flag}</span>
                      <span>{league.country}</span>
                      <span>•</span>
                      <span>{league.clubCount} clubs</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline tabular-nums">{league.totalPlayers} players</span>
                    </div>
                  </div>
                </div>

                {/* Right: Valuations */}
                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-bold text-[var(--value-text)] tabular-nums block">
                    {formatDetailedLeagueValue(league.totalMarketValue)}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] tabular-nums block font-medium">
                    avg {formatCompactEur(league.avgSquadValue)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
