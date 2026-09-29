import { notFound } from "next/navigation";
import { EntityImage } from "@/components/EntityImage";
import Link from "next/link";
import { getPlayerBySlugOrId, getPositionalPeers } from "@/lib/data/players";
import { MarketValueChart } from "@/components/MarketValueChart";
import { TransfersTable } from "@/components/TransfersTable";
import { StatsTable } from "@/components/StatsTable";
import { InjuriesTable } from "@/components/InjuriesTable";
import { PositionalPeers } from "@/components/PositionalPeers";
import { PlayerIntelligenceRibbon } from "@/components/PlayerIntelligenceRibbon";
import { calculateAge, formatCompactEur, formatEur, formatDate } from "@/lib/utils";
import { User, Shield, Calendar, Globe, Ruler, Footprints, TrendingUp } from "lucide-react";

import type { Metadata } from "next";

export const revalidate = 3600; // ISR revalidation every hour
export const runtime = "edge";

interface PlayerPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const player = await getPlayerBySlugOrId(params.slug);
  if (!player) {
    return {
      title: "Player Not Found | a1score.app",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://a1score.app";
  const formattedVal = player.latestMarketValue
    ? formatCompactEur(player.latestMarketValue)
    : "Valuation pending";
  const clubName = player.currentClub?.name || "Free Agent";

  return {
    title: `${player.fullName} — Market Value (${formattedVal}), Stats & Transfers | a1score.app`,
    description: `${player.fullName} (${player.position}) playing for ${clubName}. Current market valuation: ${formattedVal}. Career transfer history, verified season statistics, and valuation evolution chart on a1score.app.`,
    alternates: {
      canonical: `${baseUrl}/players/${params.slug}`,
    },
    openGraph: {
      title: `${player.fullName} — Market Value & Career Stats | a1score.app`,
      description: `${player.position} at ${clubName} valued at ${formattedVal}. Complete career stats, valuation curve, and transfer ledger.`,
      images: player.photoUrl ? [{ url: player.photoUrl }] : undefined,
    },
  };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const player = await getPlayerBySlugOrId(params.slug);

  if (!player) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://a1score.app";
  const age = calculateAge(player.dateOfBirth);
  const latestValuation = player.marketValues[player.marketValues.length - 1];

  // Fetch positional peers for benchmarking
  const peers = await getPositionalPeers(player.position, player.id, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.fullName,
    alternateName: player.commonName || undefined,
    jobTitle: `Professional Footballer (${player.position})`,
    image: player.photoUrl || undefined,
    nationality: player.nationality?.[0] || undefined,
    birthDate: player.dateOfBirth
      ? new Date(player.dateOfBirth).toISOString().split("T")[0]
      : undefined,
    memberOf: player.currentClub
      ? {
          "@type": "SportsTeam",
          name: player.currentClub.name,
          url: `${baseUrl}/clubs/${player.currentClub.id}`,
        }
      : undefined,
    url: `${baseUrl}/players/${params.slug}`,
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Player Header Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-slate-900/40">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Player Photo */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-800 overflow-hidden border-2 border-slate-700/80 shadow-2xl flex-shrink-0">
              <EntityImage
                src={player.photoUrl}
                alt={player.fullName}
                fill
                className="object-cover"
                sizes="128px"
                entityType="player"
                priority
              />
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
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <EntityImage
                        src={player.currentClub.logoUrl}
                        alt={player.currentClub.name}
                        fill
                        sizes="20px"
                        entityType="club"
                        className="object-contain"
                      />
                    </div>
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
          <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 flex flex-col md:items-end justify-center shadow-lg shadow-amber-500/5">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Estimated Market Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mt-1 tabular-nums">
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

      {/* Synthesis: Valuation Intelligence & Performance Correlation */}
      <PlayerIntelligenceRibbon
        latestMarketValue={player.latestMarketValue}
        marketValues={player.marketValues}
        seasonStats={player.seasonStats}
        dateOfBirth={player.dateOfBirth}
        position={player.subPosition || player.position}
      />

      {/* Market Value Progression Chart with Peak Annotations and Milestones */}
      <section>
        <MarketValueChart
          data={player.marketValues}
          playerName={player.commonName || player.fullName}
          transfers={player.transfers}
          dateOfBirth={player.dateOfBirth}
        />
      </section>

      {/* Positional Peer Benchmarking */}
      {peers.length > 0 && (
        <section>
          <PositionalPeers
            currentMarketValue={player.latestMarketValue}
            currentPosition={player.subPosition || player.position}
            peers={peers}
          />
        </section>
      )}

      {/* Season Stats & Transfers */}
      <div className="space-y-8">
        <StatsTable stats={player.seasonStats} />
        <TransfersTable transfers={player.transfers} />
        <InjuriesTable injuries={player.injuries} />
      </div>
    </div>
  );
}
