import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getLeagueById } from "@/lib/data/leagues";
import { formatCompactEur } from "@/lib/utils";
import { Trophy, Shield } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

interface LeaguePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: LeaguePageProps): Promise<Metadata> {
  const league = await getLeagueById(params.id);
  if (!league) {
    return {
      title: "Competition Not Found | a1score.app",
    };
  }

  return {
    title: `${league.name} — Standings, Club Valuations & Stats | a1score.app`,
    description: `Official ${league.name} standings (${league.season || "2024/2025"}), live table, ${league.clubCount} participating clubs, and squad market valuation analytics on a1score.app.`,
    openGraph: {
      title: `${league.name} — Standings & Market Values`,
      description: `Explore live table, club rankings, and cumulative squad market values for ${league.name}.`,
    },
  };
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const league = await getLeagueById(params.id);

  if (!league) {
    return notFound();
  }

  const totalLeagueValue = league.clubs.reduce((acc, c) => acc + c.totalSquadValue, 0);
  const hasStandings = league.standings && league.standings.length > 0;

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
                <span>{league.clubCount} Official Clubs</span>
                <span>•</span>
                <span>Season {league.season || "2024/2025"}</span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:items-end justify-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total Competition Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mt-1 tabular-nums">
              {formatCompactEur(totalLeagueValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Standings Table (if available from FotMob) */}
      {hasStandings && (
        <div className="rounded-2xl glass-panel p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Official League Table</h2>
              <p className="text-xs text-slate-400">Live standings synchronized with squad market values</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Season {league.season}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                  <th className="pb-3 w-10 text-center font-semibold">#</th>
                  <th className="pb-3 font-semibold">Club</th>
                  <th className="pb-3 text-center font-semibold">P</th>
                  <th className="pb-3 text-center font-semibold">W</th>
                  <th className="pb-3 text-center font-semibold">D</th>
                  <th className="pb-3 text-center font-semibold">L</th>
                  <th className="pb-3 text-center font-semibold">GD</th>
                  <th className="pb-3 text-right font-semibold">Squad Value</th>
                  <th className="pb-3 text-right font-bold text-white pr-2">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {league.standings.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="py-3 text-center font-bold text-slate-500">
                      <div className="flex items-center justify-center gap-1.5">
                        {row.qualColor && (
                          <span
                            className="w-1.5 h-3.5 rounded-full"
                            style={{ backgroundColor: row.qualColor }}
                          />
                        )}
                        <span>{row.idx}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {row.clubId ? (
                        <Link href={`/clubs/${row.clubId}`} className="flex items-center gap-3">
                          <div className="relative w-6 h-6 rounded-md bg-slate-800 p-0.5 flex-shrink-0">
                            <Image
                              src={row.imageUrl}
                              alt={row.name}
                              fill
                              sizes="24px"
                              className="object-contain"
                            />
                          </div>
                          <span className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                            {row.name}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="relative w-6 h-6 rounded-md bg-slate-800 p-0.5 flex-shrink-0">
                            <Image
                              src={row.imageUrl}
                              alt={row.name}
                              fill
                              sizes="24px"
                              className="object-contain"
                            />
                          </div>
                          <span className="text-white font-semibold">{row.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-center text-slate-300">{row.played}</td>
                    <td className="py-3 text-center text-slate-300">{row.wins}</td>
                    <td className="py-3 text-center text-slate-300">{row.draws}</td>
                    <td className="py-3 text-center text-slate-300">{row.losses}</td>
                    <td className="py-3 text-center font-medium text-slate-200">
                      {row.goalConDiff > 0 ? `+${row.goalConDiff}` : row.goalConDiff}
                    </td>
                    <td className="py-3 text-right text-amber-400 font-semibold whitespace-nowrap tabular-nums">
                      {row.totalSquadValue > 0 ? formatCompactEur(row.totalSquadValue) : "—"}
                    </td>
                    <td className="py-3 text-right text-white font-extrabold text-sm pr-2 tabular-nums">
                      {row.pts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clubs Valuation Ranking Table */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Club Valuations Ranking</h2>
            <p className="text-xs text-slate-400">All participating clubs ranked by cumulative squad market valuation</p>
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
                          <Image
                            src={club.logoUrl}
                            alt={club.name}
                            fill
                            sizes="28px"
                            className="object-contain"
                          />
                        ) : (
                          <Shield className="w-4 h-4 m-auto text-slate-500" />
                        )}
                      </div>
                      <span className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                        {club.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 text-center text-slate-300 tabular-nums">{club.squadSize}</td>
                  <td className="py-3 text-right text-amber-400 font-extrabold whitespace-nowrap text-sm tabular-nums">
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
