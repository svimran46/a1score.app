import Link from "next/link";

import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "fixtures", label: "Fixtures" },
  { key: "squad", label: "Squad" },
  { key: "stats", label: "Stats" },
] as const;

export type TeamTab = (typeof TABS)[number]["key"];

/** Parse a team tab param safely. */
export function parseTeamTab(value: string | undefined): TeamTab {
  return (TABS.find((t) => t.key === value)?.key ?? "overview") as TeamTab;
}

/** Team-detail tabs — server-rendered links, keyboard navigable. */
export function TeamTabs({ teamId, active }: { teamId: number; active: TeamTab }) {
  return (
    <div role="tablist" aria-label="Team sections" className="bg-muted w-full rounded-lg p-1 sm:w-auto">
      <div className="grid grid-cols-4 sm:flex">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              href={`/teams/${teamId}?tab=${tab.key}`}
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
