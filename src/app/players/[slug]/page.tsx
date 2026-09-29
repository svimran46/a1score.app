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
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { calculateAge, formatCompactEur, formatDate } from "@/lib/utils";
import { Calendar, Globe, Ruler, Footprints, TrendingUp } from "lucide-react";
import { constructMetadata, SITE_URL } from "@/lib/metadata";

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
    return constructMetadata({
      title: "Player Not Found",
      description: "The requested football player profile could not be located.",
      path: `/players/${params.slug}`,
    });
  }

  const formattedVal = player.latestMarketValue
    ? formatCompactEur(player.latestMarketValue)
    : "Valuation pending";
  const clubName = player.currentClub?.name || "Free Agent";
  const displayName = player.fullName || "Player Profile";
  const displayPos = player.position || "Footballer";

  return constructMetadata({
    title: `${displayName} — Market Value (${formattedVal}), Stats & Transfers`,
    description: `${displayName} (${displayPos}) playing for ${clubName}. Current market valuation: ${formattedVal}. Career transfer history, verified season statistics, and valuation evolution chart on a1score.app.`,
    path: `/players/${params.slug}`,
    image: player.photoUrl || undefined,
  });
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const player = await getPlayerBySlugOrId(params.slug);

  if (!player) {
    notFound();
  }

  const age = calculateAge(player.dateOfBirth);
  const mvs = Array.isArray(player.marketValues) ? player.marketValues : [];
  const latestValuation = mvs.length > 0 ? mvs[mvs.length - 1] : undefined;

  // Fetch positional peers for benchmarking safely
  const peers = player.position
    ? await getPositionalPeers(player.position, player.id, 5).catch(() => [])
    : [];

  const rawClub = player.currentClub;
  const currentClub = Array.isArray(rawClub) ? rawClub[0] || null : rawClub || null;
  const rawLeague = currentClub?.league;
  const currentLeague = Array.isArray(rawLeague) ? rawLeague[0] || null : rawLeague || null;

  const validDob =
    player.dateOfBirth && !isNaN(new Date(player.dateOfBirth).getTime())
      ? new Date(player.dateOfBirth)
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.fullName || "Footballer",
    alternateName: player.commonName || undefined,
    jobTitle: `Professional Footballer (${player.position || "Player"})`,
    image: player.photoUrl || undefined,
    nationality:
      Array.isArray(player.nationality) && player.nationality.length > 0
        ? player.nationality[0]
        : typeof player.nationality === "string"
        ? player.nationality
        : undefined,
    birthDate: validDob ? validDob.toISOString().split("T")[0] : undefined,
    memberOf: currentClub
      ? {
          "@type": "SportsTeam",
          name: currentClub.name || "Club",
          url: currentClub.id ? `${SITE_URL}/clubs/${currentClub.id}` : undefined,
        }
      : undefined,
    url: `${SITE_URL}/players/${params.slug}`,
  };

  const nationalityText =
    Array.isArray(player.nationality) && player.nationality.length > 0
      ? player.nationality.join(", ")
      : typeof player.nationality === "string" && player.nationality
      ? player.nationality
      : "Unknown";

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Section 1: Player Header Card */}
      <SectionErrorBoundary sectionName="Player Header">
        <div className="relative overflow-hidden rounded-3xl glass-panel p-4 sm:p-8 border border-slate-800 bg-slate-900/40">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6 justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
              {/* Player Photo */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-slate-800 overflow-hidden border-2 border-slate-700/80 shadow-2xl shrink-0 mx-auto sm:mx-0">
                <EntityImage
                  src={player.photoUrl}
                  alt={player.fullName || "Player"}
                  fill
                  className="object-cover"
                  sizes="128px"
                  entityType="player"
                  priority
                />
              </div>

              {/* Core Bio Info */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    {player.position || "Player"}
                  </span>
                  {player.subPosition && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                      {player.subPosition}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight [text-wrap:balance]">
                  {player.fullName || "Player Profile"}
                </h1>

                {/* Current Club Link */}
                {currentClub && (
                  <Link
                    href={`/clubs/${currentClub.id}`}
                    className="inline-flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-300 hover:text-white transition-colors group"
                  >
                    <div className="relative w-5 h-5 shrink-0">
                      <EntityImage
                        src={currentClub.logoUrl}
                        alt={currentClub.name || "Club"}
                        fill
                        sizes="20px"
                        entityType="club"
                        className="object-contain"
                      />
                    </div>
                    <span className="font-semibold group-hover:underline truncate">
                      {currentClub.name || "Club"}
                    </span>
                    {currentLeague?.name && (
                      <span className="text-slate-500 text-xs shrink-0">
                        ({currentLeague.name})
                      </span>
                    )}
                  </Link>
                )}
              </div>
            </div>

            {/* Current Market Value Badge */}
            <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 flex flex-col items-center md:items-end justify-center shadow-lg shadow-amber-500/5 text-center md:text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Estimated Market Value
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mt-1 tabular-nums whitespace-nowrap">
                {latestValuation ? formatCompactEur(latestValuation.valueEur) : player.latestMarketValue ? formatCompactEur(player.latestMarketValue) : "N/A"}
              </span>
              {latestValuation && latestValuation.date && (
                <span className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
                  Updated {formatDate(latestValuation.date)}
                </span>
              )}
            </div>
          </div>

          {/* Attribute Pills: 2-column on mobile with label above value, no clipping */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
            <div className="flex flex-col gap-0.5 min-w-0 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Age / Birth
              </span>
              <span className="text-white font-medium truncate mt-0.5">
                {age ? `${age} yrs` : "Unknown"}{" "}
                {validDob && (
                  <span className="text-slate-400 text-[11px]">({formatDate(validDob)})</span>
                )}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 min-w-0 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Nationality
              </span>
              <span className="text-white font-medium truncate mt-0.5">
                {nationalityText}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 min-w-0 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1.5 truncate">
                <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Height
              </span>
              <span className="text-white font-medium truncate mt-0.5">
                {player.heightCm ? `${player.heightCm} cm` : "Unknown"}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 min-w-0 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1.5 truncate">
                <Footprints className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Preferred Foot
              </span>
              <span className="text-white font-medium capitalize truncate mt-0.5">
                {player.preferredFoot || "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </SectionErrorBoundary>

      {/* Section 2: Synthesis: Valuation Intelligence & Performance Correlation */}
      <SectionErrorBoundary sectionName="Valuation & Performance Intelligence">
        <PlayerIntelligenceRibbon
          latestMarketValue={player.latestMarketValue || 0}
          marketValues={mvs}
          seasonStats={Array.isArray(player.seasonStats) ? player.seasonStats : []}
          dateOfBirth={validDob}
          position={player.subPosition || player.position || "Player"}
        />
      </SectionErrorBoundary>

      {/* Section 3: Market Value Progression Chart with Peak Annotations and Milestones */}
      <SectionErrorBoundary sectionName="Market Value Chart">
        <section>
          <MarketValueChart
            data={mvs}
            playerName={player.commonName || player.fullName || "Player"}
            transfers={Array.isArray(player.transfers) ? player.transfers : []}
            dateOfBirth={validDob}
          />
        </section>
      </SectionErrorBoundary>

      {/* Section 4: Positional Peer Benchmarking */}
      {peers.length > 0 && (
        <SectionErrorBoundary sectionName="Positional Peers">
          <section>
            <PositionalPeers
              currentMarketValue={player.latestMarketValue || 0}
              currentPosition={player.subPosition || player.position || "Player"}
              peers={peers}
            />
          </section>
        </SectionErrorBoundary>
      )}

      {/* Section 5, 6, 7: Season Stats, Transfers & Injuries */}
      <div className="space-y-8">
        <SectionErrorBoundary sectionName="Season Statistics">
          <StatsTable stats={Array.isArray(player.seasonStats) ? player.seasonStats : []} />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Transfer History">
          <TransfersTable transfers={Array.isArray(player.transfers) ? player.transfers : []} />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Injury History">
          <InjuriesTable injuries={Array.isArray(player.injuries) ? player.injuries : []} />
        </SectionErrorBoundary>
      </div>
    </div>
  );
}
