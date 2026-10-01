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
      {/* 1. Page Header (<=72px, one-line title, one-line subtitle) */}
      <PageHeader
        title="Competitions & Leagues"
        subtitle="Top 7 European leagues • Standings & market valuations"
        actions={
          <div className="flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <label htmlFor="league-sort" className="sr-only">
              Sort leagues
            </label>
            <select
              id="league-sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="val_desc">Value: High to Low</option>
              <option value="val_asc">Value: Low to High</option>
              <option value="avg_desc">Avg / Club</option>
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
              className="group rounded-xl glass-panel glass-panel-hover p-2.5 sm:p-3 border border-slate-800/80 flex items-center justify-between gap-2.5 min-h-[76px] max-h-[92px] transition-all hover:border-amber-500/30"
            >
              {/* Left: Crest / Flag + Name & Country */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-900/90 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                  {league.logoUrl ? (
                    <EntityImage
                      src={league.logoUrl}
                      alt=""
                      fill
                      sizes="44px"
                      entityType="league"
                      className="object-contain p-0.5"
                    />
                  ) : (
                    <span className="text-xl">{flag}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>{flag}</span>
                    <span className="truncate">{league.country}</span>
                    <span className="text-[10px] text-slate-500">• Tier {league.tier}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate group-hover:text-amber-400 transition-colors">
                    {league.name}
                  </h3>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 truncate">
                    <span>{league.clubCount} clubs</span>
                    <span>• {league.totalPlayers.toLocaleString("en-US")} players</span>
                  </div>
                </div>
              </div>

              {/* Right: Valuation Metrics */}
              <div className="text-right shrink-0 pl-1">
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Total Value</span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-400 tabular-nums whitespace-nowrap">
                  {formatDetailedLeagueValue(league.totalMarketValue)}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
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
