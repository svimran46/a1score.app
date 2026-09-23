import { Goal, Square, RefreshCcw, MonitorPlay, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { MatchEvent } from "@/lib/schemas";
import { cn } from "@/lib/utils";

function eventIcon(event: MatchEvent): { icon: LucideIcon; tone: string } {
  if (event.type === "Goal") return { icon: Goal, tone: "text-primary" };
  if (event.type === "Card") {
    return event.detail === "Yellow Card"
      ? { icon: Square, tone: "text-yellow-500 fill-yellow-500" }
      : { icon: Square, tone: "text-destructive fill-destructive" };
  }
  if (event.type === "Subst") return { icon: RefreshCcw, tone: "text-muted-foreground" };
  if (event.type === "Var") return { icon: MonitorPlay, tone: "text-chart-4" };
  return { icon: Clock, tone: "text-muted-foreground" };
}

/**
 * Match event timeline: minute-rail on the left, events colored by team
 * side. Server Component.
 */
export function EventsTimeline({
  events,
  homeTeamId,
}: {
  events: MatchEvent[];
  homeTeamId?: number;
}) {
  return (
    <ol className="bg-card flex flex-col rounded-xl border">
      {[...events]
        .sort((a, b) => b.elapsed - a.elapsed)
        .map((event, i) => {
          const { icon: Icon, tone } = eventIcon(event);
          const side: "left" | "right" =
            homeTeamId !== undefined ? (event.teamId === homeTeamId ? "left" : "right") : i % 2 === 0 ? "left" : "right";
          const minuteLabel = event.elapsedExtra
            ? `${event.elapsed}+${event.elapsedExtra}'`
            : `${event.elapsed}'`;

          return (
            <li
              key={`${event.elapsed}-${event.elapsedExtra}-${event.playerName ?? i}`}
              className={cn(
                "hover:bg-accent/40 flex items-center gap-3 px-4 py-2.5 transition-colors",
                side === "right" && "flex-row-reverse text-right",
              )}
              style={
                side === "right"
                  ? { textAlign: "right" }
                  : undefined
              }
            >
              <span className="tabnum text-muted-foreground w-10 shrink-0 text-xs font-semibold">
                {minuteLabel}
              </span>
              <span className="bg-border w-px self-stretch" aria-hidden />
              <Icon className={cn("size-4 shrink-0", tone)} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{event.playerName ?? "Unknown"}</span>
                {event.detail ? (
                  <span className="text-muted-foreground block truncate text-xs">{event.detail}</span>
                ) : null}
                {event.assistName ? (
                  <span className="text-muted-foreground block truncate text-xs">
                    assist: {event.assistName}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
    </ol>
  );
}
