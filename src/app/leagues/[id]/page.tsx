import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getLeagueById } from "@/lib/data/leagues";
import { formatCompactEur } from "@/lib/utils";
import { Trophy, Shield, Users, ArrowRight } from "lucide-react";

export const revalidate = 3600;

interface LeaguePageProps {
  params: {
    id: string;
  };
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const league = await getLeagueById(params.id);

  if (!league) {
    notFound();
  }

  const totalLeagueValue = league.clubs.reduce((acc, c) => acc + c.totalSquadValue, 0);

  return (
    <div className="space-y-8">
      {/* League Header */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-slate-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center justify-center shadow-xl flex-shrink-0">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {league.country} • Tier {league.tier || 1}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {league.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{league.clubs.length} Participating Clubs</span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:items-end justify-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total Competition Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight mt-1">
              {formatCompactEur(totalLeagueValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Clubs Ranking Table */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Club Valuations Ranking</h2>
            <p className="text-xs text-slate-400">Clubs ranked by cumulative squad market valuation</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                <th className="pb-3 w-12 text-center font-semibold">#</th>
                <th className="pb-3 font-semibold">Club</th>
                <th className="pb-3 text-center font-semibold">Squad Size</th>
                <th className="pb-3 text-right font-semibold">Total Squad Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {league.clubs.map((club, idx) => (
                <tr key={club.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="py-3 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="py-3 pr-4">
                    <Link href={`/clubs/${club.id}`} className="flex items-center gap-3">
                      <div className="relative w-7 h-7 rounded-lg bg-slate-800 p-1 flex-shrink-0">
                        {club.logoUrl ? (
                          <Image src={club.logoUrl} alt={club.name} fill className="object-contain" />
                        ) : (
                          <Shield className="w-4 h-4 m-auto text-slate-500" />
                        )}
                      </div>
                      <span className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                        {club.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 text-center text-slate-300">{club.squadSize}</td>
                  <td className="py-3 text-right text-emerald-400 font-extrabold whitespace-nowrap text-sm">
                    {formatCompactEur(club.totalSquadValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
