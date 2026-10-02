import { notFound } from "next/navigation";
import { EntityImage } from "@/components/EntityImage";
import Link from "next/link";
import { getPlayerBySlugOrId } from "@/lib/data/players";
import { calculateAge, formatCompactEur, formatDate, formatUpdateAge } from "@/lib/utils";
import { getClubShortName } from "@/lib/data/clubs";
import { getClubSlug, getLeagueSlug } from "@/lib/slugs";
import { constructMetadata, SITE_URL } from "@/lib/metadata";
import { Card, ValuationFreshness, Breadcrumbs, PageHeader } from "@/components/ui";
import { PlayerTabsContainer } from "@/components/PlayerTabsContainer";
import { FollowButton } from "@/components/watchlist/FollowButton";
import { getRelatedNews } from "@/lib/data/news";
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
      title: "Player Not Found | a1score",
      description: "The requested football player profile could not be located.",
      path: `/players/${params.slug}`,
    });
  }

  const formattedVal = player.latestMarketValue
    ? formatCompactEur(player.latestMarketValue)
    : "";
  const clubName = player.currentClub?.name || "Free Agent";
  const displayName = player.fullName || "Player Profile";
  const displayPos = player.position || "Footballer";

  const rawTitle = `${displayName} market value, club and transfer history | a1score`;
  const desc = formattedVal
    ? `${displayName} (${displayPos}, ${clubName}) is valued at ${formattedVal}. See value history, transfers and club details.`
    : `${displayName} (${displayPos}, ${clubName}). See value history, transfers and club details.`;

  return constructMetadata({
    title: rawTitle,
    description: desc.length > 155 ? desc.slice(0, 152) + "..." : desc,
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
  const prevValuation = mvs.length > 1 ? mvs[mvs.length - 2] : undefined;

  const rawClub = player.currentClub;
  const currentClub = Array.isArray(rawClub) ? rawClub[0] || null : rawClub || null;
  const clubShort = currentClub ? getClubShortName(currentClub.shortName || currentClub.name || "") : null;

  const tagsToMatch = [player.fullName, player.commonName, currentClub?.name].filter(Boolean) as string[];
  const relatedNews = await getRelatedNews(tagsToMatch, 3).catch(() => []);

  const validDob =
    player.dateOfBirth && !isNaN(new Date(player.dateOfBirth).getTime())
      ? new Date(player.dateOfBirth)
      : null;

  // Change computation with trend arrow + %
  const currentVal = player.latestMarketValue || latestValuation?.valueEur || 0;
  let changeElement: React.ReactNode = null;
  if (prevValuation && prevValuation.valueEur > 0 && currentVal > 0) {
    const diff = currentVal - prevValuation.valueEur;
    if (diff !== 0) {
      const isPos = diff > 0;
      const trendSymbol = isPos ? "▲" : "▼";
      const sign = isPos ? "+" : "−";
      const absDiff = Math.abs(diff);
      const pct = Math.abs((diff / prevValuation.valueEur) * 100).toFixed(1);
      const trendColorClass = isPos ? "text-[var(--trend-positive)]" : "text-[var(--trend-negative)]";

      changeElement = (
        <div className={`flex items-center gap-1 text-xs font-bold tabular-nums ${trendColorClass}`}>
          <span>{trendSymbol}</span>
          <span>{`${sign}${pct}%`}</span>
          <span className="text-[var(--text-muted)] font-normal ml-0.5">
            ({sign}{formatCompactEur(absDiff)})
          </span>
        </div>
      );
    }
  }

  // Update age
  const updateAgeText = formatUpdateAge(latestValuation?.date || player.updatedAt);

  // Nationality
  const nationalityText =
    Array.isArray(player.nationality) && player.nationality.length > 0
      ? player.nationality.join(", ")
      : typeof player.nationality === "string" && player.nationality
      ? player.nationality
      : null;

  // KeyFacts items
  const keyFactsItems = [
    {
      label: "Age",
      value: age ? `${age} (${validDob ? formatDate(validDob) : ""})`.trim() : null,
    },
    {
      label: "Nationality",
      value: nationalityText,
    },
    {
      label: "Height",
      value: player.heightCm ? `${player.heightCm} cm` : null,
    },
    {
      label: "Foot",
      value: player.preferredFoot || null,
    },
    {
      label: "Contract",
      value: player.contractUntil ? formatDate(player.contractUntil) : null,
    },
  ];

  const baseUrl = SITE_URL;
  const canonicalUrl = `${baseUrl}/players/${params.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.fullName,
    ...(player.photoUrl ? { image: player.photoUrl } : {}),
    ...(nationalityText ? { nationality: nationalityText } : {}),
    ...(validDob ? { birthDate: validDob.toISOString().split("T")[0] } : {}),
    ...(currentClub
      ? {
          affiliation: {
            "@type": "SportsTeam",
            name: currentClub.name,
            url: `${baseUrl}/clubs/${getClubSlug(currentClub)}`,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Market Values", item: `${baseUrl}/values` },
      { "@type": "ListItem", position: 3, name: player.fullName, item: canonicalUrl },
    ],
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Market Values", href: "/values" },
    { label: player.fullName },
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

      {/* 1. Header Card */}
      <PageHeader
        variant="player"
        imageUrl={player.photoUrl}
        imageAlt={player.fullName || "Player"}
        entityType="player"
        imageShape="circle"
        categoryLabel={player.position || "Footballer"}
        title={player.fullName}
        value={currentVal > 0 ? formatCompactEur(currentVal) : null}
        valueLabel="Current Market Value"
        valueTrend={changeElement}
        freshnessTimestamp={latestValuation?.date || player.updatedAt}
        metaItems={[
          nationalityText ? <span key="nat">{nationalityText}</span> : null,
          currentClub ? (
            <Link
              key="club"
              href={`/clubs/${getClubSlug(currentClub)}`}
              className="flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors truncate"
            >
              {currentClub.logoUrl && (
                <span className="relative w-4 h-4 shrink-0 inline-block overflow-hidden">
                  <EntityImage
                    src={currentClub.logoUrl}
                    alt=""
                    fill
                    sizes="16px"
                    entityType="club"
                    className="object-contain"
                  />
                </span>
              )}
              <span className="font-semibold">{clubShort}</span>
            </Link>
          ) : null,
          currentClub?.league ? (
            <Link
              key="league"
              href={`/leagues/${getLeagueSlug(currentClub.league)}`}
              className="hover:text-[var(--accent)] transition-colors truncate"
            >
              {currentClub.league.name}
            </Link>
          ) : null,
          age ? <span key="age">{age} yrs</span> : null,
        ].filter(Boolean)}
        actions={
          <FollowButton
            variant="button"
            id={player.id}
            type="player"
            name={player.fullName}
            slug={params.slug}
            avatarUrl={player.photoUrl}
            clubName={clubShort}
            clubCrest={currentClub?.logoUrl}
            position={player.position}
            marketValue={currentVal}
          />
        }
        shareTitle={`${player.fullName} market valuation & stats | a1score`}
        shareUrl={canonicalUrl}
      />

      {/* 2. Tabs: Overview, Transfers, Value history */}
      <PlayerTabsContainer
        keyFactsItems={keyFactsItems}
        mvs={mvs}
        playerName={player.fullName}
        dateOfBirth={validDob}
        seasonStats={player.seasonStats}
        transfers={player.transfers}
        injuries={player.injuries}
        relatedNews={relatedNews}
      />
    </div>
  );
}
