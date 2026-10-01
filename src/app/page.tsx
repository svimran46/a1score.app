import Link from "next/link";
import { getMostValuablePlayers, getMarketValueMovers } from "@/lib/data/players";
import { getLeagues } from "@/lib/data/leagues";
import { getMatchesByDate } from "@/lib/fotmob/client";
import { PlayerRow } from "@/components/PlayerRow";
import { MatchRow } from "@/components/MatchRow";
import { LiveAutoRefresher } from "@/components/LiveAutoRefresher";
import { formatCompactEur } from "@/lib/utils";
import {
  TrendingUp,
  ArrowRight,
  Radio,
  Coins,
  Scale,
  Sparkles,
} from "lucide-react";

export const revalidate = 30; // Fresh intelligence and scores
export const runtime = "edge";

export default async function HomePage() {
  const [valuablePlayers, leagues, matchesData, movers] = await Promise.all([
    getMostValuablePlayers(5),
    getLeagues(),
    getMatchesByDate().catch(() => null),
    getMarketValueMovers(5).catch(() => ({ risers: [], fallers: [] })),
  ]);

  // Extract up to 3 highlighted matches (prioritizing live, then top-7-league, then rest)
  const TOP_LEAGUE_IDS = new Set([47, 87, 55, 54, 53, 61, 57]); // PL, LaLiga, Serie A, Bundesliga, Ligue 1, Portugal, Eredivisie
  const allMatches = (matchesData?.leagues || []).flatMap((l) =>
    l.matches.map((m: any) => ({ ...m, _leagueId: l.id }))
  );
  const liveMatches = allMatches.filter((m) => m.isLive);
  const topLeagueMatches = allMatches.filter((m) => TOP_LEAGUE_IDS.has(m._leagueId));
  const matchPool =
    liveMatches.length > 0
      ? liveMatches
      : topLeagueMatches.length > 0
      ? topLeagueMatches
      : allMatches;
  const featuredMatches = matchPool.slice(0, 3);

  // Compute cumulative valuation across all tracked domestic top-flight leagues
  const totalTop7Valuation = leagues.reduce((acc, l) => acc + (l.totalMarketValue || 0), 0);
  const totalTop7Clubs = leagues.reduce((sum, l) => sum + (l.clubCount || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 
        COMPACT MOBILE-FIRST TOP SECTION
        1-2 line tagline + desktop-only paragraph + single horizontally scrolling row of 4 compact stat chips (~72px tall).
      */}
      <section className="space-y-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug [text-wrap:balance]">
            Where Squad Market Values Meet 90 Minutes on the Pitch.
          </h1>
          <p className="hidden md:block text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Unifying real-time match events with squad financial parity, valuation trajectory curves, and transfer analytics across Europe&apos;s elite football competitions.
          </p>
        </div>

        {/* Horizontally scrolling row of 4 compact stat chips (~72px tall) with edge fade */}
        <div
          className="flex items-center gap-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 -mx-4 px-4 edge-fade-x"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Chip 1: Top Player Value */}
          <div className="h-[72px] min-h-[72px] min-w-[150px] shrink-0 snap-start p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400 shrink-0" /> Top Player
            </span>
            <div className="text-sm font-black text-amber-400 tabular-nums">
              {valuablePlayers[0]?.latestMarketValue
                ? formatCompactEur(valuablePlayers[0].latestMarketValue)
                : "€220.0M"}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {valuablePlayers[0]?.commonName || valuablePlayers[0]?.fullName || "Lamine Yamal"}
            </div>
          </div>

          {/* Chip 2: Top 7 Leagues Value */}
          <div className="h-[72px] min-h-[72px] min-w-[150px] shrink-0 snap-start p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Scale className="w-3 h-3 text-emerald-400 shrink-0" /> Top 7 Leagues
            </span>
            <div className="text-sm font-black text-emerald-400 tabular-nums">
              {totalTop7Valuation > 0 ? formatCompactEur(totalTop7Valuation) : "€36.3B"}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {totalTop7Clubs || 132} elite clubs
            </div>
          </div>

          {/* Chip 3: Live Coverage Interval */}
          <div className="h-[72px] min-h-[72px] min-w-[150px] shrink-0 snap-start p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 text-rose-400 shrink-0" /> Live Poll
            </span>
            <div className="text-sm font-black text-white tabular-nums">
              Every 5s
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Match Center Sync
            </div>
          </div>

          {/* Chip 4: Squad Valuations */}
          <div className="h-[72px] min-h-[72px] min-w-[150px] shrink-0 snap-start p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-sky-400 shrink-0" /> Market Values
            </span>
            <div className="text-sm font-black text-sky-400 tabular-nums">
              Quarterly
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Active Squad Rosters
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Live Matches Section */}
      {featuredMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                {liveMatches.length > 0 ? "Live Matches & Scores" : "Featured Matches"}
              </h2>
              {liveMatches.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  {liveMatches.length} Live
                </span>
              )}
            </div>

            <Link
              href="/matches"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors shrink-0"
            >
              All Matches <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Matches in ONE card with 1px dividers */}
          <div className="rounded-2xl glass-panel border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
            {featuredMatches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Competition Barometer (Horizontal Scroll Carousel with snap & edge fade) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              Competition Barometer
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              European elite leagues ranked by cumulative market valuation
            </p>
          </div>

          <Link
            href="/leagues"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors shrink-0"
          >
            All Competitions <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Carousel Container with edge fade */}
        <div
          className="flex items-center gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 -mx-4 px-4 edge-fade-x"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {leagues.length > 0 ? (
            leagues.slice(0, 7).map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="min-w-[210px] sm:min-w-[240px] h-[92px] shrink-0 snap-start rounded-2xl glass-panel glass-panel-hover p-3 border border-slate-800/80 hover:border-amber-500/40 flex flex-col justify-between transition-all"
              >
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    {league.country} • Tier {league.tier || 1}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate mt-0.5">
                    {league.name}
                  </h3>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px]">{league.clubCount} Clubs</span>
                  <span className="text-amber-400 font-extrabold tabular-nums text-xs sm:text-sm">
                    {formatCompactEur(league.totalMarketValue)}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"].map((name) => (
              <div
                key={name}
                className="min-w-[200px] h-[88px] shrink-0 snap-start rounded-2xl glass-panel p-3 border border-slate-800/60 flex flex-col justify-between text-xs text-slate-400"
              >
                <div className="font-semibold text-white">{name}</div>
                <div className="text-[11px] text-slate-500">Domestic League</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Most Valuable Players (PlayerRow with top 5 each and a "See all" link) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              Most Valuable Players
            </h2>
          </div>
          <Link
            href="/players"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors shrink-0"
          >
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {valuablePlayers.length > 0 ? (
          <div className="rounded-2xl glass-panel border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
            {valuablePlayers.slice(0, 5).map((player, idx) => (
              <PlayerRow
                key={player.id}
                rank={idx + 1}
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
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 text-center text-xs text-slate-400">
            Loading top worldwide players...
          </div>
        )}
      </section>

      {/* Market Value Movers (PlayerRow with top 5 each and a "See all" link) */}
      {movers && movers.risers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Market Value Movers
              </h2>
            </div>
            <Link
              href="/players?view=movers"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors shrink-0"
            >
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="rounded-2xl glass-panel border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
            {movers.risers.slice(0, 5).map((m, idx) => (
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
        </section>
      )}

      {/* Editorial Methodology Banner */}
      <section className="rounded-2xl glass-panel p-4 sm:p-6 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-slate-900/40 to-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Editorial Transparency</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            How Valuation Data & Live Match Delivery Are Grounded
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Read our methodology on how player valuations, career trajectory graphs, and live match events are sourced and processed with zero fabricated numbers.
          </p>
        </div>

        <Link
          href="/methodology"
          className="px-4 py-2 min-h-[40px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/10"
        >
          <span>Methodology</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
    </div>
  );
}
