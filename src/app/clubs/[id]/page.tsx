import { notFound, permanentRedirect } from "next/navigation";
import { EntityImage } from "@/components/EntityImage";
import Link from "next/link";
import { getClubById, getClubTransfers, getClubDisplayName, getClubHonours } from "@/lib/data/clubs";
import { getLeagueById } from "@/lib/data/leagues";
import { getFotmobTeamDetails } from "@/lib/fotmob/client";
import { FOTMOB_TEAM_MAPPINGS } from "@/lib/league-mappings";
import { formatCompactEur } from "@/lib/utils";
import { getClubSlug, getLeagueSlug } from "@/lib/slugs";
import { Users, Trophy, Globe, Clock } from "lucide-react";
import { ClubTabsContainer } from "@/components/ClubTabsContainer";
import { ClubHonoursStatStrip } from "@/components/ClubHonoursStatStrip";
import { RelatedNewsCard } from "@/components/news/RelatedNewsCard";
import { getRelatedNews } from "@/lib/data/news";
import { Card, ValuationFreshness, Breadcrumbs } from "@/components/ui";
import { FollowButton } from "@/components/watchlist/FollowButton";

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
  const league = await getLeagueById(params.id);
  if (league) {
    const canonicalSlug = getLeagueSlug(league);
    const rawLeagueTitle = `${league.name} clubs, players and market values | a1score`;
    const leagueDesc = `${league.name} standings, ${league.clubCount} clubs, top players, and squad market values. See table and financial analytics.`;
    return constructMetadata({
      title: rawLeagueTitle,
      description: leagueDesc.length > 155 ? leagueDesc.slice(0, 152) + "..." : leagueDesc,
      path: `/leagues/${canonicalSlug}`,
      image: league.logoUrl || undefined,
    });
  }

  const club = await getClubById(params.id);
  if (!club) {
    return constructMetadata({
      title: "Club Not Found | a1score",
      description: "The requested football club profile could not be located.",
      path: `/clubs/${params.id}`,
    });
  }

  const formattedVal = club.totalSquadValue
    ? formatCompactEur(club.totalSquadValue)
    : "Valuation pending";
  const canonicalSlug = getClubSlug(club);
  const squadCount = club.squadSize || club.seniorSquad?.length || 0;

  const rawClubTitle = `${club.name} squad value, players and transfers | a1score`;
  const clubDesc = `${club.name} squad is valued at ${formattedVal}${squadCount ? ` with ${squadCount} players` : ""}. See squad value, player profiles, and transfer history.`;

  return constructMetadata({
    title: rawClubTitle,
    description: clubDesc.length > 155 ? clubDesc.slice(0, 152) + "..." : clubDesc,
    path: `/clubs/${canonicalSlug}`,
    image: club.logoUrl || undefined,
  });
}

export default async function ClubPage({ params }: ClubPageProps) {
  // If user requests a league alias or CUID under /clubs (e.g. /clubs/laliga or /clubs/serie-a), redirect to league page
  const league = await getLeagueById(params.id);
  if (league) {
    const canonicalLeagueSlug = getLeagueSlug(league);
    permanentRedirect(`/leagues/${canonicalLeagueSlug}`);
  }

  const club = await getClubById(params.id);

  if (!club) {
    notFound();
  }

  // 301 redirect any non-canonical slug, legacy CUID, or numeric ID to canonical slug URL
  const canonicalSlug = getClubSlug(club);
  if (params.id !== canonicalSlug) {
    permanentRedirect(`/clubs/${canonicalSlug}`);
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

  const [transfersData, fotmobDetails, clubHonours, relatedNews] = await Promise.all([
    getClubTransfers(club.name),
    fotmobTeamId ? getFotmobTeamDetails(fotmobTeamId).catch(() => null) : Promise.resolve(null),
    getClubHonours(club.id, club.name),
    getRelatedNews([club.name, getClubDisplayName(club)], 3).catch(() => []),
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
    url: `${SITE_URL}/clubs/${canonicalSlug}`,
    memberOf: club.league
      ? {
          "@type": "SportsOrganization",
          name: club.league.name,
          url: `${SITE_URL}/leagues/${getLeagueSlug(club.league)}`,
        }
      : undefined,
    member: seniorSquad.slice(0, 30).map((p: any) => ({
      "@type": "Person",
      name: p.fullName,
      jobTitle: p.position,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Clubs", item: `${SITE_URL}/clubs` },
      { "@type": "ListItem", position: 3, name: club.name, item: `${SITE_URL}/clubs/${canonicalSlug}` },
    ],
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Clubs", href: "/clubs" },
    { label: club.name },
  ];

  return (
    <div className="space-y-4 max-w-[720px] mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      {/* Club Header Card */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--bg-page)] p-2 shrink-0 overflow-hidden flex items-center justify-center">
              <EntityImage
                src={club.logoUrl}
                alt=""
                fill
                sizes="80px"
                entityType="club"
                className="object-contain p-1"
              />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Football Club
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight truncate mt-0.5">
                {getClubDisplayName(club)}
              </h1>
              {club.name && club.name !== getClubDisplayName(club) && (
                <p className="text-xs text-[var(--text-muted)] font-medium truncate" title={club.name}>
                  {club.name}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--text-secondary)] mt-1">
                {club.country && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    {club.country}
                  </span>
                )}
                {club.league && (
                  <Link
                    href={`/leagues/${club.league.id}`}
                    className="flex items-center gap-1 font-semibold text-[var(--value-text)] hover:underline transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    {club.league.name}
                  </Link>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[var(--trend-positive)]" />
                  {seniorSquad.length} Players
                </span>
                {club.averageAge && (
                  <span className="flex items-center gap-1 text-[var(--text-muted)]">
                    <Clock className="w-3.5 h-3.5" />
                    {club.averageAge} yrs avg
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Squad Market Value in Amber + Follow Button */}
          <div className="flex flex-col sm:items-end gap-2.5 w-full sm:w-auto shrink-0">
            <div className="w-full sm:w-auto p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-elevated)] flex flex-col sm:items-end justify-center shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Total Squad Valuation
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[var(--value-text)] tracking-tight mt-0.5 tabular-nums">
                {formatCompactEur(club.totalSquadValue)}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Based on senior first-team roster
              </span>
              <ValuationFreshness
                timestamp={club.lastSyncedAt || seniorSquad[0]?.updatedAt || seniorSquad[0]?.marketValues?.[0]?.date}
                className="mt-1"
              />
            </div>
            <FollowButton
              variant="button"
              id={club.id}
              type="club"
              name={club.name || getClubDisplayName(club)}
              slug={canonicalSlug}
              clubCrest={club.logoUrl}
              avatarUrl={club.logoUrl}
              marketValue={club.totalSquadValue}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </Card>

      {/* Honours StatStrip (rendered only if club has titles > 0) */}
      <ClubHonoursStatStrip honours={clubHonours} clubName={getClubDisplayName(club)} />

      {/* Multi-Tab Interactive Interface (Squad, Transfers, Value, Overview, Form) */}
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

      {/* Related News Card */}
      {relatedNews && relatedNews.length > 0 && (
        <RelatedNewsCard items={relatedNews} title={`${getClubDisplayName(club)} news`} />
      )}
    </div>
  );
}
