import React from "react";
import type { Metadata } from "next";
import { parseCompareSlugs } from "@/lib/compare";
import { getPlayerBySlugOrId } from "@/lib/data/players";
import { getPlayerAchievements } from "@/lib/data/playerAchievements";
import { getPlayerSlug } from "@/lib/slugs";
import { CompareClient } from "@/components/compare/CompareClient";
import type { ComparePlayerFact } from "@/components/compare/CompareFactsTable";
import { constructMetadata, SITE_URL } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const runtime = "edge";

interface ComparePageProps {
  searchParams: {
    players?: string | string[];
  };
}

export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const slugs = parseCompareSlugs(searchParams?.players);

  let title = "Player Valuation Comparison | a1score";
  let description = "Compare player market valuations, career trajectories, peak values, and facts side-by-side on a1score.";

  if (slugs.length > 0) {
    const formattedNames = slugs
      .map((s) => s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "))
      .join(" vs ");
    title = `${formattedNames} - Market Valuation Comparison | a1score`;
    description = `Compare ${formattedNames}: market value trajectory, peak valuations, age, club, and performance records side-by-side.`;
  }

  const baseMeta = constructMetadata({
    title,
    description: description.length > 155 ? description.slice(0, 152) + "..." : description,
    path: "/compare",
  });

  return {
    ...baseMeta,
    // Task 6: Canonical for compare pages (noindex for arbitrary combinations)
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: `${SITE_URL}/compare`,
    },
  };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const rawSlugs = parseCompareSlugs(searchParams?.players);

  const playerResults = await Promise.allSettled(
    rawSlugs.map((slug) => getPlayerBySlugOrId(slug))
  );

  const initialPlayers: ComparePlayerFact[] = [];

  for (let i = 0; i < playerResults.length; i++) {
    const res = playerResults[i];
    if (res.status === "fulfilled" && res.value) {
      const p = res.value;
      const canonicalSlug = getPlayerSlug(p);

      const mvs = Array.isArray(p.marketValues) ? p.marketValues : [];
      const latestVal = p.latestMarketValue || (mvs.length > 0 ? mvs[mvs.length - 1].valueEur : 0);

      // Load achievements safely with graceful fallback
      const ach = await getPlayerAchievements(p.id).catch(() => null);
      const totalTitles = ach?.totalTitles || 0;
      const topHonour = ach?.majorHonours?.[0]?.competitionName || ach?.all?.[0]?.competitionName;

      initialPlayers.push({
        id: p.id,
        slug: rawSlugs[i] || canonicalSlug,
        fullName: p.fullName,
        commonName: p.commonName,
        photoUrl: p.photoUrl,
        dateOfBirth: p.dateOfBirth,
        nationality: p.nationality,
        position: p.position || "Forward",
        currentClub: p.currentClub
          ? {
              id: p.currentClub.id,
              name: p.currentClub.name,
              logoUrl: p.currentClub.logoUrl,
              shortName: p.currentClub.shortName,
            }
          : null,
        latestMarketValue: Number(latestVal) || 0,
        marketValues: mvs,
        achievements: totalTitles > 0 ? {
          totalTitles,
          majorCount: ach?.majorHonours?.reduce((a, b) => a + b.titleCount, 0) || 0,
          topHonour,
        } : null,
      });
    }
  }

  return (
    <main className="min-h-screen pt-4 sm:pt-6 px-4">
      <CompareClient initialPlayers={initialPlayers} initialSlugs={rawSlugs} />
    </main>
  );
}
