import Link from "next/link";
import { getMostValuablePlayers } from "@/lib/data/players";
import { getLeagues } from "@/lib/data/leagues";
import { PlayerCard } from "@/components/PlayerCard";
import { Search, TrendingUp, Trophy, ArrowRight, Shield, Zap } from "lucide-react";

export const revalidate = 3600; // ISR revalidation every hour

export default async function HomePage() {
  const [valuablePlayers, leagues] = await Promise.all([
    getMostValuablePlayers(8),
    getLeagues(),
  ]);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/80">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-3.5 h-3.5" />
            <span>Next-Gen Football Market Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Valuations, Career Stats & Transfer Timelines.
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Browse verified player market-value curves, historical records, and squad analytics across top European competitions.
          </p>

          {/* Quick Search */}
          <form action="/search" method="GET" className="relative max-w-xl pt-2">
            <input
              type="text"
              name="q"
              placeholder="Search Haaland, Bellingham, Real Madrid, Premier League..."
              className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 rounded-2xl pl-12 pr-28 py-3.5 border border-slate-700/80 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-xl transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-5.5" />
            <button
              type="submit"
              className="absolute right-2 top-3.5 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              Explore
            </button>
          </form>
        </div>
      </section>

      {/* Top Leagues Row */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Top Competitions</h2>
          </div>
          <Link
            href="/leagues"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            All Leagues <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {leagues.length > 0 ? (
            leagues.slice(0, 5).map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="rounded-2xl glass-panel glass-panel-hover p-4 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {league.country}
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight truncate mt-0.5">
                    {league.name}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>{league.clubCount} Clubs</span>
                  <span className="text-emerald-400 font-semibold">Tier {league.tier || 1}</span>
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
                <div className="text-[11px] text-slate-500 mt-1">Dataset sync ready</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Most Valuable Players */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Most Valuable Players</h2>
              <p className="text-xs text-slate-400">Current top market valuations in global football</p>
            </div>
          </div>
          <Link
            href="/search?filter=valuable"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            View Rankings <ArrowRight className="w-3.5 h-3.5" />
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
            <h3 className="text-sm font-semibold text-white">Database Initialized</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run <code className="text-emerald-400 bg-slate-900 px-2 py-0.5 rounded">npm run sync:dataset</code> to populate real players, valuations, clubs, and transfer history.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
