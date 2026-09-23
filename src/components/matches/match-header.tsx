"use client";

import { AnimatedScore } from "@/components/matches/animated-score";
import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { TeamLogo } from "@/components/shared/team-logo";
import { useFixture } from "@/lib/hooks/use-live-fixtures";
import { isLiveStatus } from "@/lib/match-status";
import { cn } from "@/lib/utils";
import type { Fixture } from "@/lib/schemas";

/**
 * Sticky match header: crests, animated score, live minute. Polls our
 * route handler only while the match is in play.
 */
export function MatchHeader({ initialFixture }: { initialFixture: Fixture }) {
  const { data } = useFixture(initialFixture.id, initialFixture);
  const fixture = data ?? initialFixture;
  const live = isLiveStatus(fixture.statusShort);

  const kickoff = new Date(fixture.date);
  const kickoffLabel = Number.isNaN(kickoff.getTime())
    ? null
    : kickoff.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      });

  return (
    <header
      className={cn(
        "bg-card sticky top-14 z-30 rounded-xl border px-4 py-4 shadow-xs",
        live && "border-live/30",
      )}
    >
      <p className="text-muted-foreground mb-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-xs">
        <span className="font-medium text-foreground">{fixture.leagueName}</span>
        {fixture.round ? <span>· {fixture.round}</span> : null}
        {kickoffLabel ? <span>· {kickoffLabel}</span> : null}
      </p>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:justify-end sm:text-right">
          <span className={cn("order-2 text-sm font-semibold sm:order-1 sm:text-base", fixture.winnerHome === true && "text-foreground")}>
            {fixture.homeTeamName}
          </span>
          <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={36} className="order-1 sm:order-2" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <AnimatedScore value={fixture.goalsHome} className={cn("size-9 text-xl sm:size-10 sm:text-2xl", live && "text-live")} />
            <span className="text-muted-foreground text-lg font-normal sm:text-xl">–</span>
            <AnimatedScore value={fixture.goalsAway} className={cn("size-9 text-xl sm:size-10 sm:text-2xl", live && "text-live")} />
          </div>
          <MatchStatusBadge
            statusShort={fixture.statusShort}
            elapsed={fixture.elapsed}
            date={fixture.date}
          />
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:justify-start">
          <TeamLogo src={fixture.awayTeamLogoUrl} alt={fixture.awayTeamName} size={36} />
          <span className="text-sm font-semibold sm:text-base">{fixture.awayTeamName}</span>
        </div>
      </div>

      <p className="text-muted-foreground mt-3 text-center text-xs">
        {[fixture.venueName, fixture.venueCity].filter(Boolean).join(", ") || null}
        {fixture.referee ? <span> · Referee: {fixture.referee}</span> : null}
      </p>
    </header>
  );
}
