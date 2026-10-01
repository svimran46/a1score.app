import Link from "next/link";
import { getMatchesByDate, TOP_LEAGUE_IDS } from "@/lib/fotmob/client";
import { MatchCard } from "@/components/MatchCard";
import { LiveAutoRefresher } from "@/components/LiveAutoRefresher";
import { DateStripCarousel } from "@/components/DateStripCarousel";
import { Radio, Calendar, Trophy, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 5; // Ultra-fresh live scores every 5s
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Live Match Center — Real-Time Scores, Lineups & Squad Values",
  description:
    "Live football scores, real-time match events, confirmed tactical lineups, and squad market values on a1score.app.",
};

interface MatchesPageProps {
  searchParams: {
    date?: string;
    filter?: "all" | "live" | "finished" | "upcoming";
    scope?: "top" | "all";
  };
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const activeDate =
    searchParams.date ||
    new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

  const activeFilter = searchParams.filter || "all";
  let activeScope = searchParams.scope === "all" ? "all" : "top";

  // Compute date label
  const y = parseInt(activeDate.slice(0, 4), 10);
  const m = parseInt(activeDate.slice(4, 6), 10) - 1;
  const d = parseInt(activeDate.slice(6, 8), 10);
  const currentDateObj = new Date(Date.UTC(y, m, d));

  const displayDateStr = currentDateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const data = await getMatchesByDate(activeDate);

  // Compute all matches across every competition for global status counts
  const allLeaguesMatches = data.leagues.flatMap((l) =>
    l.matches.map((match) => ({ ...match, _leagueId: l.id }))
  );
  const totalAllMatchesCount = allLeaguesMatches.length;
  const totalAllLiveCount = allLeaguesMatches.filter((m) => m.isLive).length;

  // Filter leagues by scope (top 10 European competitions vs all)
  const topLeaguesMatches = data.leagues
    .filter((l) => TOP_LEAGUE_IDS.includes(l.id))
    .flatMap((l) => l.matches);
  const topMatchesCount = topLeaguesMatches.length;

  // Auto-switch to All Leagues if Top Leagues has 0 matches for the active date
  let autoSwitched = false;
  if (activeScope === "top" && topMatchesCount === 0 && totalAllMatchesCount > 0) {
    activeScope = "all";
    autoSwitched = true;
  }

  const scopedLeagues =
    activeScope === "all"
      ? data.leagues
      : data.leagues.filter((l) => TOP_LEAGUE_IDS.includes(l.id));

  // Global counts across the active scope
  const activeScopeMatches = scopedLeagues.flatMap((l) => l.matches);
  const totalScopedMatches = activeScopeMatches.length;
  const liveScopedMatchesCount = activeScopeMatches.filter((m) => m.isLive).length;
  const finishedScopedMatchesCount = activeScopeMatches.filter((m) => m.isFinished).length;
  const upcomingScopedMatchesCount = activeScopeMatches.filter((m) => m.isUpcoming).length;

  // Filter matches by status tab
  let leagues = scopedLeagues;
  if (activeFilter === "live") {
    leagues = leagues
      .map((l) => ({ ...l, matches: l.matches.filter((m) => m.isLive) }))
      .filter((l) => l.matches.length > 0);
  } else if (activeFilter === "finished") {
    leagues = leagues
      .map((l) => ({ ...l, matches: l.matches.filter((m) => m.isFinished) }))
      .filter((l) => l.matches.length > 0);
  } else if (activeFilter === "upcoming") {
    leagues = leagues
      .map((l) => ({ ...l, matches: l.matches.filter((m) => m.isUpcoming) }))
      .filter((l) => l.matches.length > 0);
  }

