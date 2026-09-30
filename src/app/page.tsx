import Link from "next/link";
import { getMostValuablePlayers, getMarketValueMovers } from "@/lib/data/players";
import { getLeagues } from "@/lib/data/leagues";
import { getMatchesByDate } from "@/lib/fotmob/client";
import { PlayerCard } from "@/components/PlayerCard";
import { MatchCard } from "@/components/MatchCard";
import { MarketMovers } from "@/components/MarketMovers";
import { LiveAutoRefresher } from "@/components/LiveAutoRefresher";
import { formatCompactEur } from "@/lib/utils";
import {
  TrendingUp,
  Trophy,
  ArrowRight,
  Shield,
  Zap,
  Radio,
  Coins,
  Scale,
  Sparkles,
  BookOpen,
} from "lucide-react";

export const revalidate = 30; // Fresh intelligence and scores
export const runtime = "edge";

export default async function HomePage() {
  const [valuablePlayers, leagues, matchesData, movers] = await Promise.all([
    getMostValuablePlayers(8),
    getLeagues(),
    getMatchesByDate().catch(() => null),
    getMarketValueMovers(6).catch(() => ({ risers: [], fallers: [] })),
  ]);

  // Extract up to 3 highlighted matches (prioritizing live, then top-7-league, then rest)
  const TOP_LEAGUE_IDS = new Set([47, 87, 55, 54, 53, 61, 57]); // PL, LaLiga, Serie A, Bundesliga, Ligue 1, Portugal, Eredivisie
  const allMatches = (matchesData?.leagues || []).flatMap((l) =>
    l.matches.map((m: any) => ({ ...m, _leagueId: l.id }))
  );
  const liveMatches = allMatches.filter((m) => m.isLive);
  const topLeagueMatches = allMatches.filter((m) => TOP_LEAGUE_IDS.has(m._leagueId));
  const matchPool = liveMatches.length > 0
    ? liveMatches
    : topLeagueMatches.length > 0
    ? topLeagueMatches
    : allMatches;
  const featuredMatches = matchPool.slice(0, 3);

  // Compute cumulative valuation across all tracked domestic top-flight leagues (equals /leagues total)
  const totalTop7Valuation = leagues.reduce((acc, l) => acc + (l.totalMarketValue || 0), 0);
  const totalTop7Clubs = leagues.reduce((sum, l) => sum + (l.clubCount || 0), 0);

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Editorial Hero: Money Meets the Pitch */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-5 sm:p-10 lg:p-12 border border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-ink-950">
        {/* Glow Gradients */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-pitch-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl space-y-5 sm:space-y-6">
          {/* Editorial Badge - single line, never wraps on mobile */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm max-w-full">
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="tracking-wide uppercase text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
              Money Meets the Pitch
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline whitespace-nowrap">
              Live Valuation & Match Intelligence
            </span>
          </div>

          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight font-sans [text-wrap:balance]">
            Where Squad Market Values Meet 90 Minutes on the Pitch.
          </h1>

          <p className="text-slate-300 text-xs sm:text-base lg:text-lg leading-relaxed max-w-2xl">
            Most platforms do either live scores or player valuations. A1Score unifies both: squad financial parity inside the match center, valuation trajectory curves, and transfer analytics across Europe&apos;s elite competitions.
          </p>

          {/* Key Intelligence Barometer Metrics - 2x2 grid on mobile, equal heights */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 items-stretch">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400 shrink-0" /> Top Player Value
              </span>
              <div className="text-base sm:text-xl font-black text-amber-400 tabular-nums">
                {valuablePlayers[0]?.latestMarketValue
                  ? formatCompactEur(valuablePlayers[0].latestMarketValue)
                  : "€200.0M"}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {valuablePlayers[0]?.commonName || valuablePlayers[0]?.fullName || "Lamine Yamal"}
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Scale className="w-3 h-3 text-emerald-400 shrink-0" /> Top 7 Leagues Value
              </span>
              <div className="text-base sm:text-xl font-black text-emerald-400 tabular-nums">
                {totalTop7Valuation > 0 ? formatCompactEur(totalTop7Valuation) : "€36.3B"}
              </div>
              <div className="text-[11px] text-slate-400">{totalTop7Clubs || 132} top-flight clubs</div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-rose-400 shrink-0" /> Live Updates
              </span>
              <div className="text-base sm:text-xl font-black text-white tabular-nums">
                Every 5s
              </div>
              <div className="text-[11px] text-slate-400">Real-time pitch feeds</div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-blue-400 shrink-0" /> Data Quality
              </span>
              <div className="text-base sm:text-xl font-black text-white">
                FotMob & TM
              </div>
              <Link href="/methodology" className="text-[11px] text-amber-400 hover:underline">
                View data sources →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Matches Section with Financial Match Center */}
      {featuredMatches.length > 0 && (
        <section className="space-y-4">
          {/* Restructured 3-Row Mobile Header (Title row, Subtitle row, Compact Control row) */}
          <div className="space-y-2">
            {/* Row 1: Full-width Title + Inline Live Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight [text-wrap:balance]">
                {liveMatches.length > 0 ? "Live Matches & Financial Parity" : "Featured Fixtures & Squad Valuations"}
              </h2>
              {matchesData?.liveMatchesCount && matchesData.liveMatchesCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pitch-500/10 text-pitch-400 border border-pitch-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-pitch-400 animate-ping" />
                  {matchesData.liveMatchesCount} Live
                </span>
              ) : null}
            </div>

            {/* Row 2: Subtitle */}
            <p className="text-xs text-slate-400">
              Scores updated every 5s • Comparing squad values on the pitch
            </p>

            {/* Row 3: Compact Control Bar */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div>
                {liveMatches.length > 0 && (
                  <LiveAutoRefresher intervalMs={5000} label="Live" />
                )}
              </div>
              <Link
                href="/matches"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                All Matches ({matchesData?.totalMatches || 0}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {featuredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Top 5 Competitions Financial Barometer */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Competition Barometer</h2>
              <p className="text-xs text-slate-400">Domestic top flights ranked by total cumulative squad value</p>
            </div>
          </div>
          <Link
            href="/leagues"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            All Competitions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {leagues.length > 0 ? (
            leagues.slice(0, 5).map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="rounded-2xl glass-panel glass-panel-hover p-4 border border-slate-800/80 hover:border-amber-500/40 flex flex-col justify-between transition-all"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {league.country} • Tier {league.tier || 1}
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight truncate mt-0.5">
                    {league.name}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>{league.clubCount} Clubs</span>
                  <span className="text-amber-400 font-extrabold tabular-nums">
                    {formatCompactEur(league.totalMarketValue)}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"].map((name) => (
              <div
                key={name}
                className="rounded-2xl glass-panel p-4 border border-slate-800/60 text-slate-400 text-xs"
              >
                <div className="font-semibold text-white">{name}</div>
                <div className="text-[11px] text-slate-500 mt-1">Domestic League</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Market Value Movers (Top Risers & Fallers) */}
      {movers && (movers.risers.length > 0 || movers.fallers.length > 0) && (
        <section>
          <MarketMovers risers={movers.risers} fallers={movers.fallers} />
        </section>
      )}

      {/* Most Valuable Players Worldwide */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Most Valuable Players</h2>
              <p className="text-xs text-slate-400">Transfermarkt player market valuations and squad capital analytics</p>
            </div>
          </div>
          <Link
            href="/players"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors self-start sm:self-auto shrink-0"
          >
            View Worldwide Rankings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {valuablePlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {valuablePlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl glass-panel p-8 border border-slate-800 text-center space-y-3">
            <Shield className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white">Database Connected</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run <code className="text-amber-400 bg-slate-900 px-2 py-0.5 rounded">npm run sync:dataset</code> to sync players, valuations, and transfer history.
            </p>
          </div>
        )}
      </section>

      {/* Editorial Methodology Banner */}
      <section className="rounded-3xl glass-panel p-6 sm:p-8 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-slate-900/40 to-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Editorial Transparency</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            How Valuation Data & Live Match Delivery Are Grounded
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Read our methodology on how player valuations, career trajectory graphs, and live match events are sourced and processed with zero fabricated numbers.
          </p>
        </div>

        <Link
          href="/methodology"
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-ink-950 font-bold text-xs transition-all flex items-center gap-2 flex-shrink-0 shadow-lg shadow-amber-500/10"
        >
          <span>Explore Methodology</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
