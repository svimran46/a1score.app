"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ClubRow } from "./ClubRow";
import { PageHeader } from "./PageHeader";
import { FilterButtonAndSheet } from "./FilterBar";
import { Card, Chip, EmptyState } from "@/components/ui";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

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

const TOP_LEAGUE_CHIPS = [
  { label: "All Leagues", val: "ALL" },
  { label: "Premier League", val: "Premier League" },
  { label: "LaLiga", val: "LaLiga" },
  { label: "Serie A", val: "Serie A" },
  { label: "Bundesliga", val: "Bundesliga" },
  { label: "Ligue 1", val: "Ligue 1" },
];

export function ClubsDirectoryClient({ initialClubs }: ClubsDirectoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Read URL params
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
          if ((c.country || "").toLowerCase() !== countryParam.toLowerCase()) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const valA = a.totalSquadValue || 0;
        const valB = b.totalSquadValue || 0;

        if (sortParam === "val_desc") return valB - valA;
        if (sortParam === "val_asc") return valA - valB;
        if (sortParam === "name_asc") return a.name.localeCompare(b.name);
        if (sortParam === "name_desc") return b.name.localeCompare(a.name);
        return valB - valA;
      });
  }, [initialClubs, leagueParam, countryParam, sortParam]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredClubs.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, pageParam), totalPages);
  const paginatedClubs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClubs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClubs, currentPage]);

  return (
    <div className="space-y-4 max-w-[720px] mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Clubs"
        subtitle="Worldwide football clubs ranked by total squad market valuation"
      />

      {/* 2. Top League Quick Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {TOP_LEAGUE_CHIPS.map((chip) => (
          <Chip
            key={chip.val}
            active={leagueParam.toLowerCase() === chip.val.toLowerCase() || (chip.val === "ALL" && leagueParam === "ALL")}
            onClick={() => updateParams({ league: chip.val, page: "1" })}
          >
            {chip.label}
          </Chip>
        ))}
      </div>

      {/* 3. Controls Row */}
      <div className="flex items-center justify-between text-xs py-1 px-1">
        <span className="text-[var(--text-muted)] font-medium">
          Showing {filteredClubs.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredClubs.length)} of {filteredClubs.length} clubs
        </span>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortParam}
              onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
              className="appearance-none bg-[var(--bg-chip)] text-[var(--text-primary)] text-xs font-semibold px-3 py-1.5 pr-7 rounded-[var(--chip-radius)] hover:bg-[var(--bg-hover)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
              aria-label="Sort clubs"
            >
              <option value="val_desc">Squad value: High to low</option>
              <option value="val_asc">Squad value: Low to high</option>
              <option value="name_asc">Club name: A to Z</option>
              <option value="name_desc">Club name: Z to A</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <FilterButtonAndSheet
            activeFilterCount={activeFilterCount}
            onResetFilters={handleClearFilters}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="modal-club-sort" className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Sort By
                </label>
                <select
                  id="modal-club-sort"
                  value={sortParam}
                  onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <option value="val_desc">Squad value: High to low</option>
                  <option value="val_asc">Squad value: Low to high</option>
                  <option value="name_asc">Club name: A to Z</option>
                  <option value="name_desc">Club name: Z to A</option>
                </select>
              </div>

              <div>
                <label htmlFor="modal-club-league" className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Competition
                </label>
                <select
                  id="modal-club-league"
                  value={leagueParam}
                  onChange={(e) => updateParams({ league: e.target.value, page: "1" })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <option value="ALL">All competitions ({initialClubs.length} clubs)</option>
                  {availableLeagues.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modal-club-country" className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Country
                </label>
                <select
                  id="modal-club-country"
                  value={countryParam}
                  onChange={(e) => updateParams({ country: e.target.value, page: "1" })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
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
      </div>

      {/* 4. Clubs List Card with Sticky Header */}
      {paginatedClubs.length > 0 ? (
        <Card className="p-1 overflow-hidden">
          {/* Sticky List Header on Desktop */}
          <div className="sticky top-[var(--nav-height)] z-20 bg-[var(--bg-card)]/95 backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--divider)]">
            <div className="flex items-center gap-3">
              <span className="w-6 text-center">#</span>
              <span>Club & League</span>
            </div>
            <span>Squad Value</span>
          </div>

          <div className="divide-y divide-[var(--divider)]">
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
                playerCount={club.playerCount}
              />
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No clubs match filters."
          message="Try changing the competition or country selection."
          action={
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-[var(--chip-radius)] bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold"
            >
              Clear all filters
            </button>
          }
        />
      )}

      {/* 5. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => updateParams({ page: String(currentPage - 1) })}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 min-h-[40px] px-3.5 py-1.5 rounded-[var(--chip-radius)] bg-[var(--bg-card)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="font-semibold tabular-nums">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => updateParams({ page: String(currentPage + 1) })}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 min-h-[40px] px-3.5 py-1.5 rounded-[var(--chip-radius)] bg-[var(--bg-card)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
