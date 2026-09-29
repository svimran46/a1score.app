import { notFound } from "next/navigation";
import { getMatchDetails } from "@/lib/fotmob/client";
import { constructMetadata, SITE_URL } from "@/lib/metadata";
import { MatchCenterClient } from "@/components/MatchCenterClient";
import type { Metadata } from "next";

export const revalidate = 5; // Ultra-fresh match details every 5s
export const runtime = "edge";

interface MatchPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const match = await getMatchDetails(params.id);
  if (!match) {
    return constructMetadata({
      title: "Match Not Found",
      description: "The requested football match center could not be located.",
      path: `/matches/${params.id}`,
    });
  }

  const home = match.teams?.home?.name || "Home Team";
  const away = match.teams?.away?.name || "Away Team";
  const scoreStr = match.status?.started
    ? `${match.teams?.home?.score ?? 0} - ${match.teams?.away?.score ?? 0}`
    : "vs";
  const statusStr = match.status?.finished
    ? "Full Time"
    : match.status?.isLive
    ? "LIVE"
    : "Upcoming";

  return constructMetadata({
    title: `${home} ${scoreStr} ${away} — Live Match Center (${statusStr})`,
    description: `Live match intelligence for ${home} ${scoreStr} ${away}. Live scorecard, scorers, confirmed lineups, tactical formations, live match timeline, stats, and squad market valuations on a1score.app.`,
    path: `/matches/${params.id}`,
  });
}

export default async function MatchDetailsPage({ params }: MatchPageProps) {
  const match = await getMatchDetails(params.id);

  if (!match) {
    notFound();
  }

  const { general = {}, teams = {}, status = {} } = match;
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${homeTeam?.name || "Home"} vs ${awayTeam?.name || "Away"}`,
    sport: "Football",
    url: `${SITE_URL}/matches/${params.id}`,
    startDate: general?.matchTimeUTCDate || undefined,
    eventStatus: status?.finished
      ? "https://schema.org/EventFinished"
      : status?.isLive
      ? "https://schema.org/EventLive"
      : "https://schema.org/EventScheduled",
    homeTeam: {
      "@type": "SportsTeam",
      name: homeTeam?.name || "Home",
      logo: homeTeam?.imageUrl || undefined,
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: awayTeam?.name || "Away",
      logo: awayTeam?.imageUrl || undefined,
    },
  };

  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MatchCenterClient initialMatch={match} />
    </div>
  );
}
