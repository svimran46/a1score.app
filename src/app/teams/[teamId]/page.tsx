import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import Link from "next/link";

import { TeamTabs, parseTeamTab } from "@/components/teams/team-tabs";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { MatchRow } from "@/components/matches/match-row";
import { TeamLogo } from "@/components/shared/team-logo";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { getTeamCoach, getTeamProfile, getTeamSquad } from "@/lib/api-football/teams";
import { getTeamFixtures, getTeamRecentResults } from "@/lib/api-football/fixtures";
import { isFinishedStatus } from "@/lib/match-status";
import type { SquadPlayer, TeamProfile } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface TeamPageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { teamId } = await params;
  const id = Number.parseInt(teamId, 10);
  if (!Number.isInteger(id)) return { title: "Team" };
  const result = await getTeamProfile(id);
  if (!result.ok || !result.data) return { title: "Team" };
  return {
    title: result.data.name,
    description: `Fixtures, squad and stats for ${result.data.name}.`,
  };
}

/**
 * Team detail (Section 8.5): Overview, Fixtures, Squad, Stats — all
 * server-rendered from the Data Cache.
 */
export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const [{ teamId }, { tab }] = await Promise.all([params, searchParams]);
  const id = Number.parseInt(teamId, 10);
  if (!Number.isInteger(id)) notFound();

  const teamResult = await getTeamProfile(id);
  if (!teamResult.ok) {
    return <ErrorState title="Couldn't load team" message="The data source didn't respond." />;
  }
  const team = teamResult.data;
  if (!team) notFound();

  const activeTab = parseTeamTab(tab);

  return (
    <div className="flex flex-col gap-4">
      <header className="bg-card flex items-center gap-3 rounded-xl border p-4">
        <TeamLogo src={team.logoUrl} alt={team.name} size={44} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{team.name}</h1>          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
            {team.country ? <span>{team.country}</span> : null}
            {team.venueName ? (
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden className="size-3" /> {team.venueName}
              </span>
            ) : null}
            {team.founded ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays aria-hidden className="size-3" /> Est. {team.founded}
              </span>
            ) : null}
          </p>
        </div>
        <FavoriteButton kind="team" id={team.id} name={team.name} logoUrl={team.logoUrl} />
      </header>

      <TeamTabs teamId={team.id} active={activeTab} />

      {activeTab === "overview" ? <OverviewPanel team={team} /> : null}
      {activeTab === "fixtures" ? <FixturesPanel teamId={team.id} /> : null}
      {activeTab === "squad" ? <SquadPanel teamId={team.id} /> : null}
      {activeTab === "stats" ? <StatsPanel teamId={team.id} teamName={team.name} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function resultPip(fixture: { homeTeamId: number; awayTeamId: number; goalsHome: number | null; goalsAway: number | null }, teamId: number): "W" | "D" | "L" {
  const home = fixture.goalsHome ?? 0;
  const away = fixture.goalsAway ?? 0;
  const isHome = fixture.homeTeamId === teamId;
  const scored = isHome ? home : away;
  const conceded = isHome ? away : home;
  if (scored > conceded) return "W";
  if (scored === conceded) return "D";
  return "L";
}

async function OverviewPanel({ team }: { team: TeamProfile }) {
  const season = new Date().getUTCFullYear();
  const recent = await getTeamRecentResults(team.id, season - 1, 5);

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="form-heading" className="flex flex-col gap-2">
        <h2 id="form-heading" className="text-sm font-semibold">
          Recent results
        </h2>
        {!recent.ok || recent.data.length === 0 ? (
          <EmptyState title="No recent results" message="Played matches will appear here." />
        ) : (
          <>
            <div className="flex items-center gap-1" aria-hidden>
              {recent.data.map((f) => {
                const pip = resultPip(f, team.id);
                return (
                  <span
                    key={f.id}
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-2xs font-bold text-white",
                      pip === "W" && "bg-emerald-600",
                      pip === "D" && "bg-muted-foreground/70",
                      pip === "L" && "bg-destructive",
                    )}
                  >
                    {pip}
                  </span>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              {recent.data.map((f) => (
                <MatchRow key={f.id} fixture={f} />
              ))}
            </div>
          </>
        )}
      </section>

      <CoachNote teamId={team.id} />
    </div>
  );
}

async function CoachNote({ teamId }: { teamId: number }) {
  const coach = await getTeamCoach(teamId);
  if (!coach.ok || !coach.data) return null;
  return (
    <p className="text-muted-foreground text-sm">
      Coach: <span className="text-foreground font-medium">{coach.data.name}</span>
      {coach.data.nationality ? ` · ${coach.data.nationality}` : ""}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

async function FixturesPanel({ teamId }: { teamId: number }) {
  const season = new Date().getUTCFullYear() - 1;
  const [last, next] = await Promise.all([
    getTeamFixtures(teamId, season, "last", 15),
    getTeamFixtures(teamId, season, "next", 15),
  ]);

  if (!last.ok || !next.ok) {
    return <ErrorState title="Couldn't load fixtures" message="The data source didn't respond." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="t-last" className="flex flex-col gap-2">
        <h2 id="t-last" className="text-sm font-semibold">
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

      <section aria-labelledby="t-next" className="flex flex-col gap-2">
        <h2 id="t-next" className="text-sm font-semibold">
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

/* ------------------------------------------------------------------ */
/* Squad                                                               */
/* ------------------------------------------------------------------ */

const POSITION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

function SquadList({ players }: { players: SquadPlayer[] }) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <ul className="divide-y divide-border/50">
        {players.map((p) => (
          <li key={p.playerId}>
            <Link
              href={`/players/${p.playerId}`}
              className="hover:bg-accent/40 flex items-center gap-3 px-3 py-2.5 transition-colors outline-none focus-visible:bg-accent/40"
            >
              <span className="tabnum text-muted-foreground w-7 text-center text-xs font-semibold">
                {p.number ?? "–"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.name}</span>
                {p.age !== null ? (
                  <span className="text-muted-foreground block text-xs">{p.age} years</span>
                ) : null}
              </span>
              {p.position ? (
                <span className="text-muted-foreground text-2xs font-medium tracking-wide uppercase">
                  {p.position}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function SquadPanel({ teamId }: { teamId: number }) {
  const squad = await getTeamSquad(teamId);
  if (!squad.ok) {
    return <ErrorState title="Couldn't load squad" message="The data source didn't respond." />;
  }
  if (squad.data.length === 0) {
    return (
      <EmptyState
        icon={<Users aria-hidden className="size-8" />}
        title="No squad data"
        message="The roster for this team isn't available right now."
      />
    );
  }

  const sorted = [...squad.data].sort((a, b) => {
    const pa = POSITION_ORDER.indexOf(a.position ?? "") ;
    const pb = POSITION_ORDER.indexOf(b.position ?? "");
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
  });

  return <SquadList players={sorted} />;
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-xl border p-3 text-center">
      <p className="tabnum text-xl font-bold">{value}</p>
      <p className="text-muted-foreground text-2xs">{label}</p>
    </div>
  );
}

async function StatsPanel({ teamId, teamName }: { teamId: number; teamName: string }) {
  const season = new Date().getUTCFullYear() - 1;
  // Team statistics need a league context; without a known league we show
  // season form derived from recent results instead (honest, no fake data).
  const recent = await getTeamRecentResults(teamId, season, 10);

  if (!recent.ok) {
    return <ErrorState title="Couldn't load stats" message="The data source didn't respond." />;
  }

  const played = recent.data.filter((f) => isFinishedStatus(f.statusShort));
  const wins = played.filter((f) => resultPip(f, teamId) === "W").length;
  const draws = played.filter((f) => resultPip(f, teamId) === "D").length;
  const losses = played.filter((f) => resultPip(f, teamId) === "L").length;
  const scored = played.reduce((sum, f) => sum + (f.homeTeamId === teamId ? (f.goalsHome ?? 0) : (f.goalsAway ?? 0)), 0);
  const conceded = played.reduce((sum, f) => sum + (f.homeTeamId === teamId ? (f.goalsAway ?? 0) : (f.goalsHome ?? 0)), 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">
        Last {played.length} finished matches for {teamName} · {season} season
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <StatTile label="Wins" value={wins} />
        <StatTile label="Draws" value={draws} />
        <StatTile label="Losses" value={losses} />
        <StatTile label="Scored" value={scored} />
        <StatTile label="Conceded" value={conceded} />
        <StatTile label="Played" value={played.length} />
        </div>
    </div>
  );
}
