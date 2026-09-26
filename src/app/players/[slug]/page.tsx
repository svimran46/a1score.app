import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPlayerBySlugOrId } from "@/lib/data/players";
import { MarketValueChart } from "@/components/MarketValueChart";
import { TransfersTable } from "@/components/TransfersTable";
import { StatsTable } from "@/components/StatsTable";
import { InjuriesTable } from "@/components/InjuriesTable";
import { calculateAge, formatCompactEur, formatEur, formatDate } from "@/lib/utils";
import { User, Shield, Calendar, Globe, Ruler, Footprints, TrendingUp } from "lucide-react";

export const revalidate = 3600; // ISR revalidation every hour

interface PlayerPageProps {
  params: {
    slug: string;
  };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const player = await getPlayerBySlugOrId(params.slug);

  if (!player) {
    notFound();
  }

  const age = calculateAge(player.dateOfBirth);
  const latestValuation = player.marketValues[player.marketValues.length - 1];

  return (
    <div className="space-y-8">
      {/* Player Header Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-slate-900/40">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Player Photo */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-800 overflow-hidden border-2 border-slate-700/80 shadow-2xl flex-shrink-0">
              {player.photoUrl ? (
                <Image
                  src={player.photoUrl}
                  alt={player.fullName}
                  fill
                  className="object-cover"
                  sizes="128px"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <User className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Core Bio Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {player.position}
                </span>
                {player.subPosition && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {player.subPosition}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {player.fullName}
              </h1>

              {/* Current Club Link */}
              {player.currentClub && (
                <Link
                  href={`/clubs/${player.currentClub.id}`}
                  className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors group"
                >
                  {player.currentClub.logoUrl ? (
                    <div className="relative w-5 h-5">
                      <Image
                        src={player.currentClub.logoUrl}
                        alt={player.currentClub.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <Shield className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="font-semibold group-hover:underline">
                    {player.currentClub.name}
                  </span>
                  {player.currentClub.league && (
                    <span className="text-slate-500 text-xs">
                      ({player.currentClub.league.name})
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>

          {/* Current Market Value Badge */}
          <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:items-end justify-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Estimated Market Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight mt-1">
              {latestValuation ? formatCompactEur(latestValuation.valueEur) : "N/A"}
            </span>
            {latestValuation && (
              <span className="text-[11px] text-slate-500 mt-0.5">
                Updated {formatDate(latestValuation.date)}
              </span>
            )}
          </div>
        </div>

        {/* Attribute Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2.5 text-slate-400">
            <Calendar className="w-4 h-4 text-slate-500" />
            <div>
              <span className="block text-slate-500 text-[10px] uppercase font-semibold">Age / Birth</span>
              <span className="text-white font-medium">
                {age ? `${age} yrs` : "-"} ({formatDate(player.dateOfBirth)})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-400">
            <Globe className="w-4 h-4 text-slate-500" />
            <div>
              <span className="block text-slate-500 text-[10px] uppercase font-semibold">Nationality</span>
              <span className="text-white font-medium">
                {player.nationality.length > 0 ? player.nationality.join(", ") : "-"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-400">
            <Ruler className="w-4 h-4 text-slate-500" />
            <div>
              <span className="block text-slate-500 text-[10px] uppercase font-semibold">Height</span>
              <span className="text-white font-medium">
                {player.heightCm ? `${player.heightCm} cm` : "-"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-400">
            <Footprints className="w-4 h-4 text-slate-500" />
            <div>
              <span className="block text-slate-500 text-[10px] uppercase font-semibold">Preferred Foot</span>
              <span className="text-white font-medium capitalize">
                {player.preferredFoot || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Value Progression Chart */}
      <section>
        <MarketValueChart
          data={player.marketValues}
          playerName={player.commonName || player.fullName}
        />
      </section>

      {/* Season Stats & Transfers */}
      <div className="space-y-8">
        <StatsTable stats={player.seasonStats} />
        <TransfersTable transfers={player.transfers} />
        <InjuriesTable injuries={player.injuries} />
      </div>
    </div>
  );
}
