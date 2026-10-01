"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PlayerRow } from "./PlayerRow";
import { PageHeader } from "./PageHeader";
import { FilterButtonAndSheet } from "./FilterBar";
import type { MarketMover } from "@/lib/data/players";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    shortName?: string | null;
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

  // Tab switch: Rankings vs Movers
  const tabParam = searchParams.get("view") || "rankings";
  const [activeTab, setActiveTab] = useState<"rankings" | "movers">(
    tabParam === "movers" ? "movers" : "rankings"
  );

  // Movers sub-toggle (risers vs fallers)
  const [moversType, setMoversType] = useState<"risers" | "fallers">("risers");

  // URL filter params (Note: in-page search input deleted per GLOBAL 1)
  const posParam = searchParams.get("pos") || "ALL";
  const leagueParam = searchParams.get("league") || "ALL";
  const valParam = searchParams.get("val") || "ALL";
  const ageParam = searchParams.get("age") || "ALL";
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

  // Derive distinct leagues
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
    if (posParam !== "ALL") count++;
    if (leagueParam !== "ALL") count++;
    if (valParam !== "ALL") count++;
    if (ageParam !== "ALL") count++;
    if (sortParam !== "val_desc") count++;
    return count;
  }, [posParam, leagueParam, valParam, ageParam, sortParam]);

  // Filter & Deterministic Sort
  const filteredPlayers = useMemo(() => {
    return initialPlayers
      .filter((p) => {
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
  }, [initialPlayers, posParam, leagueParam, valParam, ageParam, sortParam]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, pageParam), totalPages);
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const currentMoversList = movers ? movers[moversType] : [];

  // Compute movers revision date string (e.g. Jun 2026)
  const staleDateLabel = useMemo(() => {
    if (latestRevisionDate) return latestRevisionDate;
    const rawDate = movers?.risers[0]?.lastUpdated;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      } catch {}
    }
    return "Jun 2026";
  }, [movers, latestRevisionDate]);

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* 1. Page Title (22-24px, never truncated, continuous background) */}
      <PageHeader
        title="Players"
        subtitle="Top market valuations worldwide"
      />

      {/* 2. Segmented Control under the title [Rankings | Movers] */}
      <div className="flex items-center p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-xs text-[13px]">
        <button
          type="button"
          onClick={() => {
            setActiveTab("rankings");
            updateParams({ view: "rankings" });
          }}
          className={`flex-1 min-h-[44px] rounded-lg transition-all text-center ${
            activeTab === "rankings"
              ? "bg-[var(--color-surface-2)] text-[var(--color-accent)] font-semibold"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          }`}
        >
          Rankings
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("movers");
            updateParams({ view: "movers" });
          }}
          className={`flex-1 min-h-[44px] rounded-lg transition-all text-center ${
            activeTab === "movers"
              ? "bg-[var(--color-surface-2)] text-[var(--color-accent)] font-semibold"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          }`}
        >
          Movers
        </button>
      </div>

      {activeTab === "rankings" ? (
        <>
          {/* 3. One control row: count left, Filters button right (NO in-page search input) */}
          <div className="flex items-center justify-between text-[13px] py-0.5">
            <span className="text-[var(--color-text-secondary)] font-normal">
              Showing {filteredPlayers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)} of {filteredPlayers.length}
            </span>

            <FilterButtonAndSheet
              activeFilterCount={activeFilterCount}
              onResetFilters={handleClearFilters}
            >
              <div className="space-y-4">
                {/* Sort Selector */}
                <div>
                  <label htmlFor="modal-player-sort" className="block text-[13px] font-normal text-[var(--color-text-secondary)] mb-1.5">
                    Sort by
                  </label>
                  <select
                    id="modal-player-sort"
                    value={sortParam}
                    onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-[15px] font-normal focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                  >
                    <option value="val_desc">Market value: High to low</option>
                    <option value="val_asc">Market value: Low to high</option>
                    <option value="age_asc">Age: Youngest first</option>
                    <option value="age_desc">Age: Oldest first</option>
                    <option value="name_asc">Name: A to Z</option>
                    <option value="name_desc">Name: Z to A</option>
                  </select>
                </div>

                {/* Position Group Tabs */}
                <div>
                  <label className="block text-[13px] font-normal text-[var(--color-text-secondary)] mb-1.5">
                    Position
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: "All", val: "ALL" },
                      { label: "ATT", val: "ATT" },
                      { label: "MID", val: "MID" },
                      { label: "DEF", val: "DEF" },
                      { label: "GK", val: "GK" },
                    ].map((tab) => (
                      <button
                        key={tab.val}
                        type="button"
                        onClick={() => updateParams({ pos: tab.val, page: "1" })}
                        className={`min-h-[44px] rounded-lg text-[13px] font-medium border transition-colors flex items-center justify-center ${
                          posParam === tab.val
                            ? "bg-[var(--color-accent)] text-[#0B0F17] font-semibold border-[var(--color-accent)]"
                            : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text)]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* League Filter */}
                <div>
                  <label htmlFor="modal-player-league" className="block text-[13px] font-normal text-[var(--color-text-secondary)] mb-1.5">
                    Competition
                  </label>
                  <select
                    id="modal-player-league"
                    value={leagueParam}
                    onChange={(e) => updateParams({ league: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-[15px] font-normal focus:outline-none focus:border-[var(--color-accent)] cursor-pointer truncate"
                  >
                    <option value="ALL">All competitions ({initialPlayers.length} players)</option>
                    {availableLeagues.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valuation Filter */}
                <div>
                  <label htmlFor="modal-player-val" className="block text-[13px] font-normal text-[var(--color-text-secondary)] mb-1.5">
                    Market valuation
                  </label>
                  <select
                    id="modal-player-val"
                    value={valParam}
                    onChange={(e) => updateParams({ val: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-[15px] font-normal focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                  >
                    <option value="ALL">All valuations</option>
                    <option value="150m_plus">€150M+ (Elite tier)</option>
                    <option value="100m_150m">€100M – €150M</option>
                    <option value="50m_100m">€50M – €100M</option>
                    <option value="under_50m">Under €50M</option>
                  </select>
                </div>

                {/* Age Filter */}
                <div>
                  <label htmlFor="modal-player-age" className="block text-[13px] font-normal text-[var(--color-text-secondary)] mb-1.5">
                    Age group
                  </label>
                  <select
                    id="modal-player-age"
                    value={ageParam}
                    onChange={(e) => updateParams({ age: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-[15px] font-normal focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                  >
                    <option value="ALL">All ages</option>
                    <option value="u21">U21 (Prospects)</option>
                    <option value="21_25">21–25 yrs</option>
                    <option value="26_30">26–30 yrs</option>
                    <option value="over_30">30+ yrs</option>
                  </select>
                </div>
              </div>
            </FilterButtonAndSheet>
          </div>

          {/* 4. Single Card Container with 1px dividers. Never nested cards. */}
          {paginatedPlayers.length > 0 ? (
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden">
              {paginatedPlayers.map((player, idx) => (
                <PlayerRow
                  key={player.id}
                  rank={(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  id={player.id}
                  name={player.fullName}
                  slug={player.slug}
                  photoUrl={player.photoUrl}
                  club={player.currentClub}
                  position={player.position}
                  marketValue={player.latestMarketValue}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--color-surface)] p-8 border border-[var(--color-border)] text-center space-y-3">
              <p className="text-[var(--color-text-secondary)] text-[15px]">No players match the selected filters.</p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 min-h-[44px] rounded-lg bg-[var(--color-accent)] text-[#0B0F17] text-[13px] font-semibold transition-colors"
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
        </>
      ) : (
        /* Movers Tab: Risers/Fallers pills + one muted line "Data as of Jun 2026" (no card, no note paragraph) */
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-0.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMoversType("risers")}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-lg border text-[13px] font-medium transition-all ${
                  moversType === "risers"
                    ? "bg-[var(--color-surface-2)] text-[var(--color-positive)] border-[var(--color-positive)] font-semibold"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text)]"
                }`}
              >
                Top Risers ({movers?.risers.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setMoversType("fallers")}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-lg border text-[13px] font-medium transition-all ${
                  moversType === "fallers"
                    ? "bg-[var(--color-surface-2)] text-[var(--color-negative)] border-[var(--color-negative)] font-semibold"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text)]"
                }`}
              >
                Top Fallers ({movers?.fallers.length || 0})
              </button>
            </div>
            <span className="text-[13px] text-[var(--color-text-secondary)] font-normal">
              Data as of {staleDateLabel}
            </span>
          </div>

          {/* Movers PlayerRow list in ONE card with 1px dividers */}
          {currentMoversList.length > 0 ? (
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden">
              {currentMoversList.map((m, idx) => (
                <PlayerRow
                  key={m.id}
                  rank={idx + 1}
                  id={m.id}
                  name={m.fullName}
                  slug={m.slug}
                  photoUrl={m.photoUrl}
                  club={m.currentClub}
                  position={m.position}
                  marketValue={m.latestValue}
                  change={m.diff}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--color-surface)] p-8 border border-[var(--color-border)] text-center text-[13px] text-[var(--color-text-secondary)]">
              No valuation movements recorded in the latest update cycle.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
