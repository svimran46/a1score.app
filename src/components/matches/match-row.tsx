"use client";

import Link from "next/link";
import { motion } from "motion/react";

import type { Fixture } from "@/lib/schemas";

import { AnimatedScore } from "@/components/matches/animated-score";
import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { TeamLogo } from "@/components/shared/team-logo";
import { isFinishedStatus, isLiveStatus } from "@/lib/match-status";
import { cn } from "@/lib/utils";

/**
 * One fixture row: crests, animated score, status chip. Live and winning
 * scores get emphasis; the whole row links to the match page.
 */
export function MatchRow({ fixture }: { fixture: Fixture }) {
  const live = isLiveStatus(fixture.statusShort);
  const finished = isFinishedStatus(fixture.statusShort);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        href={`/matches/${fixture.id}`}
        className={cn(
          "hover:bg-accent/50 focus-visible:bg-accent/50 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors outline-none",
          live && "bg-live/[0.04]",
        )}
      >
        <span className="w-9 shrink-0 sm:w-12">
          <MatchStatusBadge
            statusShort={fixture.statusShort}
            elapsed={fixture.elapsed}
            date={fixture.date}
          />
        </span>

        <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span
            className={cn(
              "truncate text-sm",
              fixture.winnerHome === true ? "font-semibold" : "text-foreground/90",
            )}
          >
            {fixture.homeTeamName}
          </span>
          <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={22} />
        </span>

        <span className="flex shrink-0 items-center gap-0.5">
          <AnimatedScore
            value={fixture.goalsHome}
            className={cn(live && "text-live")}
          />
          <AnimatedScore
            value={fixture.goalsAway}
            className={cn(live && "text-live")}
          />
        </span>

        <span className="flex min-w-0 flex-1 items-center gap-2">
          <TeamLogo src={fixture.awayTeamLogoUrl} alt={fixture.awayTeamName} size={22} />
          <span
            className={cn(
              "truncate text-sm",
              fixture.winnerAway === true ? "font-semibold" : "text-foreground/90",
            )}
          >
            {fixture.awayTeamName}
          </span>
        </span>

        {finished ? (
          <span className="tabnum text-2xs text-muted-foreground">
            {fixture.goalsHome ?? 0}–{fixture.goalsAway ?? 0}
          </span>
        ) : null}
      </Link>
    </motion.div>
  );
}