  return (
    <div className="space-y-4">
      {/* 
        ROW 1 (Sticky): Date Strip Carousel
        Horizontal scroll with snap, today centered, desktop arrows, full date label integrated.
      */}
      <div
        className="sticky top-14 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <DateStripCarousel
          activeDate={activeDate}
          activeFilter={activeFilter}
          scope={activeScope}
          displayDateStr={displayDateStr}
        />
      </div>

      {/* 
        ROW 2: Segmented Tabs (All / Live / Finished / Upcoming) + Scope Toggle Chip
        Fits 360px with subtle scroll fade. Global counts displayed.
      */}
      <div
        className="px-4 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-1"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        {/* Status Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <Link
            href={`/matches?date=${activeDate}&filter=all&scope=${activeScope}`}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === "all"
                ? "bg-amber-400 text-slate-950 font-bold shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All <span className="tabular-nums opacity-80">({totalScopedMatches})</span>
          </Link>
          <Link
            href={`/matches?date=${activeDate}&filter=live&scope=${activeScope}`}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === "live"
                ? "bg-rose-500 text-white font-bold shadow-xs"
                : "text-slate-400 hover:text-rose-400"
            }`}
          >
            <Radio className="w-3 h-3 text-rose-400 shrink-0" />
            Live <span className="tabular-nums font-bold">({liveScopedMatchesCount})</span>
          </Link>
          <Link
            href={`/matches?date=${activeDate}&filter=finished&scope=${activeScope}`}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === "finished"
                ? "bg-slate-800 text-white font-bold shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            FT <span className="tabular-nums opacity-80">({finishedScopedMatchesCount})</span>
          </Link>
          <Link
            href={`/matches?date=${activeDate}&filter=upcoming&scope=${activeScope}`}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === "upcoming"
                ? "bg-slate-800 text-white font-bold shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upcoming <span className="tabular-nums opacity-80">({upcomingScopedMatchesCount})</span>
          </Link>
        </div>

        {/* Scope Toggle Chip & Live Auto Refresher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 text-xs">
            <Link
              href={`/matches?date=${activeDate}&filter=${activeFilter}&scope=top`}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg font-bold flex items-center transition-all ${
                activeScope === "top"
                  ? "bg-slate-800 text-amber-400 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Top
            </Link>
            <Link
              href={`/matches?date=${activeDate}&filter=${activeFilter}&scope=all`}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg font-bold flex items-center transition-all ${
                activeScope === "all"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </Link>
          </div>
          <div className="hidden sm:block">
            <LiveAutoRefresher intervalMs={5000} label="Poll" />
          </div>
        </div>
      </div>

      {/* Auto-switch notice if Top had 0 matches but other leagues have matches */}
      {autoSwitched && (
        <div className="mx-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center justify-between gap-2">
          <span>No fixtures in Top 10 Leagues today. Showing all {totalAllMatchesCount} matches worldwide.</span>
        </div>
      )}

      {/* If Top scope is active but 0 matches, show hint to switch */}
      {activeScope === "top" && totalScopedMatches === 0 && totalAllMatchesCount > 0 && (
        <div className="mx-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between gap-3">
          <span className="text-slate-400">
            No Top League matches today. {totalAllMatchesCount} matches available in other competitions.
          </span>
          <Link
            href={`/matches?date=${activeDate}&filter=${activeFilter}&scope=all`}
            className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold shrink-0 hover:bg-amber-300 transition-colors"
          >
            Show All
          </Link>
        </div>
      )}

      {/* Leagues & Match Cards Grid */}
      <div
        className="px-4 space-y-6"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        {leagues.length > 0 ? (
          leagues.map((league) => (
            <div key={league.id} className="space-y-2.5">
              {/* League Header */}
              <div className="flex items-center gap-2 px-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  {league.name}
                </h2>
                {league.ccode && (
                  <span className="text-[9px] uppercase font-bold text-slate-400 px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                    {league.ccode}
                  </span>
                )}
                <span className="text-[11px] text-slate-500 ml-auto font-medium">
                  {league.matches.length}
                </span>
              </div>

              {/* Grid of matches (cards <=96px) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {league.matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))
        ) : (
          /* Shrunk Empty State <= 160px tall */
          <div className="rounded-2xl glass-panel max-h-[160px] py-6 px-4 border border-slate-800 text-center flex flex-col items-center justify-center space-y-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            <p className="text-xs font-semibold text-white">
              {activeFilter === "live"
                ? "No live matches in progress right now"
                : "No matches found for this date"}
            </p>
            {totalAllMatchesCount > 0 && activeScope === "top" ? (
              <Link
                href={`/matches?date=${activeDate}&filter=all&scope=all`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
              >
                Browse All Leagues ({totalAllMatchesCount})
              </Link>
            ) : (
              <Link
                href={`/matches?date=${activeDate}&filter=all&scope=${activeScope}`}
                className="text-xs text-amber-400 hover:underline"
              >
                View all fixtures on this date →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
