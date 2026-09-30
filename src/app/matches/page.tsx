import Link from "next/link";
import { getMatchesByDate, TOP_LEAGUE_IDS } from "@/lib/fotmob/client";
import { MatchCard } from "@/components/MatchCard";
import { LiveAutoRefresher } from "@/components/LiveAutoRefresher";
import { DateStripCarousel } from "@/components/DateStripCarousel";
import { Radio, Calendar, Trophy, ChevronLeft, ChevronRight } from "lucide-react";

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
  const activeScope = searchParams.scope === "all" ? "all" : "top";

  // Compute prev and next dates
  const y = parseInt(activeDate.slice(0, 4), 10);
  const m = parseInt(activeDate.slice(4, 6), 10) - 1;
  const d = parseInt(activeDate.slice(6, 8), 10);
  const currentDateObj = new Date(Date.UTC(y, m, d));

  const prevDateObj = new Date(currentDateObj);
  prevDateObj.setUTCDate(prevDateObj.getUTCDate() - 1);
  const prevDateStr = prevDateObj.toISOString().slice(0, 10).replace(/-/g, "");

  const nextDateObj = new Date(currentDateObj);
  nextDateObj.setUTCDate(nextDateObj.getUTCDate() + 1);
  const nextDateStr = nextDateObj.toISOString().slice(0, 10).replace(/-/g, "");

  const displayDateStr = currentDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const data = await getMatchesByDate(activeDate);

  // Filter leagues by scope (top 10 European competitions vs all)
  const scopedLeagues =
    activeScope === "all"
      ? data.leagues
      : data.leagues.filter((l) => TOP_LEAGUE_IDS.includes(l.id));

  const totalScopedMatches = scopedLeagues.reduce((sum, l) => sum + l.matches.length, 0);
  const liveScopedMatchesCount = scopedLeagues.reduce(
    (sum, l) => sum + l.matches.filter((m) => m.isLive).length,
    0
  );

  let leagues = scopedLeagues;

  if (activeFilter === "live") {
    leagues = leagues
      .map((l) => ({
        ...l,
        matches: l.matches.filter((m) => m.isLive),
      }))
      .filter((l) => l.matches.length > 0);
  } else if (activeFilter === "finished") {
    leagues = leagues
      .map((l) => ({
        ...l,
        matches: l.matches.filter((m) => m.isFinished),
      }))
      .filter((l) => l.matches.length > 0);
  } else if (activeFilter === "upcoming") {
    leagues = leagues
      .map((l) => ({
        ...l,
        matches: l.matches.filter((m) => m.isUpcoming),
      }))
      .filter((l) => l.matches.length > 0);
  }

  const filteredMatchesCount = leagues.reduce((sum, l) => sum + l.matches.length, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Restructured 3-Row Header */}
      <div className="space-y-2.5">
        {/* Row 1: Title + Inline Live Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight [text-wrap:balance]">
            Live Match Center
          </h1>
          {liveScopedMatchesCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {liveScopedMatchesCount} Live Now
            </span>
          )}
        </div>

        {/* Row 2: Subtitle with matching left edge */}
        <p className="text-xs sm:text-sm text-slate-400">
          Real-time scores, lineups and match stats.
        </p>

        {/* Row 3: Compact Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <LiveAutoRefresher intervalMs={5000} label="Live Scores" />
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
              <Link
                href={`/matches?date=${activeDate}&filter=${activeFilter}&scope=top`}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeScope === "top"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Top Leagues
              </Link>
              <Link
                href={`/matches?date=${activeDate}&filter=${activeFilter}&scope=all`}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeScope === "all"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Leagues
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/80 p-1 sm:p-1.5 rounded-2xl border border-slate-800">
            <Link
              href={`/matches?date=${prevDateStr}&filter=${activeFilter}&scope=${activeScope}`}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs font-semibold text-white whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{displayDateStr}</span>
            </div>
            <Link
              href={`/matches?date=${nextDateStr}&filter=${activeFilter}&scope=${activeScope}`}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 7-Day Quick-Jump Date Carousel */}
      <DateStripCarousel activeDate={activeDate} activeFilter={activeFilter} scope={activeScope} />

      {/* Filter Tabs with horizontal snap */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 border-b border-slate-800/80 text-xs">
        <Link
          href={`/matches?date=${activeDate}&filter=all&scope=${activeScope}`}
          className={`snap-start shrink-0 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === "all"
              ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          All Matches ({totalScopedMatches})
        </Link>
        <Link
          href={`/matches?date=${activeDate}&filter=live&scope=${activeScope}`}
          className={`snap-start shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === "live"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50"
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Live Now ({liveScopedMatchesCount})
        </Link>
        <Link
          href={`/matches?date=${activeDate}&filter=finished&scope=${activeScope}`}
          className={`snap-start shrink-0 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === "finished"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Finished
        </Link>
        <Link
          href={`/matches?date=${activeDate}&filter=upcoming&scope=${activeScope}`}
          className={`snap-start shrink-0 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === "upcoming"
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Upcoming
        </Link>
      </div>

      {/* Leagues & Match Grid */}
      {leagues.length > 0 ? (
        <div className="space-y-8">
          {leagues.map((league) => (
            <div key={league.id} className="space-y-3">
              {/* League Header */}
              <div className="flex items-center gap-2 px-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {league.name}
                </h2>
                {league.ccode && (
                  <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {league.ccode}
                  </span>
                )}
                <span className="text-xs text-slate-500 ml-auto">
                  {league.matches.length} {league.matches.length === 1 ? "match" : "matches"}
                </span>
              </div>

              {/* Grid of matches */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {league.matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl glass-panel p-12 border border-slate-800 text-center space-y-3">
          <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Matches Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeFilter === "live"
              ? "There are currently no live matches in progress right now. Check back shortly or browse upcoming fixtures."
              : "No matches scheduled for this date and filter."}
          </p>
          <div className="pt-2">
            <Link
              href={`/matches?date=${activeDate}&filter=all&scope=${activeScope}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              View All Matches on this Date
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
