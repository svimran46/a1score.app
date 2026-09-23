import Link from "next/link";

import { TeamLogo } from "@/components/shared/team-logo";
import { EmptyState } from "@/components/shared/states";
import type { TopPlayerEntry } from "@/lib/schemas";

/**
 * Top scorers / assists table (Section 8.3). Rows link to player pages.
 */
export function TopPlayersTable({
  entries,
  metricLabel,
  emptyTitle,
}: {
  entries: TopPlayerEntry[];
  metricLabel: string;
  emptyTitle: string;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        message="Statistics become available once the season is under way."
      />
    );
  }

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <ol className="divide-y divide-border/50">
        {entries.slice(0, 20).map((entry, i) => (
          <li key={`${entry.playerId}-${i}`}>
            <Link
              href={`/players/${entry.playerId}`}
              className="hover:bg-accent/40 flex items-center gap-3 px-3 py-2.5 transition-colors outline-none focus-visible:bg-accent/40"
            >
              <span className="tabnum text-muted-foreground w-5 text-center text-xs font-semibold">
                {i + 1}
              </span>
              <TeamLogo src={entry.photoUrl} alt={entry.playerName} size={28} className="rounded-full" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{entry.playerName}</span>
                <span className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                  <TeamLogo src={entry.teamLogoUrl} alt="" size={14} />
                  <span className="truncate">{entry.teamName}</span>
                </span>
              </span>
              <span className="text-right">
                <span className="tabnum block text-sm font-bold">{entry.value}</span>
                <span className="text-muted-foreground block text-2xs">{metricLabel}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
