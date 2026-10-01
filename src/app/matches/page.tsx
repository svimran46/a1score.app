import { getMatchesByDate, TOP_LEAGUE_IDS } from "@/lib/fotmob/client";
import { MatchesClient } from "@/components/MatchesClient";
import type { Metadata } from "next";

export const revalidate = 5; // Ultra-fresh live scores every 5s
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Live Matches — Real-Time Scores, Lineups & Squad Values",
  description:
    "Live football scores, real-time match events, confirmed tactical lineups, and squad market values on a1score.app.",
};

interface MatchesPageProps {
  searchParams: {
    date?: string;
    filter?: "all" | "live" | "finished" | "upcoming";
    scope?: "top" | "all";
  };
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const activeDate =
    searchParams.date ||
    new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

  const activeFilter = searchParams.filter || "all";
  let activeScope: "top" | "all" = searchParams.scope === "all" ? "all" : "top";

  const data = await getMatchesByDate(activeDate);

  // Compute all matches across every competition for global status counts
  const allLeaguesMatches = data.leagues.flatMap((l) =>
    l.matches.map((match) => ({ ...match, _leagueId: l.id }))
  );
  const totalAllMatchesCount = allLeaguesMatches.length;

  // Filter leagues by scope (top 10 European competitions vs all)
  const topLeaguesMatches = data.leagues
    .filter((l) => TOP_LEAGUE_IDS.includes(l.id))
    .flatMap((l) => l.matches);
  const topMatchesCount = topLeaguesMatches.length;

  // Auto-switch to All Leagues if Top Leagues has 0 matches for the active date
  let autoSwitched = false;
  if (activeScope === "top" && topMatchesCount === 0 && totalAllMatchesCount > 0) {
    activeScope = "all";
    autoSwitched = true;
  }

  const scopedLeagues =
    activeScope === "all"
      ? data.leagues
      : data.leagues.filter((l) => TOP_LEAGUE_IDS.includes(l.id));

  // Global counts across the active scope
  const activeScopeMatches = scopedLeagues.flatMap((l) => l.matches);
  const totalScopedMatches = activeScopeMatches.length;
  const liveScopedMatchesCount = activeScopeMatches.filter((m) => m.isLive).length;
  const finishedScopedMatchesCount = activeScopeMatches.filter((m) => m.isFinished).length;
  const upcomingScopedMatchesCount = activeScopeMatches.filter((m) => m.isUpcoming).length;

  // Filter matches by status tab
  let leagues = scopedLeagues;
  if (activeFilter === "live") {
    leagues = leagues
      .map((l) => ({ ...l, matches: l.matches.filter((m) => m.isLive) }))
      .filter((l) => l.matches.length > 0);
  } else if (activeFilter === "finished") {
    leagues = leagues
      .map((l) => ({ ...l, matches: l.matches.filter((m) => m.isFinished) }))
      .filter((l) => l.matches.length > 0);
  } else if (activeFilter === "upcoming") {
    leagues = leagues
      .map((l) => ({ ...l, matches: l.matches.filter((m) => m.isUpcoming) }))
      .filter((l) => l.matches.length > 0);
  }

  return (
    <MatchesClient
      activeDate={activeDate}
      activeFilter={activeFilter}
      activeScope={activeScope}
      autoSwitched={autoSwitched}
      leagues={leagues}
      totalScopedMatches={totalScopedMatches}
      liveScopedMatchesCount={liveScopedMatchesCount}
      finishedScopedMatchesCount={finishedScopedMatchesCount}
      upcomingScopedMatchesCount={upcomingScopedMatchesCount}
      totalAllMatchesCount={totalAllMatchesCount}
    />
  );
}
