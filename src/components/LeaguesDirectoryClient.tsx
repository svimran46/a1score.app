"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getLeagueSlug } from "@/lib/slugs";
import {
  Trophy,
  Globe,
  Users,
  Shield,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

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
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Top 7 European Competitions ({initialLeagues.length})
          </h2>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <label htmlFor="league-sort" className="text-slate-400 font-medium">Sort by:</label>
          <select
            id="league-sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="val_desc">Total Value (Highest First)</option>
            <option value="val_asc">Total Value (Lowest First)</option>
            <option value="avg_desc">Average Club Value (Highest First)</option>
            <option value="name_asc">League Name (A to Z)</option>
          </select>
        </div>
      </div>

      {/* Grid of League Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedLeagues.map((league) => {
          const flag = COUNTRY_FLAGS[league.country] || "🌐";
          return (
            <Link
              key={league.id}
              href={`/leagues/${getLeagueSlug(league)}`}
              className="group rounded-3xl glass-panel glass-panel-hover p-5 border border-slate-800 flex flex-col justify-between gap-5 transition-all hover:border-amber-500/30"
            >
              {/* Header: Crest / Flag + Name & Country */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700/60 p-2 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    {league.logoUrl ? (
                      <EntityImage
                        src={league.logoUrl}
                        alt=""
                        fill
                        sizes="48px"
                        entityType="league"
                        className="object-contain p-1"
                      />
                    ) : (
                      <span className="text-2xl">{flag}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>{flag}</span>
                      <span className="truncate">{league.country}</span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight mt-0.5 truncate group-hover:text-amber-400 transition-colors">
                      {league.name}
                    </h3>
                  </div>
                </div>

                <div className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                  Tier {league.tier}
                </div>
              </div>

              {/* Middle Metric: Cumulative Market Value & Avg Squad Value */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    Total Value
                  </span>
                  <span className="text-base font-black text-amber-400 tabular-nums">
                    {formatDetailedLeagueValue(league.totalMarketValue)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    Avg / Club
                  </span>
                  <span className="text-base font-black text-slate-200 tabular-nums">
                    {formatCompactEur(league.avgSquadValue)}
                  </span>
                </div>
              </div>

              {/* Bottom Footer: Clubs & Players Count */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  {league.clubCount} Clubs
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {league.totalPlayers.toLocaleString("en-US")} Players
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
