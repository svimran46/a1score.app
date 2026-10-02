"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ClubRow } from "./ClubRow";
import { PageHeader } from "./PageHeader";
import { FilterButtonAndSheet } from "./FilterBar";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export function ClubsDirectoryClient({ initialClubs }: ClubsDirectoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Read URL params (Note: in-page search deleted per GLOBAL 1)
  const leagueParam = searchParams.get("league") || "ALL";
  const countryParam = searchParams.get("country") || "ALL";
  const sortParam = searchParams.get("sort") || "val_desc";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

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

  const handleClearFilters = () => {
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

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (leagueParam !== "ALL") count++;
    if (countryParam !== "ALL") count++;
    if (sortParam !== "val_desc") count++;
    return count;
  }, [leagueParam, countryParam, sortParam]);

  // Filter & Deterministic Sort
  const filteredClubs = useMemo(() => {
    return initialClubs
      .filter((c) => {
        // League Filter
        if (leagueParam !== "ALL") {
          const norm = (s: string) => s.toLowerCase().replace(/[\s\-_]+/g, "");
          if (norm(c.leagueName || "") !== norm(leagueParam)) return false;
        }

        // Country Filter
        if (countryParam !== "ALL") {
          const norm = (s: string) => s.toLowerCase().replace(/[\s\-_]+/g, "");
          if (norm(c.country || "") !== norm(countryParam)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const valA = a.totalSquadValue || 0;
        const valB = b.totalSquadValue || 0;
        const sizeA = a.playerCount || 0;
        const sizeB = b.playerCount || 0;
        const ageA = parseFloat(a.averageAge || "0") || 0;
        const ageB = parseFloat(b.averageAge || "0") || 0;

        if (sortParam === "val_desc") {
          if (valB !== valA) return valB - valA;
          return a.name.localeCompare(b.name);
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
  }, [initialClubs, leagueParam, countryParam, sortParam]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredClubs.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, pageParam), totalPages);
  const paginatedClubs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClubs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClubs, currentPage]);

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* 1. Page Title (22-24px, continuous background) */}
      <PageHeader
        title="Clubs"
        subtitle="Top clubs ranked by cumulative squad market value"
      />

      {/* 2. One control row: count left, Filters button right (NO in-page search input) */}
      <div className="flex items-center justify-between text-[13px] py-0.5">
        <span className="text-[var(--color-text-secondary)] font-normal">
          Showing {filteredClubs.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredClubs.length)} of {filteredClubs.length}
        </span>

        <FilterButtonAndSheet
          activeFilterCount={activeFilterCount}
          onResetFilters={handleClearFilters}
        >
          <div className="space-y-4">
            {/* Sort Selector */}
            <div>
              <label htmlFor="modal-club-sort" className="block text-[13px] font-normal text-[var(--color-text-secondary)] mb-1.5">
                Sort by
              </label>
              <select
                id="modal-club-sort"
                value={sortParam}
                onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-[15px] font-normal focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
              >
                <option value="val_desc">Squad value: High to low</option>
                <option value="val_asc">Squad value: Low to high</option>
                <option value="size_desc">Squad size: Largest first</option>
                <option value="size_asc">Squad size: Smallest first</option>
                <option value="age_asc">Average age: Youngest first</option>
                <option value="age_desc">Average age: Oldest first</option>
                <option value="name_asc">Club name: A to Z</option>
                <option value="name_desc">Club name: Z to A</option>
              </select>
            </div>

            {/* Competition / League Filter */}
            <div>
              <label htmlFor="modal-club-league" className="block text-[13px] font-normal text-[var(--color-text-secondary)] mb-1.5">
                Competition
              </label>
              <select
                id="modal-club-league"
                value={leagueParam}
                onChange={(e) => updateParams({ league: e.target.value, page: "1" })}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-[15px] font-normal focus:outline-none focus:border-[var(--color-accent)] cursor-pointer truncate"
              >
                <option value="ALL">All competitions ({initialClubs.length} clubs)</option>
                {availableLeagues.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Country Filter */}
            <div>
              <label htmlFor="modal-club-country" className="block text-[13px] font-normal text-[var(--color-text-secondary)] mb-1.5">
                Country
              </label>
              <select
                id="modal-club-country"
                value={countryParam}
                onChange={(e) => updateParams({ country: e.target.value, page: "1" })}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-[15px] font-normal focus:outline-none focus:border-[var(--color-accent)] cursor-pointer truncate"
              >
                <option value="ALL">All countries</option>
                {availableCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FilterButtonAndSheet>
      </div>

      {/* 3. Single Card Container with 1px dividers.
          Show the "Squad value" label once in the list header, not on every row. */}
      {paginatedClubs.length > 0 ? (
        <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
          {/* List Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-[var(--color-border)] text-[13px] font-normal text-[var(--color-text-secondary)] bg-[var(--color-surface-2)]">
            <div className="flex items-center gap-3">
              <span className="w-7 text-center">#</span>
              <span>Club</span>
            </div>
            <span>Squad value</span>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {paginatedClubs.map((club, idx) => (
              <ClubRow
                key={club.id}
                rank={(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                id={club.id}
                name={club.name}
                shortName={club.shortName}
                logoUrl={club.logoUrl}
                leagueName={club.leagueName}
                country={club.country}
                leagueRank={club.leagueRank}
                totalSquadValue={club.totalSquadValue}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--color-surface)] p-8 border border-[var(--color-border)] text-center space-y-3">
          <p className="text-[var(--color-text-secondary)] text-[15px]">No clubs match the selected filters.</p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 min-h-[44px] rounded-lg bg-[var(--color-accent)] text-[var(--accent-contrast)] text-[13px] font-semibold transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)]">
          <button
            type="button"
            onClick={() => updateParams({ page: String(currentPage - 1) })}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 min-h-[44px] px-3.5 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--color-accent)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="font-normal text-[var(--color-text-secondary)] tabular-nums">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => updateParams({ page: String(currentPage + 1) })}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 min-h-[44px] px-3.5 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--color-accent)] transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
