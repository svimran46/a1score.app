"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { PageHeader } from "./PageHeader";
import { FilterBar } from "./FilterBar";
import { formatCompactEur } from "@/lib/utils";
import { getClubSlug } from "@/lib/slugs";
import { getClubDisplayName } from "@/lib/data/clubs";
import {
  ChevronLeft,
  ChevronRight,
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (queryParam) count++;
    if (leagueParam !== "ALL") count++;
    if (countryParam !== "ALL") count++;
    if (sortParam !== "val_desc") count++;
    return count;
  }, [queryParam, leagueParam, countryParam, sortParam]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 
        1. PAGE HEADER (<=72px, one-line title, one-line subtitle, no icon/paragraph)
      */}
      <PageHeader
        title="Football Clubs Directory"
        subtitle="Ranked by cumulative squad market value & squad metrics"
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
        placeholder="Search clubs, leagues, or nations..."
        activeFilterCount={activeFilterCount}
        onResetFilters={handleClearFilters}
      >
        <div className="space-y-4">
          {/* Sort Selector */}
          <div>
            <label htmlFor="modal-club-sort" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Sort By
            </label>
            <select
              id="modal-club-sort"
              value={sortParam}
              onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="val_desc">Squad Value: High to Low</option>
              <option value="val_asc">Squad Value: Low to High</option>
              <option value="size_desc">Squad Size: Largest First</option>
              <option value="size_asc">Squad Size: Smallest First</option>
              <option value="age_asc">Average Age: Youngest First</option>
              <option value="age_desc">Average Age: Oldest First</option>
              <option value="name_asc">Club Name: A to Z</option>
              <option value="name_desc">Club Name: Z to A</option>
            </select>
          </div>

          {/* Competition / League Filter */}
          <div>
            <label htmlFor="modal-club-league" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Competition / League
            </label>
            <select
              id="modal-club-league"
              value={selectedLeagueValue}
              onChange={(e) => updateParams({ league: e.target.value, page: "1" })}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer truncate"
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
            <label htmlFor="modal-club-country" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Country
            </label>
            <select
              id="modal-club-country"
              value={selectedCountryValue}
              onChange={(e) => updateParams({ country: e.target.value, page: "1" })}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer truncate"
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
      </FilterBar>

      {/* 3. Compact Count / Status row */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">
          {filteredClubs.length} {filteredClubs.length === 1 ? "club" : "clubs"} found
        </span>
        <span>
          Showing {filteredClubs.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredClubs.length)}
        </span>
      </div>

      {/* 4. Clubs Grid */}
      {paginatedClubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
          {paginatedClubs.map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${getClubSlug(club)}`}
              className="group rounded-xl glass-panel glass-panel-hover p-2.5 sm:p-3 border border-slate-800/80 flex items-center justify-between gap-2.5 min-h-[76px] max-h-[92px] transition-all"
            >
              {/* Left: Crest + Info */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-900/90 p-1.5 shrink-0 overflow-hidden border border-slate-800 group-hover:scale-105 transition-transform">
                  <EntityImage
                    src={club.logoUrl}
                    alt=""
                    fill
                    sizes="44px"
                    entityType="club"
                    className="object-contain p-0.5"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate group-hover:text-amber-400 transition-colors" title={club.name}>
                    {getClubDisplayName(club)}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
                    <span className="truncate">{club.leagueName || club.country || "Club"}</span>
                    {club.leagueRank && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 font-semibold border border-slate-700/60 text-[10px] shrink-0">
                        Rank #{club.leagueRank}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                    {club.playerCount ? <span>{club.playerCount} players</span> : null}
                    {club.averageAge ? <span>• {club.averageAge} yrs</span> : null}
                  </div>
                </div>
              </div>

              {/* Right: Squad Value */}
              <div className="text-right shrink-0 pl-1">
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Squad Value</span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-400 tabular-nums whitespace-nowrap">
                  {formatDetailedClubValue(club.totalSquadValue)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl glass-panel p-10 border border-slate-800 text-center space-y-3">
          <p className="text-slate-300 text-sm font-semibold">No clubs match the selected filters.</p>
          <p className="text-slate-500 text-xs">Try adjusting your search query, country, or league filter.</p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-colors"
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
