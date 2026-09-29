import Link from "next/link";
import { getLeagues } from "@/lib/data/leagues";
import { formatCompactEur } from "@/lib/utils";
import { Trophy, Globe } from "lucide-react";

import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Football Leagues & Competitions — Standings & Market Values",
  description:
    "Explore Premier League, LaLiga, Serie A, Bundesliga, Ligue 1 and top global competitions with official standings, club counts, and cumulative market values on a1score.app.",
  path: "/leagues",
});

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 sm:gap-3 [text-wrap:balance]">
          <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 shrink-0" />
          Competitions &amp; Leagues
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 [text-wrap:balance]">
          Explore domestic leagues, cups, and continental tournaments
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 gap-3.5 sm:gap-4">
        {leagues.length > 0 ? (
          leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="rounded-2xl glass-panel glass-panel-hover p-4 sm:p-6 border border-slate-800 flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{league.country}</span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight mt-1 truncate">
                    {league.name}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                <span className="text-slate-400 truncate text-[11px] sm:text-xs">
                  {(league.clubCount || 0).toLocaleString("en-US")} Clubs • {(league.totalPlayers || 0).toLocaleString("en-US")} Players
                </span>
                <span className="text-amber-400 font-extrabold text-xs sm:text-sm tabular-nums shrink-0 whitespace-nowrap">
                  {formatCompactEur(league.totalMarketValue)}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full rounded-2xl glass-panel p-12 border border-slate-800 text-center text-slate-400 text-sm">
            No league records synced yet. Run <code className="text-emerald-400 bg-slate-900 px-2 py-0.5 rounded">npm run sync:dataset</code>.
          </div>
        )}
      </div>
    </div>
  );
}
