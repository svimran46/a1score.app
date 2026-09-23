import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "lineups", label: "Lineups" },
  { key: "stats", label: "Stats" },
  { key: "h2h", label: "H2H" },
] as const;

export type MatchTab = (typeof TABS)[number]["key"];

/** Parse a tab param safely. */
export function parseMatchTab(value: string | undefined): MatchTab {
  return (TABS.find((t) => t.key === value)?.key ?? "overview") as MatchTab;
}

/**
 * Match-detail tabs. Server-rendered links (`?tab=`) keep every panel a
 * Server Component — no client boundary needed for tab state, and links
 * are keyboard-navigable by default (Section 9).
 */
export function MatchTabs({ fixtureId, active }: { fixtureId: number; active: MatchTab }) {
  return (
    <div
      role="tablist"
      aria-label="Match sections"
      className="bg-muted w-full items-center gap-1 rounded-lg p-1 sm:w-auto sm:self-start"
    >
      <div className="grid grid-cols-4 sm:flex">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              href={`/matches/${fixtureId}?tab=${tab.key}`}
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
