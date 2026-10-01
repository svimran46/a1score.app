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
      <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 w-full max-w-xs text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setActiveTab("rankings");
            updateParams({ view: "rankings" });
          }}
          className={`flex-1 min-h-[34px] rounded-lg transition-all text-center ${
            activeTab === "rankings"
              ? "bg-amber-400 text-slate-950 font-bold shadow-xs"
              : "text-slate-400 hover:text-white"
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
          className={`flex-1 min-h-[34px] rounded-lg transition-all text-center ${
            activeTab === "movers"
              ? "bg-amber-400 text-slate-950 font-bold shadow-xs"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Movers
        </button>
      </div>

      {activeTab === "rankings" ? (
        <>
          {/* 3. One control row: count left, Filters button right (NO in-page search input) */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <span className="text-slate-400 font-medium">
              Showing {filteredPlayers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)} of {filteredPlayers.length}
            </span>

            <FilterButtonAndSheet
              activeFilterCount={activeFilterCount}
              onResetFilters={handleClearFilters}
            >
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
                        className={`min-h-[44px] rounded-xl text-xs font-bold border transition-colors flex items-center justify-center ${
                          posParam === tab.val
                            ? "bg-amber-400 text-slate-950 border-amber-400"
                            : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* League Filter */}
                <div>
                  <label htmlFor="modal-player-league" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Competition / League
                  </label>
                  <select
                    id="modal-player-league"
                    value={leagueParam}
                    onChange={(e) => updateParams({ league: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer truncate"
                  >
                    <option value="ALL">All Competitions ({initialPlayers.length} Players)</option>
                    {availableLeagues.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valuation Filter */}
                <div>
                  <label htmlFor="modal-player-val" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Market Valuation
                  </label>
                  <select
                    id="modal-player-val"
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

                {/* Age Filter */}
                <div>
                  <label htmlFor="modal-player-age" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Age Group
                  </label>
                  <select
                    id="modal-player-age"
                    value={ageParam}
                    onChange={(e) => updateParams({ age: e.target.value, page: "1" })}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="ALL">All Ages</option>
                    <option value="u21">U21 (Prospects)</option>
                    <option value="21_25">21–25 yrs (Prime Development)</option>
                    <option value="26_30">26–30 yrs (Peak Athletic)</option>
                    <option value="over_30">30+ yrs (Veterans)</option>
                  </select>
                </div>
              </div>
            </FilterButtonAndSheet>
          </div>

          {/* 4. Single Card Container with 1px dividers. Never nested cards. */}
          {paginatedPlayers.length > 0 ? (
            <div className="rounded-2xl glass-panel border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
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
            <div className="rounded-2xl glass-panel p-10 border border-slate-800 text-center space-y-3">
              <p className="text-slate-300 text-sm font-semibold">No players match the selected filters.</p>
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
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => updateParams({ page: String(currentPage - 1) })}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-400 transition-colors"
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
                className="flex items-center gap-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-400 transition-colors"
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
                className={`min-h-[34px] px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
                  moversType === "risers"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                Top Risers ({movers?.risers.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setMoversType("fallers")}
                className={`min-h-[34px] px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
                  moversType === "fallers"
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                Top Fallers ({movers?.fallers.length || 0})
              </button>
            </div>
            <span className="text-[12px] text-slate-500 font-medium">
              Data as of {staleDateLabel}
            </span>
          </div>

          {/* Movers PlayerRow list in ONE card with 1px dividers */}
          {currentMoversList.length > 0 ? (
            <div className="rounded-2xl glass-panel border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
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
            <div className="rounded-2xl glass-panel p-8 border border-slate-800 text-center text-xs text-slate-400">
              No valuation movements recorded in the latest update cycle.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
