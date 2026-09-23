import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/shared/states";
import type { MatchStatistics } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/**
 * Side-by-side match statistics with share bars. Server Component.
 */
export function StatsView({ stats }: { stats: MatchStatistics | null }) {
  if (!stats || stats.stats.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 aria-hidden className="size-8" />}
        title="No stats yet"
        message="Team statistics appear once the match is under way."
      />
    );
  }

  return (
    <div className="bg-card rounded-xl border p-4">
      <ul className="flex flex-col gap-4">
        {stats.stats.map((stat) => {
          const home = stat.home ?? 0;
          const away = stat.away ?? 0;
          const total = home + away;
          const homePct = total > 0 ? Math.round((home / total) * 100) : 50;
          return (
            <li key={stat.label}>
              <div className="tabnum mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold">{stat.home ?? "–"}</span>
                <span className="text-muted-foreground text-xs">{stat.label}</span>
                <span className="font-semibold">{stat.away ?? "–"}</span>
              </div>
              <div
                className="bg-muted flex h-1.5 overflow-hidden rounded-full"
                role="img"
                aria-label={`${stat.label}: ${stat.home ?? 0} versus ${stat.away ?? 0}`}
              >
                <span
                  className="bg-primary h-full transition-[width] duration-500"
                  style={{ width: `${homePct}%` }}
                />
                <span
                  className={cn("h-full bg-primary/40 transition-[width] duration-500")}
                  style={{ width: `${100 - homePct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
