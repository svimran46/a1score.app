"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PlayerRow } from "./PlayerRow";
import { PageHeader } from "./PageHeader";
import { FilterButtonAndSheet } from "./FilterBar";
import { Card, Chip, EmptyState, ValuationFreshness } from "@/components/ui";
import type { MarketMover } from "@/lib/data/players";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";

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
  pageTitle?: string;
  pageSubtitle?: string;
}

const ITEMS_PER_PAGE = 40;

export function PlayersDirectoryClient({
  initialPlayers,
  movers,
  latestRevisionDate,
  pageTitle = "Players",
  pageSubtitle = "Top market valuations worldwide",
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

  // URL filter params
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
          if (grp) {
            if (grp !== posParam) return false;
          } else {
            const pos = p.position.toUpperCase();
            if (posParam === "ATT" && !pos.includes("FORWARD") && !pos.includes("WINGER") && !pos.includes("STRIKER")) return false;
            if (posParam === "MID" && !pos.includes("MIDFIELD")) return false;
            if (posParam === "DEF" && !pos.includes("BACK") && !pos.includes("DEFENDER")) return false;
            if (posParam === "GK" && !pos.includes("GOALKEEPER")) return false;
          }
        }

        // League
        if (leagueParam !== "ALL") {
          const lName = p.currentClub?.league?.name;
          if (!lName || lName.toLowerCase() !== leagueParam.toLowerCase()) return false;
        }

        // Valuation Tier
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

  const staleDateLabel = useMemo(() => {
    if (latestRevisionDate) return latestRevisionDate;
    const rawDate = movers?.risers[0]?.lastUpdated;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      } catch {}
    }
    return "Latest Cycle";
  }, [movers, latestRevisionDate]);

  return (
    <div className="space-y-4 max-w-[720px] mx-auto pt-2 sm:pt-4">
      {/* 1. Page Header */}
      <div className="space-y-1">
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
        />
        {latestRevisionDate && (
          <ValuationFreshness timestamp={latestRevisionDate} className="px-1" />
        )}
      </div>

      {/* 2. Controls Bar: [Rankings | Movers] and [Filters] Button */}
      <div className="flex items-center justify-between gap-3">
        {/* Segmented Tab Control [Rankings | Movers] */}
        <div className="flex items-center p-1 rounded-[var(--chip-radius)] bg-[var(--bg-card)] w-full max-w-xs text-xs font-semibold shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("rankings");
              updateParams({ view: "rankings" });
            }}
            className={`flex-1 min-h-[40px] rounded-[var(--chip-radius)] transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              activeTab === "rankings"
                ? "bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
            className={`flex-1 min-h-[40px] rounded-[var(--chip-radius)] transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              activeTab === "movers"
                ? "bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Movers
          </button>
        </div>

        {/* Filters button (Rankings view) */}
        {activeTab === "rankings" && (
          <div className="shrink-0">
            <FilterButtonAndSheet
              activeFilterCount={activeFilterCount}
              onResetFilters={handleClearFilters}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="modal-pos" className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                    Position
                  </label>
                  <select
                    id="modal-pos"
                    value={posParam}
                    onChange={(e) => updateParams({ pos: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    <option value="ALL">All positions</option>
                    <option value="ATT">Forwards (ATT)</option>
                    <option value="MID">Midfield (MID)</option>
                    <option value="DEF">Defenders (DEF)</option>
                    <option value="GK">Goalkeepers (GK)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-sort" className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                    Sort By
                  </label>
                  <select
                    id="modal-sort"
                    value={sortParam}
                    onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    <option value="val_desc">Market value: High to low</option>
                    <option value="val_asc">Market value: Low to high</option>
                    <option value="age_asc">Age: Youngest first</option>
                    <option value="age_desc">Age: Oldest first</option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-league" className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                    Competition
                  </label>
                  <select
                    id="modal-league"
                    value={leagueParam}
                    onChange={(e) => updateParams({ league: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    <option value="ALL">All competitions</option>
                    {availableLeagues.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-val" className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                    Valuation Tier
                  </label>
                  <select
                    id="modal-val"
                    value={valParam}
                    onChange={(e) => updateParams({ val: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    <option value="ALL">All valuations</option>
                    <option value="150m_plus">€150M+ (Elite)</option>
                    <option value="100m_150m">€100M – €150M</option>
                    <option value="50m_100m">€50M – €100M</option>
                    <option value="under_50m">Under €50M</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-age" className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                    Age Bracket
                  </label>
                  <select
                    id="modal-age"
                    value={ageParam}
                    onChange={(e) => updateParams({ age: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-chip)] text-[var(--text-primary)] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
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
        )}
      </div>

      {activeTab === "rankings" ? (
        <>

          {/* 5. Player List Card */}
          {paginatedPlayers.length > 0 ? (
            <Card className="p-1 overflow-hidden">
              <div className="divide-y divide-[var(--divider)]">
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
                    age={player.age}
                    nationality={player.nationality}
                    marketValue={player.latestMarketValue}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No players match filters."
              message="Try broadening your position, age, or valuation parameters."
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

          {/* 6. Pagination Controls */}
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
        </>
      ) : (
        /* Movers Tab: Risers / Fallers chips + single Card list */
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-0.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMoversType("risers")}
                className={`flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-[var(--chip-radius)] text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  moversType === "risers"
                    ? "bg-[var(--bg-card)] text-[var(--trend-up)] font-bold shadow-xs"
                    : "bg-[var(--bg-chip)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Top Risers ({movers?.risers.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setMoversType("fallers")}
                className={`flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-[var(--chip-radius)] text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  moversType === "fallers"
                    ? "bg-[var(--bg-card)] text-[var(--trend-down)] font-bold shadow-xs"
                    : "bg-[var(--bg-chip)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Top Fallers ({movers?.fallers.length || 0})</span>
              </button>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Data as of {staleDateLabel}
            </span>
          </div>

          {currentMoversList.length > 0 ? (
            <Card className="p-1 divide-y divide-[var(--divider)] overflow-hidden">
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
                  trendPercentage={m.percentage}
                />
              ))}
            </Card>
          ) : (
            <EmptyState
              title="No valuation movements."
              message="No valuation movements were recorded in this update cycle."
            />
          )}
        </div>
      )}
    </div>
  );
}
