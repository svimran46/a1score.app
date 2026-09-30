"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getClubSlug } from "@/lib/slugs";
import {
  Search,
  Filter,
  X,
  Shield,
  Trophy,
  Users,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Calendar,
} from "lucide-react";

export interface ClubDirectoryItem {
  id: string;
  name: string;
  logoUrl?: string | null;
  shortName?: string | null;
  country?: string | null;
  leagueName?: string | null;
  leagueId?: string | null;
  playerCount: number | null;
  totalSquadValue: number;
  averageAge?: string | null;
  leagueRank?: number | null;
}

interface ClubsDirectoryClientProps {
  initialClubs: ClubDirectoryItem[];
}

const ITEMS_PER_PAGE = 24;

// High precision formatting for club squad values to distinguish ranking ties
export function formatDetailedClubValue(value: number): string {
  if (!value || value === 0) return "N/A";
  if (value >= 1_000_000_000) {
    const valInB = value / 1_000_000_000;
    return `€${valInB.toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    const valInM = value / 1_000_000;
    return `€${valInM.toFixed(1)}M`;
  }
  return formatCompactEur(value);
}

export function ClubsDirectoryClient({ initialClubs }: ClubsDirectoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Read URL params
  const queryParam = searchParams.get("q") || "";
  const leagueParam = searchParams.get("league") || "ALL";
  const countryParam = searchParams.get("country") || "ALL";
  const sortParam = searchParams.get("sort") || "val_desc";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const [searchQuery, setSearchQuery] = useState(queryParam);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

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

  // Derive distinct leagues and countries
  const availableLeagues = useMemo(() => {
    const leagues = new Set<string>();
    initialClubs.forEach((c) => {
      if (c.leagueName) leagues.add(c.leagueName);
    });
    return Array.from(leagues).sort();
  }, [initialClubs]);

  const availableCountries = useMemo(() => {
    const countries = new Set<string>();
    initialClubs.forEach((c) => {
      if (c.country) countries.add(c.country);
    });
    return Array.from(countries).sort();
  }, [initialClubs]);

  const selectedLeagueValue = useMemo(() => {
    if (leagueParam === "ALL") return "ALL";
    const norm = (s: string) => s.toLowerCase().replace(/[\s\-_]+/g, "");
    const match = availableLeagues.find((l) => norm(l) === norm(leagueParam));
    return match || leagueParam;
  }, [leagueParam, availableLeagues]);

  const selectedCountryValue = useMemo(() => {
    if (countryParam === "ALL") return "ALL";
    const norm = (s: string) => s.toLowerCase().replace(/[\s\-_]+/g, "");
    const match = availableCountries.find((c) => norm(c) === norm(countryParam));
    return match || countryParam;
  }, [countryParam, availableCountries]);

  // Filter & Deterministic Sort
  const filteredClubs = useMemo(() => {
    return initialClubs.filter((c) => {
      // 1. Search Query
      if (queryParam) {
        const q = queryParam.toLowerCase();
        const nameMatch = c.name.toLowerCase().includes(q);
        const leagueMatch = c.leagueName?.toLowerCase().includes(q);
        const countryMatch = c.country?.toLowerCase().includes(q);
        if (!nameMatch && !leagueMatch && !countryMatch) return false;
      }

      // 2. League Filter (normalized for whitespace, casing, and dashes)
      if (leagueParam !== "ALL") {
        const norm = (s: string) => s.toLowerCase().replace(/[\s\-_]+/g, "");
        if (norm(c.leagueName || "") !== norm(leagueParam)) return false;
      }

      // 3. Country Filter (normalized)
      if (countryParam !== "ALL") {
        const norm = (s: string) => s.toLowerCase().replace(/[\s\-_]+/g, "");
        if (norm(c.country || "") !== norm(countryParam)) return false;
      }

      return true;
    }).sort((a, b) => {
      const valA = a.totalSquadValue || 0;
      const valB = b.totalSquadValue || 0;
      const sizeA = a.playerCount || 0;
      const sizeB = b.playerCount || 0;
      const ageA = parseFloat(a.averageAge || "0") || 0;
      const ageB = parseFloat(b.averageAge || "0") || 0;

      if (sortParam === "val_desc") {
        if (valB !== valA) return valB - valA;
        return a.name.localeCompare(b.name); // deterministic tie-break
      }
      if (sortParam === "val_asc") {
        if (valA !== valB) return valA - valB;
        return a.name.localeCompare(b.name);
      }
      if (sortParam === "size_desc") return sizeB - sizeA || a.name.localeCompare(b.name);
      if (sortParam === "size_asc") return sizeA - sizeB || a.name.localeCompare(b.name);
      if (sortParam === "age_asc") return ageA - ageB || a.name.localeCompare(b.name);
      if (sortParam === "age_desc") return ageB - ageA || a.name.localeCompare(b.name);
      if (sortParam === "name_asc") return a.name.localeCompare(b.name);
      if (sortParam === "name_desc") return b.name.localeCompare(a.name);

      return valB - valA;
    });
  }, [initialClubs, queryParam, leagueParam, countryParam, sortParam]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredClubs.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, pageParam), totalPages);
  const paginatedClubs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClubs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClubs, currentPage]);

  const hasActiveFilters =
    Boolean(queryParam) ||
    leagueParam !== "ALL" ||
    countryParam !== "ALL" ||
    sortParam !== "val_desc";

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls Panel */}
      <div className="rounded-3xl glass-panel p-4 sm:p-6 border border-slate-800 space-y-4">
        {/* Top: Search bar & Sort selector */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => updateParams({ q: searchQuery, page: "1" })}
              placeholder="Search by club name, league, or nation..."
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
            <label htmlFor="club-sort-select" className="sr-only">Sort Clubs</label>
            <select
              id="club-sort-select"
              value={sortParam}
              onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
              className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-semibold focus:outline-none focus:border-amber-400/80 cursor-pointer"
            >
              <option value="val_desc">Squad Value: High to Low</option>
              <option value="val_asc">Squad Value: Low to High</option>
              <option value="size_desc">Squad Size: Largest</option>
              <option value="size_asc">Squad Size: Smallest</option>
              <option value="age_asc">Average Age: Youngest</option>
              <option value="age_desc">Average Age: Oldest</option>
              <option value="name_asc">Club Name: A to Z</option>
              <option value="name_desc">Club Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
          {/* League Filter */}
          <div>
            <label htmlFor="clubs-league-filter" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Competition / League
            </label>
            <select
              id="clubs-league-filter"
              value={selectedLeagueValue}
              onChange={(e) => updateParams({ league: e.target.value, page: "1" })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer truncate"
            >
              <option value="ALL">All Competitions ({initialClubs.length} Clubs)</option>
              {availableLeagues.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <label htmlFor="clubs-country-filter" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Country
            </label>
            <select
              id="clubs-country-filter"
              value={selectedCountryValue}
              onChange={(e) => updateParams({ country: e.target.value, page: "1" })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer truncate"
            >
              <option value="ALL">All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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
            {leagueParam !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                League: {leagueParam}
                <button type="button" onClick={() => updateParams({ league: null, page: "1" })}>
                  <X className="w-3 h-3 hover:text-white" />
                </button>
              </span>
            )}
            {countryParam !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                Country: {countryParam}
                <button type="button" onClick={() => updateParams({ country: null, page: "1" })}>
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

      {/* Dynamic Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            {hasActiveFilters
              ? `Filtered Clubs (${filteredClubs.length} found)`
              : `All Registered Clubs (${initialClubs.length})`}
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Showing {filteredClubs.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredClubs.length)} of {filteredClubs.length} clubs
        </span>
      </div>

      {/* Clubs Grid */}
      {paginatedClubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-3.5 sm:gap-4">
          {paginatedClubs.map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${getClubSlug(club)}`}
              className="group rounded-2xl glass-panel glass-panel-hover p-4 border border-slate-800 flex flex-col justify-between gap-3 transition-all"
            >
              {/* Top Row: Crest, Name, League */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-xl bg-slate-800 p-2 shrink-0 overflow-hidden border border-slate-700/60 group-hover:scale-105 transition-transform">
                  <EntityImage
                    src={club.logoUrl}
                    alt=""
                    fill
                    sizes="48px"
                    entityType="club"
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-amber-400 transition-colors" title={club.name}>
                    {club.shortName || club.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
                    <span className="truncate">{club.leagueName || club.country || "Club"}</span>
                    {club.leagueRank && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700 text-[10px] shrink-0">
                        #{club.leagueRank}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Detailed Metrics & High-Precision Squad Value */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1" title="First Team Squad Size">
                    <Users className="w-3 h-3 text-slate-500" />
                    {club.playerCount ? `${club.playerCount} First Team` : "Squad"}
                  </span>
                  {club.averageAge && (
                    <span className="flex items-center gap-1" title="Average Squad Age">
                      • {club.averageAge} yrs
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] text-slate-500 block uppercase font-semibold">Squad Value</span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-400 tabular-nums whitespace-nowrap">
                    {formatDetailedClubValue(club.totalSquadValue)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl glass-panel p-12 border border-slate-800 text-center space-y-3">
          <p className="text-slate-300 text-sm font-semibold">No clubs match the selected filters.</p>
          <p className="text-slate-500 text-xs">Try adjusting your search query, country, or league filter.</p>
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
    </div>
  );
}
