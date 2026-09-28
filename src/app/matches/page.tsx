import Link from "next/link";
import { getMatchesByDate } from "@/lib/fotmob/client";
import { MatchCard } from "@/components/MatchCard";
import { Radio, Calendar, Trophy, ChevronLeft, ChevronRight } from "lucide-react";

export const revalidate = 30; // Fresh live scores every 30s
export const runtime = "edge";

interface MatchesPageProps {
  searchParams: {
    date?: string;
    filter?: "all" | "live" | "finished" | "upcoming";
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

  let leagues = data.leagues;

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Live Match Center
            </h1>
            {data.liveMatchesCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {data.liveMatchesCount} Live Now
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time scores, lineups, and match stats powered by FotMob API
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <Link
            href={`/matches?date=${prevDateStr}&filter=${activeFilter}`}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold text-white">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{displayDateStr}</span>
          </div>
          <Link
            href={`/matches?date=${nextDateStr}&filter=${activeFilter}`}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/80 text-xs">
        <Link
          href={`/matches?date=${activeDate}&filter=all`}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === "all"
              ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          All Matches ({data.totalMatches})
        </Link>
        <Link
          href={`/matches?date=${activeDate}&filter=live`}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === "live"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50"
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Live Now ({data.liveMatchesCount})
        </Link>
        <Link
          href={`/matches?date=${activeDate}&filter=finished`}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === "finished"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Finished
        </Link>
        <Link
          href={`/matches?date=${activeDate}&filter=upcoming`}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
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
              href={`/matches?date=${activeDate}&filter=all`}
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
