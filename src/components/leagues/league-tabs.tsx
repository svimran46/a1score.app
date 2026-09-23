import Link from "next/link";

import { cn } from "@/lib/utils";

const TABS = [
  { key: "fixtures", label: "Fixtures" },
  { key: "table", label: "Table" },
  { key: "topscorers", label: "Top scorers" },
  { key: "topassists", label: "Top assists" },
] as const;

export type LeagueTab = (typeof TABS)[number]["key"];

/** Parse a league tab param safely. */
export function parseLeagueTab(value: string | undefined): LeagueTab {
  return (TABS.find((t) => t.key === value)?.key ?? "fixtures") as LeagueTab;
}

/** League-detail tabs — server-rendered links, keyboard navigable. */
export function LeagueTabs({ leagueId, active }: { leagueId: number; active: LeagueTab }) {
  return (
    <div
      role="tablist"
      aria-label="League sections"
      className="bg-muted w-full rounded-lg p-1 sm:w-auto"
    >
      <div className="grid grid-cols-2 sm:flex">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              href={`/leagues/${leagueId}?tab=${tab.key}`}
              scroll={false}
              className={cn(
                "rounded-md px-3 py-1.5 text-center text-sm font-medium whitespace-nowrap transition-colors outline-none",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
