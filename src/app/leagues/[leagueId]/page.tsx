import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LeagueTabs, parseLeagueTab } from "@/components/leagues/league-tabs";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { StandingsTable } from "@/components/leagues/standings-table";
import { TopPlayersTable } from "@/components/leagues/top-players-table";
import { MatchRow } from "@/components/matches/match-row";
import { TeamLogo } from "@/components/shared/team-logo";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { getLeagueById, getStandings } from "@/lib/api-football/leagues";
import { getLeagueFixtures } from "@/lib/api-football/fixtures";
import { getTopScorers, getTopAssists } from "@/lib/api-football/players";

interface LeaguePageProps {
  params: Promise<{ leagueId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: LeaguePageProps): Promise<Metadata> {
  const { leagueId } = await params;
  const id = Number.parseInt(leagueId, 10);
  if (!Number.isInteger(id)) return { title: "League" };
  const result = await getLeagueById(id);
  if (!result.ok || !result.data) return { title: "League" };
  return {
    title: result.data.name,
    description: `Fixtures, table and stats for ${result.data.name}.`,
  };
}

/**
 * League detail (Section 8.3): Fixtures | Table | Top scorers | Top assists,
 * each tab server-rendered from the Data Cache.
 */
export default async function LeaguePage({ params, searchParams }: LeaguePageProps) {
  const [{ leagueId }, { tab }] = await Promise.all([params, searchParams]);
  const id = Number.parseInt(leagueId, 10);
  if (!Number.isInteger(id)) notFound();

  const leagueResult = await getLeagueById(id);
  if (!leagueResult.ok) {
    return <ErrorState title="Couldn't load league" message="The data source didn't respond." />;
  }
  const league = leagueResult.data;
  if (!league) notFound();

  const season = league.season ?? new Date().getUTCFullYear();
  const activeTab = parseLeagueTab(tab);

  return (
    <div className="flex flex-col gap-4">
      <header className="bg-card flex items-center gap-3 rounded-xl border p-4">
        <TeamLogo src={league.logoUrl} alt={league.name} size={40} />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{league.name}</h1>
          <p className="text-muted-foreground text-sm">
            {league.countryName ?? "International"} · {season} season
            {league.type === "Cup" ? " · Cup" : ""}
          </p>
        </div>
        <FavoriteButton kind="league" id={league.id} name={league.name} logoUrl={league.logoUrl} />
      </header>

      <LeagueTabs leagueId={league.id} active={activeTab} />

      {activeTab === "fixtures" ? <FixturesPanel leagueId={league.id} season={season} /> : null}
      {activeTab === "table" ? <TablePanel leagueId={league.id} season={season} /> : null}
      {activeTab === "topscorers" ? <TopScorersPanel leagueId={league.id} season={season} /> : null}
      {activeTab === "topassists" ? <TopAssistsPanel leagueId={league.id} season={season} /> : null}
    </div>
  );
}

async function FixturesPanel({ leagueId, season }: { leagueId: number; season: number }) {
  const [next, last] = await Promise.all([
    getLeagueFixtures(leagueId, season, "next", 10),
    getLeagueFixtures(leagueId, season, "last", 10),
  ]);

  if (!next.ok || !last.ok) {
    return <ErrorState title="Couldn't load fixtures" message="The data source didn't respond." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="last-heading" className="flex flex-col gap-2">
        <h2 id="last-heading" className="text-sm font-semibold">
          Latest results
        </h2>
        {last.data.length === 0 ? (
          <EmptyState title="No results yet" message="Played matches will appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {last.data.map((f) => (
              <MatchRow key={f.id} fixture={f} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="next-heading" className="flex flex-col gap-2">
        <h2 id="next-heading" className="text-sm font-semibold">
          Upcoming
        </h2>
        {next.data.length === 0 ? (
          <EmptyState title="No fixtures scheduled" message="Upcoming matches will appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {next.data.map((f) => (
              <MatchRow key={f.id} fixture={f} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

async function TablePanel({ leagueId, season }: { leagueId: number; season: number }) {
  const standings = await getStandings(leagueId, season);
  if (!standings.ok) {
    return (
      <EmptyState
        title="No table available"
        message="This competition may not have a league table (cups usually don't)."
      />
    );
  }
  return <StandingsTable standing={standings.data} />;
}

async function TopScorersPanel({ leagueId, season }: { leagueId: number; season: number }) {
  const scorers = await getTopScorers(leagueId, season);
  if (!scorers.ok) {
    return <ErrorState title="Couldn't load top scorers" message="The data source didn't respond." />;
  }
  return (
    <TopPlayersTable
      entries={scorers.data}
      metricLabel="goals"
      emptyTitle="No scorers yet"
    />
  );
}

async function TopAssistsPanel({ leagueId, season }: { leagueId: number; season: number }) {
  const assists = await getTopAssists(leagueId, season);
  if (!assists.ok) {
    return <ErrorState title="Couldn't load top assists" message="The data source didn't respond." />;
  }
  return (
    <TopPlayersTable
      entries={assists.data}
      metricLabel="assists"
      emptyTitle="No assists recorded yet"
    />
  );
}
