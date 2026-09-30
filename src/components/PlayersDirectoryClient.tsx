"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PlayerCard } from "./PlayerCard";
import { Search, Filter, X, TrendingUp, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

interface PlayerItem {
  id: string;
  fullName: string;
  commonName?: string | null;
  position: string;
  positionGroup?: string;
  canonicalPosition?: {
    detailed: string;
    group: "GK" | "DEF" | "MID" | "ATT";
  };
  nationality: string[];
  photoUrl?: string | null;
  sourceId?: string | null;
  externalId?: string | null;
  slug?: string | null;
  latestMarketValue?: number;
  age?: number | null;
  currentClub?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    league?: { name: string } | null;
  } | null;
}

interface PlayersDirectoryClientProps {
  initialPlayers: PlayerItem[];
}

const ITEMS_PER_PAGE = 24;

export function PlayersDirectoryClient({ initialPlayers }: PlayersDirectoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL state
  const queryParam = searchParams.get("q") || "";
  const posParam = searchParams.get("pos") || "ALL";
  const leagueParam = searchParams.get("league") || "ALL";
  const valParam = searchParams.get("val") || "ALL";
  const ageParam = searchParams.get("age") || "ALL";
  const sortParam = searchParams.get("sort") || "val_desc";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // Local state for smooth typing
  const [searchQuery, setSearchQuery] = useState(queryParam);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  // Helper to update search params
  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === "" || val === "ALL" || (key === "page" && val === "1")) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchQuery, page: "1" });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  // Derive distinct leagues from the dataset
  const availableLeagues = useMemo(() => {
    const leagues = new Set<string>();
    initialPlayers.forEach((p) => {
      const lName = p.currentClub?.league?.name;
      if (lName) leagues.add(lName);
    });
    return Array.from(leagues).sort();
  }, [initialPlayers]);

  // Filter & Sort
  const filteredPlayers = useMemo(() => {
    return initialPlayers.filter((p) => {
      // 1. Search Query
      if (queryParam) {
        const q = queryParam.toLowerCase();
        const nameMatch =
          p.fullName.toLowerCase().includes(q) ||
          (p.commonName && p.commonName.toLowerCase().includes(q));
        const clubMatch = p.currentClub?.name.toLowerCase().includes(q);
        const natMatch = p.nationality?.some((n) => n.toLowerCase().includes(q));
        if (!nameMatch && !clubMatch && !natMatch) return false;
      }

      // 2. Position Group
      if (posParam !== "ALL") {
        const group = p.canonicalPosition?.group || p.positionGroup;
        if (group) {
          if (group !== posParam) return false;
        } else {
          // Fallback matching
          if (posParam === "GK" && !p.position.toLowerCase().includes("goalkeeper")) return false;
          if (posParam === "DEF" && !p.position.toLowerCase().includes("back") && !p.position.toLowerCase().includes("defender")) return false;
          if (posParam === "MID" && !p.position.toLowerCase().includes("midfield")) return false;
          if (posParam === "ATT" && !p.position.toLowerCase().includes("forward") && !p.position.toLowerCase().includes("winger") && !p.position.toLowerCase().includes("striker")) return false;
        }
      }

      // 3. League
      if (leagueParam !== "ALL") {
        if (p.currentClub?.league?.name !== leagueParam) return false;
      }

      // 4. Value Range
      const val = p.latestMarketValue || 0;
      if (valParam === "150m_plus" && val < 150_000_000) return false;
      if (valParam === "100m_150m" && (val < 100_000_000 || val >= 150_000_000)) return false;
      if (valParam === "50m_100m" && (val < 50_000_000 || val >= 100_000_000)) return false;
      if (valParam === "under_50m" && val >= 50_000_000) return false;

      // 5. Age Bracket
      const age = p.age;
      if (ageParam !== "ALL" && typeof age === "number") {
        if (ageParam === "u21" && age >= 21) return false;
        if (ageParam === "21_25" && (age < 21 || age > 25)) return false;
        if (ageParam === "26_29" && (age < 26 || age > 29)) return false;
        if (ageParam === "30_plus" && age < 30) return false;
      }

      return true;
    }).sort((a, b) => {
      const valA = a.latestMarketValue || 0;
      const valB = b.latestMarketValue || 0;
      const ageA = a.age || 0;
      const ageB = b.age || 0;

      if (sortParam === "val_desc") return valB - valA;
      if (sortParam === "val_asc") return valA - valB;
      if (sortParam === "age_asc") return ageA - ageB;
      if (sortParam === "age_desc") return ageB - ageA;
      if (sortParam === "name_asc") return a.fullName.localeCompare(b.fullName);
      if (sortParam === "name_desc") return b.fullName.localeCompare(a.fullName);
      return valB - valA;
    });
  }, [initialPlayers, queryParam, posParam, leagueParam, valParam, ageParam, sortParam]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, pageParam), totalPages);
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const hasActiveFilters =
    Boolean(queryParam) ||
    posParam !== "ALL" ||
    leagueParam !== "ALL" ||
    valParam !== "ALL" ||
    ageParam !== "ALL" ||
    sortParam !== "val_desc";

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="rounded-3xl glass-panel p-4 sm:p-6 border border-slate-800 space-y-4">
        {/* Top Row: Search Input & Sort Selector */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => updateParams({ q: searchQuery, page: "1" })}
              placeholder="Search by player name, club, or nationality..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400/80 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  updateParams({ q: null, page: "1" });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <label htmlFor="player-sort-select" className="sr-only">Sort Players</label>
            <select
              id="player-sort-select"
              value={sortParam}
              onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
              className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-semibold focus:outline-none focus:border-amber-400/80 cursor-pointer"
            >
              <option value="val_desc">Market Value: High to Low</option>
              <option value="val_asc">Market Value: Low to High</option>
              <option value="age_asc">Age: Youngest First</option>
              <option value="age_desc">Age: Oldest First</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Position Group Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Position:
          </span>
          {[
            { key: "ALL", label: "All Positions" },
            { key: "ATT", label: "Attack (ATT)" },
            { key: "MID", label: "Midfield (MID)" },
            { key: "DEF", label: "Defense (DEF)" },
            { key: "GK", label: "Goalkeepers (GK)" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => updateParams({ pos: tab.key, page: "1" })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                posParam === tab.key
                  ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Multi-faceted Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {/* League Filter */}
          <div>
            <label htmlFor="league-filter" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              League
            </label>
            <select
              id="league-filter"
              value={leagueParam}
              onChange={(e) => updateParams({ league: e.target.value, page: "1" })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white text-xs font-medium focus:outline-none focus:border-amber-400 cursor-pointer truncate"
            >
              <option value="ALL">All Competitions</option>
              {availableLeagues.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Value Range Filter */}
          <div>
            <label htmlFor="val-filter" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Valuation Bracket
            </label>
            <select
              id="val-filter"
              value={valParam}
              onChange={(e) => updateParams({ val: e.target.value, page: "1" })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white text-xs font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">All Valuations</option>
              <option value="150m_plus">€150M+ (Elite Tier)</option>
              <option value="100m_150m">€100M – €150M</option>
              <option value="50m_100m">€50M – €100M</option>
              <option value="under_50m">Under €50M</option>
            </select>
          </div>

          {/* Age Bracket Filter */}
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="age-filter" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Age Bracket
            </label>
            <select
              id="age-filter"
              value={ageParam}
              onChange={(e) => updateParams({ age: e.target.value, page: "1" })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white text-xs font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">All Ages</option>
              <option value="u21">Under 21 (Prospects)</option>
              <option value="21_25">21–25 Years (Ascending)</option>
              <option value="26_29">26–29 Years (Prime)</option>
              <option value="30_plus">30+ Years (Veterans)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">Active filters:</span>
            {queryParam && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                Keyword: &quot;{queryParam}&quot;
                <button type="button" onClick={() => updateParams({ q: null, page: "1" })}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            {posParam !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                Position: {posParam}
                <button type="button" onClick={() => updateParams({ pos: null, page: "1" })}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            {leagueParam !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                League: {leagueParam}
                <button type="button" onClick={() => updateParams({ league: null, page: "1" })}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            {valParam !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                Value: {valParam}
                <button type="button" onClick={() => updateParams({ val: null, page: "1" })}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            {ageParam !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                Age: {ageParam}
                <button type="button" onClick={() => updateParams({ age: null, page: "1" })}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-medium ml-1"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Header & Results Count (B1: Count and heading ALWAYS agree!) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              {hasActiveFilters
                ? `Filtered Valuations (${filteredPlayers.length} found)`
                : `Top ${initialPlayers.length} Worldwide Valuations`}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>
              Showing {filteredPlayers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)} of {filteredPlayers.length} players ranked
            </span>
          </div>
        </div>

        {/* Players Grid */}
        {paginatedPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 4xl:grid-cols-6 gap-3.5 sm:gap-4">
            {paginatedPlayers.map((p) => (
              <PlayerCard key={p.id} player={p as any} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl glass-panel p-12 border border-slate-800 text-center space-y-3">
            <p className="text-slate-300 text-sm font-semibold">No players match the selected filters.</p>
            <p className="text-slate-500 text-xs">Try adjusting your search criteria, position group, or valuation range.</p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => updateParams({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="font-semibold text-slate-300">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => updateParams({ page: String(currentPage + 1) })}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-400 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
