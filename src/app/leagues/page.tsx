import Link from "next/link";
import { getLeagues } from "@/lib/data/leagues";
import { formatCompactEur } from "@/lib/utils";
import { Trophy, Globe } from "lucide-react";

export const revalidate = 3600;

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Competitions & Leagues
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore domestic leagues, cups, and continental tournaments
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {leagues.length > 0 ? (
          leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="rounded-2xl glass-panel glass-panel-hover p-6 border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>{league.country}</span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight mt-1">
                    {league.name}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {league.clubCount} Clubs • {league.totalPlayers} Players
                </span>
                <span className="text-emerald-400 font-extrabold text-sm">
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
