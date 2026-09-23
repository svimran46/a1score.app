import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlaskConical } from "lucide-react";

import { MatchHeader } from "@/components/matches/match-header";
import { MatchRow } from "@/components/matches/match-row";
import { EventsTimeline } from "@/components/matches/events-timeline";
import { LineupsView } from "@/components/matches/lineups-view";
import { StatsView } from "@/components/matches/stats-view";
import { parseMatchTab, MatchTabs } from "@/components/matches/match-tabs";
import { EmptyState } from "@/components/shared/states";
import { getFixtureById, getHeadToHead } from "@/lib/api-football/fixtures";
import { getMatchEvents, getMatchLineups, getMatchStatistics } from "@/lib/api-football/match-detail";

interface MatchPageProps {
  params: Promise<{ fixtureId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { fixtureId } = await params;
  const id = Number.parseInt(fixtureId, 10);
  if (!Number.isInteger(id)) return { title: "Match" };
  const result = await getFixtureById(id);
  if (!result.ok || !result.data) return { title: "Match" };
  const f = result.data;
  return {
    title: `${f.homeTeamName} vs ${f.awayTeamName}`,
    description: `${f.leagueName} — ${f.homeTeamName} vs ${f.awayTeamName} on ${f.date}`,
  };
}

/**
 * Match detail (Section 8.4): sticky live-polling header plus URL-driven
 * server-rendered tabs — Overview (timeline), Lineups, Stats, H2H.
 */
export default async function MatchPage({ params, searchParams }: MatchPageProps) {
  const [{ fixtureId }, { tab }] = await Promise.all([params, searchParams]);
  const id = Number.parseInt(fixtureId, 10);
  if (!Number.isInteger(id)) notFound();

  const fixtureResult = await getFixtureById(id);
  if (!fixtureResult.ok || !fixtureResult.data) notFound();
  const fixture = fixtureResult.data;

  const activeTab = parseMatchTab(tab);

  return (
    <div className="flex flex-col gap-4">
      <MatchHeader initialFixture={fixture} />

      <div role="tablist" aria-label="Match sections" className="flex flex-col gap-4">
        <MatchTabs fixtureId={fixture.id} active={activeTab} />
        <section role="tabpanel" aria-label={activeTab}>
          {activeTab === "overview" ? <OverviewPanel fixtureId={fixture.id} homeTeamId={fixture.homeTeamId} /> : null}
          {activeTab === "lineups" ? (
            <LineupsPanel
              fixtureId={fixture.id}
              homeName={fixture.homeTeamName}
              awayName={fixture.awayTeamName}
            />
          ) : null}
          {activeTab === "stats" ? <StatsPanel fixtureId={fixture.id} /> : null}
          {activeTab === "h2h" ? (
            <H2HPanel
              homeTeamId={fixture.homeTeamId}
              awayTeamId={fixture.awayTeamId}
              homeName={fixture.homeTeamName}
              awayName={fixture.awayTeamName}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

async function OverviewPanel({ fixtureId, homeTeamId }: { fixtureId: number; homeTeamId: number }) {
  const events = await getMatchEvents(fixtureId);
  if (!events.ok) {
    return <EmptyState title="Timeline unavailable" message="Could not load match events." />;
  }
  if (events.data.length === 0) {
    return (
      <EmptyState
        icon={<span aria-hidden className="text-2xl">⚽</span>}
        title="No events yet"
        message="The timeline fills in from kickoff — goals, cards and subs."
      />
    );
  }
  return <EventsTimeline events={events.data} homeTeamId={homeTeamId} />;
}

async function LineupsPanel({
  fixtureId,
  homeName,
  awayName,
}: {
  fixtureId: number;
  homeName: string;
  awayName: string;
}) {
  const lineups = await getMatchLineups(fixtureId);
  if (!lineups.ok) {
    return <EmptyState title="Lineups unavailable" message="Could not load lineups." />;
  }
  return <LineupsView lineups={lineups.data} homeName={homeName} awayName={awayName} />;
}

async function StatsPanel({ fixtureId }: { fixtureId: number }) {
  const stats = await getMatchStatistics(fixtureId);
  if (!stats.ok) {
    return <EmptyState title="Stats unavailable" message="Could not load match statistics." />;
  }
  return <StatsView stats={stats.data} />;
}

async function H2HPanel({
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
}: {
  homeTeamId: number;
  awayTeamId: number;
  homeName: string;
  awayName: string;
}) {
  const h2h = await getHeadToHead(homeTeamId, awayTeamId, 10);
  if (!h2h.ok) {
    return <EmptyState title="H2H unavailable" message="Could not load head-to-head history." />;
  }
  if (h2h.data.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical aria-hidden className="size-8" />}
        title="No previous meetings"
        message={`${homeName} and ${awayName} have no recorded head-to-head history.`}
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {h2h.data.map((f) => (
        <MatchRow key={f.id} fixture={f} />
      ))}
    </div>
  );
}
