import { notFound } from "next/navigation";
import { EntityImage } from "@/components/EntityImage";
import Link from "next/link";
import { getClubById, getClubTransfers } from "@/lib/data/clubs";
import { formatCompactEur, formatEur } from "@/lib/utils";
import { Shield, Users, Trophy, Globe, User } from "lucide-react";
import { SquadValuationPyramid } from "@/components/SquadValuationPyramid";
import { ClubTransferLedger } from "@/components/ClubTransferLedger";

import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

interface ClubPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ClubPageProps): Promise<Metadata> {
  const club = await getClubById(params.id);
  if (!club) {
    return {
      title: "Club Not Found | a1score.app",
    };
  }

  const formattedVal = club.totalSquadValue
    ? formatCompactEur(club.totalSquadValue)
    : "Valuation pending";

  return {
    title: `${club.name} — Squad Market Value (${formattedVal}), Roster & Stats | a1score.app`,
    description: `Official squad sheet, player valuations, and financial analytics for ${club.name}. Total squad valuation: ${formattedVal}. Detailed roster profiles on a1score.app.`,
    openGraph: {
      title: `${club.name} — Squad Market Value (${formattedVal})`,
      description: `Explore ${club.name} squad valuation, player roster, and transfer profiles.`,
      images: club.logoUrl ? [{ url: club.logoUrl }] : undefined,
    },
  };
}

export default async function ClubPage({ params }: ClubPageProps) {
  const club = await getClubById(params.id);

  if (!club) {
    notFound();
  }

  const transfersData = await getClubTransfers(club.name);

  return (
    <div className="space-y-8">
      {/* Club Header */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-slate-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800 p-2 border border-slate-700/80 shadow-xl flex-shrink-0 overflow-hidden">
              <EntityImage
                src={club.logoUrl}
                alt={club.name}
                fill
                sizes="96px"
                entityType="club"
                className="object-contain p-2"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Football Club
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {club.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                {club.country && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    {club.country}
                  </span>
                )}
                {club.league && (
                  <Link
                    href={`/leagues/${club.league.id}`}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    {club.league.name}
                  </Link>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  {club.players.length} Players
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 shadow-lg shadow-amber-500/5 flex flex-col sm:items-end justify-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total Squad Valuation
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mt-1 tabular-nums">
              {formatCompactEur(club.totalSquadValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Squad Valuation Pyramid & Demographic Intelligence */}
      <SquadValuationPyramid
        players={club.players}
        totalSquadValue={club.totalSquadValue}
        clubName={club.name}
      />

      {/* Transfer Flow & Commercial Ledger */}
      <ClubTransferLedger
        recordArrivals={transfersData.recordArrivals}
        recordDepartures={transfersData.recordDepartures}
        clubName={club.name}
      />

      {/* Squad Table */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Squad & Valuations</h2>
            <p className="text-xs text-slate-400">All registered squad members sorted by market value</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                <th className="pb-3 font-semibold">Player</th>
                <th className="pb-3 font-semibold">Position</th>
                <th className="pb-3 font-semibold">Nationality</th>
                <th className="pb-3 text-right font-semibold">Market Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {club.players.map((p: any) => {
                const slug = `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${
                  p.transfermarktId || p.id
                }`;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="py-3 pr-4">
                      <Link href={`/players/${slug}`} className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                          <EntityImage
                            src={p.photoUrl}
                            alt={p.fullName}
                            fill
                            sizes="32px"
                            entityType="player"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-white font-semibold group-hover:text-amber-400 transition-colors">
                            {p.commonName || p.fullName}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium border border-slate-700/60">
                        {p.position}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{p.nationality.join(", ") || "-"}</td>
                    <td className="py-3 text-right text-amber-400 font-extrabold whitespace-nowrap text-sm tabular-nums">
                      {p.latestMarketValue ? formatCompactEur(p.latestMarketValue) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
