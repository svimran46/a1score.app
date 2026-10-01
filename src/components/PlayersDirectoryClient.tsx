"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PlayerCard } from "./PlayerCard";
import { PageHeader } from "./PageHeader";
import { FilterBar } from "./FilterBar";
import { MarketMovers } from "./MarketMovers";
import type { MarketMover } from "@/lib/data/players";
import { ChevronLeft, ChevronRight, TrendingUp, SlidersHorizontal, Filter, ChevronDown, ChevronUp } from "lucide-react";

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
  movers?: { risers: MarketMover[]; fallers: MarketMover[] };
  latestRevisionDate?: string;
}

const ITEMS_PER_PAGE = 40;

export function PlayersDirectoryClient({
  initialPlayers,
  movers,
  latestRevisionDate,
}: PlayersDirectoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Collapsible movers state
  const [showMovers, setShowMovers] = useState(false);

  // URL state
  const queryParam = searchParams.get("q") || "";
  const posParam = searchParams.get("pos") || "ALL";
  const leagueParam = searchParams.get("league") || "ALL";
  const valParam = searchParams.get("val") || "ALL";
  const ageParam = searchParams.get("age") || "ALL";
  const sortParam = searchParams.get("sort") || "val_desc";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // Local search input state
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

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (queryParam) count++;
    if (posParam !== "ALL") count++;
    if (leagueParam !== "ALL") count++;
    if (valParam !== "ALL") count++;
    if (ageParam !== "ALL") count++;
    if (sortParam !== "val_desc") count++;
    return count;
  }, [queryParam, posParam, leagueParam, valParam, ageParam, sortParam]);

  // Filter & Deterministic Sort
  const filteredPlayers = useMemo(() => {
    return initialPlayers
      .filter((p) => {
        // Search query
        if (queryParam) {
          const q = queryParam.toLowerCase();
          const nameMatch =
            p.fullName.toLowerCase().includes(q) ||
            (p.commonName && p.commonName.toLowerCase().includes(q));
          const clubMatch = p.currentClub?.name.toLowerCase().includes(q);
          const nationMatch = p.nationality?.some((n) => n.toLowerCase().includes(q));
          if (!nameMatch && !clubMatch && !nationMatch) return false;
        }

        // Position group
        if (posParam !== "ALL") {
          const grp = p.canonicalPosition?.group || p.positionGroup;
          if (grp !== posParam) return false;
        }

        // League
        if (leagueParam !== "ALL") {
          if (p.currentClub?.league?.name !== leagueParam) return false;
        }

        // Valuation Bracket
        const val = p.latestMarketValue || 0;
        if (valParam === "150m_plus" && val < 150_000_000) return false;
        if (valParam === "100m_150m" && (val < 100_000_000 || val >= 150_000_000)) return false;
        if (valParam === "50m_100m" && (val < 50_000_000 || val >= 100_000_000)) return false;
        if (valParam === "under_50m" && val >= 50_000_000) return false;

        // Age Bracket
        const age = p.age || 0;
        if (ageParam === "u21" && (age <= 0 || age > 21)) return false;
        if (ageParam === "21_25" && (age < 21 || age > 25)) return false;
        if (ageParam === "26_30" && (age < 26 || age > 30)) return false;
        if (ageParam === "over_30" && age <= 30) return false;

        return true;
      })
      .sort((a, b) => {
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

  const hasMovers = movers && (movers.risers.length > 0 || movers.fallers.length > 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 
        1. PAGE HEADER (<=72px, one-line title, one-line subtitle, no icon/paragraph)
      */}
      <PageHeader
        title="Players Directory & Valuations"
        subtitle={latestRevisionDate ? `Top valuations • ${latestRevisionDate}` : "Top market valuations worldwide"}
        actions={
          hasMovers ? (
            <button
              type="button"
              onClick={() => setShowMovers((prev) => !prev)}
              className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${
                showMovers
                  ? "bg-amber-400 text-slate-950 border-amber-400 shadow-sm"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
              }`}
              aria-label="Toggle market value movers"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Movers</span>
              {showMovers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : undefined
        }
      />

      {/* 
        2. COMPACT STICKY FILTER BAR (<=52px)
        Search input + "Filters" button opening Bottom Sheet. Never stacks dropdowns inline.
      */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          updateParams({ q: val || null, page: "1" });
        }}
        onSearchSubmit={handleSearchSubmit}
        placeholder="Search players, clubs, nationalities..."
        activeFilterCount={activeFilterCount}
        onResetFilters={handleClearFilters}
      >
        {/* Bottom Sheet Filter Content */}
        <div className="space-y-5">
          {/* Sort Selector */}
          <div>
            <label htmlFor="modal-player-sort" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Sort By
            </label>
            <select
              id="modal-player-sort"
              value={sortParam}
              onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="val_desc">Market Value: High to Low</option>
              <option value="val_asc">Market Value: Low to High</option>
              <option value="age_asc">Age: Youngest First</option>
              <option value="age_desc">Age: Oldest First</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>

          {/* Position Group Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Position
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    posParam === tab.key
                      ? "bg-amber-400 text-slate-950 font-bold shadow-xs"
                      : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* League Filter */}
          <div>
            <label htmlFor="modal-league-filter" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Competition / League
            </label>
            <select
              id="modal-league-filter"
              value={leagueParam}
              onChange={(e) => updateParams({ league: e.target.value, page: "1" })}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">All Competitions</option>
              {availableLeagues.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Valuation Range Filter */}
          <div>
            <label htmlFor="modal-val-filter" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Valuation Bracket
            </label>
            <select
              id="modal-val-filter"
              value={valParam}
              onChange={(e) => updateParams({ val: e.target.value, page: "1" })}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">All Valuations</option>
              <option value="150m_plus">€150M+ (Elite Tier)</option>
              <option value="100m_150m">€100M – €150M</option>
              <option value="50m_100m">€50M – €100M</option>
              <option value="under_50m">Under €50M</option>
            </select>
          </div>

          {/* Age Bracket Filter */}
          <div>
            <label htmlFor="modal-age-filter" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Age Bracket
            </label>
            <select
              id="modal-age-filter"
              value={ageParam}
              onChange={(e) => updateParams({ age: e.target.value, page: "1" })}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">All Ages</option>
              <option value="u21">U21 (Under 21)</option>
              <option value="21_25">21–25 Years</option>
              <option value="26_30">26–30 Years</option>
              <option value="over_30">30+ Years</option>
            </select>
          </div>
        </div>
      </FilterBar>

      {/* 
        COLLAPSIBLE MOVERS SECTION (When toggled open, never blocking directory by default)
      */}
      {showMovers && movers && (
        <div className="px-4 animate-in slide-in-from-top-2 duration-200">
          <MarketMovers risers={movers.risers} fallers={movers.fallers} />
        </div>
      )}

      {/* 
        3. RANKED DIRECTORY LIST (Starts immediately below header + filter bar)
        First player card is visible without scrolling on 390x844 viewport.
      */}
      <div
        className="px-4 space-y-3"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <div className="flex items-center justify-between text-xs text-slate-400 py-1">
          <span className="font-bold text-white">
            {activeFilterCount > 0
              ? `Filtered (${filteredPlayers.length} players)`
              : `Top ${initialPlayers.length} Worldwide Valuations`}
          </span>
          <span className="text-[11px] text-slate-500">
            Showing {filteredPlayers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)} of {filteredPlayers.length}
          </span>
        </div>

        {paginatedPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {paginatedPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl glass-panel max-h-[160px] py-6 px-4 border border-slate-800 text-center flex flex-col items-center justify-center space-y-2">
            <p className="text-xs font-semibold text-white">No players match the selected filters.</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search criteria or valuation bracket.</p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="min-h-[36px] px-3.5 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => updateParams({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1}
              className="min-h-[44px] flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="text-slate-400 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => updateParams({ page: String(currentPage + 1) })}
              disabled={currentPage >= totalPages}
              className="min-h-[44px] flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-400 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
