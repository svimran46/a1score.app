import { notFound } from "next/navigation";
import { EntityImage } from "@/components/EntityImage";
import Link from "next/link";
import { getClubById, getClubTransfers } from "@/lib/data/clubs";
import { getFotmobTeamDetails } from "@/lib/fotmob/client";
import { FOTMOB_TEAM_MAPPINGS } from "@/lib/league-mappings";
import { formatCompactEur } from "@/lib/utils";
import { Shield, Users, Trophy, Globe, Calendar, Clock } from "lucide-react";
import { ClubTabsContainer } from "@/components/ClubTabsContainer";

import { constructMetadata, SITE_URL } from "@/lib/metadata";
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
    return constructMetadata({
      title: "Club Not Found",
      description: "The requested football club profile could not be located.",
      path: `/clubs/${params.id}`,
    });
  }

  const formattedVal = club.totalSquadValue
    ? formatCompactEur(club.totalSquadValue)
    : "Valuation pending";

  return constructMetadata({
    title: `${club.name} — Squad Market Value (${formattedVal}), Roster & Stats`,
    description: `Senior squad market valuations, player profiles, and financial analytics for ${club.name}. Total squad valuation: ${formattedVal} on a1score.app.`,
    path: `/clubs/${params.id}`,
    image: club.logoUrl || undefined,
  });
}

export default async function ClubPage({ params }: ClubPageProps) {
  const club = await getClubById(params.id);

  if (!club) {
    notFound();
  }

  // Find FotMob team ID
  let fotmobTeamId: number | null = null;
  const tmId = club.transfermarktId;
  for (const [fId, mapping] of Object.entries(FOTMOB_TEAM_MAPPINGS)) {
    if (mapping.tmId === tmId || mapping.name?.toLowerCase() === club.name?.toLowerCase()) {
      fotmobTeamId = Number(fId);
      break;
    }
  }

  const [transfersData, fotmobDetails] = await Promise.all([
    getClubTransfers(club.name),
    fotmobTeamId ? getFotmobTeamDetails(fotmobTeamId).catch(() => null) : Promise.resolve(null),
  ]);

  const seniorSquad = club.firstTeamPlayers && club.firstTeamPlayers.length > 0
    ? club.firstTeamPlayers
    : club.players.filter((p: any) => p.tier !== "academy");

  const academySquad = club.academyPlayers || club.players.filter((p: any) => p.tier === "academy");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: club.name,
    sport: "Football",
    logo: club.logoUrl || undefined,
    url: `${SITE_URL}/clubs/${params.id}`,
    memberOf: club.league
      ? {
          "@type": "SportsOrganization",
          name: club.league.name,
          url: `${SITE_URL}/leagues/${club.league.id}`,
        }
      : undefined,
    member: seniorSquad.slice(0, 30).map((p: any) => ({
      "@type": "Person",
      name: p.fullName,
      jobTitle: p.position,
    })),
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Club Header */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-slate-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800 p-2 border border-slate-700/80 shadow-xl flex-shrink-0 overflow-hidden">
              <EntityImage
                src={club.logoUrl}
                alt=""
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
                  {seniorSquad.length} First Team Players
                </span>
                {club.averageAge && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    {club.averageAge} yrs avg
                  </span>
                )}
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
            <span className="text-[10px] text-slate-500 mt-0.5">
              Based on senior first-team roster
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Tab Interactive Interface (Squad, Stadium & Manager, Form, Transfers, Pyramid) */}
      <ClubTabsContainer
        clubName={club.name}
        totalSquadValue={club.totalSquadValue}
        players={club.players}
        firstTeamPlayers={seniorSquad}
        academyPlayers={academySquad}
        details={fotmobDetails}
        transfersData={transfersData}
        leagueName={club.league?.name}
      />
    </div>
  );
}
