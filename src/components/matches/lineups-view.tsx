import { Shirt } from "lucide-react";

import { EmptyState } from "@/components/shared/states";
import type { Lineup } from "@/lib/schemas";

function LineupColumn({ lineup, title }: { lineup: Lineup; title: string }) {
  return (
    <div className="bg-card flex-1 rounded-xl border p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="truncate text-sm font-semibold">{title}</h3>
        {lineup.formation ? (
          <span className="text-muted-foreground tabnum text-xs">{lineup.formation}</span>
        ) : null}
      </div>

      {lineup.coachName ? (
        <p className="text-muted-foreground mb-3 text-xs">Coach: {lineup.coachName}</p>
      ) : null}

      <p className="text-muted-foreground mb-1.5 text-2xs font-semibold tracking-wide uppercase">
        Starting XI
      </p>
      <ul className="mb-4 divide-y divide-border/50">
        {lineup.startXI.map((p) => (
          <li key={p.playerId} className="flex items-center gap-2 py-1.5 text-sm">
            <span className="tabnum text-muted-foreground w-6 shrink-0 text-xs">
              {p.number ?? "–"}
            </span>
            <span className="truncate">{p.name}</span>
            {p.position ? (
              <span className="text-muted-foreground ml-auto text-2xs uppercase">{p.position}</span>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground mb-1.5 text-2xs font-semibold tracking-wide uppercase">
        Substitutes
      </p>
      <ul className="divide-y divide-border/50">
        {lineup.substitutes.map((p) => (
          <li key={p.playerId} className="flex items-center gap-2 py-1.5 text-sm">
            <span className="tabnum text-muted-foreground w-6 shrink-0 text-xs">
              {p.number ?? "–"}
            </span>
            <span className="truncate">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Match lineups — two columns on desktop, stacked on phones. An empty
 * array is a distinct "not published yet" state, never an error (Section 8.4).
 */
export function LineupsView({
  lineups,
  homeName,
  awayName,
}: {
  lineups: Lineup[];
  homeName: string;
  awayName: string;
}) {
  if (lineups.length === 0) {
    return (
      <EmptyState
        icon={<Shirt aria-hidden className="size-8" />}
        title="Lineups not published yet"
        message="Official starting XIs usually appear 20–40 minutes before kickoff."
      />
    );
  }

  const home = lineups[0];
  const away = lineups[1];

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {home ? <LineupColumn lineup={home} title={homeName} /> : null}
      {away ? <LineupColumn lineup={away} title={awayName} /> : null}
    </div>
  );
}
