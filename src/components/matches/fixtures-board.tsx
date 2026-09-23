"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, ChevronDown, Radio } from "lucide-react";

import { MatchRow } from "@/components/matches/match-row";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { TeamLogo } from "@/components/shared/team-logo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLiveFixtures } from "@/lib/hooks/use-live-fixtures";
import { isLiveStatus } from "@/lib/match-status";
import { useUiStore } from "@/lib/store/ui";
import type { Fixture } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface BoardProps {
  /** Server-rendered fixtures for the selected date. */
  initialFixtures: Fixture[];
  /** Server-rendered live fixtures (may be from cache seconds ago). */
  initialLive: Fixture[];
  /** True when the server fetch failed entirely (enables retry). */
  serverError: boolean;
}

interface LeagueGroup {
  leagueId: number;
  leagueName: string;
  leagueCountry: string | null;
  leagueLogoUrl: string | null;
  fixtures: Fixture[];
}

/** Sort: in-play first, then by kickoff time. */
function sortFixtures(list: Fixture[]): Fixture[] {
  return [...list].sort((a, b) => {
    const aLive = isLiveStatus(a.statusShort) ? 0 : 1;
    const bLive = isLiveStatus(b.statusShort) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return a.timestamp - b.timestamp;
  });
}

function groupByLeague(fixtures: Fixture[]): LeagueGroup[] {
  const map = new Map<number, LeagueGroup>();
  for (const f of fixtures) {
    const g = map.get(f.leagueId);
    if (g) {
      g.fixtures.push(f);
    } else {
      map.set(f.leagueId, {
        leagueId: f.leagueId,
        leagueName: f.leagueName,
        leagueCountry: f.leagueCountry,
        leagueLogoUrl: f.leagueLogoUrl,
        fixtures: [],
      });
      map.get(f.leagueId)?.fixtures.push(f);
    }
  }
  return [...map.values()];
}

/**
 * The Matches board — the app's heart. Polls OUR /api/fixtures/live every
 * 30s, merges fresher live rows over the date list, and renders collapsible
 * per-league groups with zero layout shift.
 */
export function FixturesBoard({ initialFixtures, initialLive, serverError }: BoardProps) {
  const router = useRouter();
  const liveOnly = useUiStore((s) => s.liveOnly);
  const setLiveOnly = useUiStore((s) => s.setLiveOnly);

  const liveQuery = useLiveFixtures(initialLive);

  const fixtures = useMemo(() => {
    const base = new Map<number, Fixture>();
    for (const f of initialFixtures) base.set(f.id, f);
    const live = liveQuery.data;
    if (live) {
      for (const f of live) {
        base.set(f.id, f);
      }
    }
    let list = [...base.values()];
    if (liveOnly) {
      list = list.filter((f) => isLiveStatus(f.statusShort));
    }
    return sortFixtures(list);
  }, [initialFixtures, liveQuery.data, liveOnly]);

  const groups = useMemo(() => groupByLeague(fixtures), [fixtures]);
  const liveCount = useMemo(
    () => fixtures.filter((f) => isLiveStatus(f.statusShort)).length,
    [fixtures],
  );

  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  function toggleLeague(id: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (serverError && fixtures.length === 0) {
    return (
      <ErrorState
        title="Couldn't load matches"
        message="The data source didn't respond. This is usually temporary."
        onRetry={() => router.refresh()}
      />
    );
  }

  if (liveQuery.isError && fixtures.length === 0) {
    return (
      <ErrorState
        title="Couldn't refresh matches"
        message={liveQuery.error instanceof Error ? liveQuery.error.message : "Please try again."}
        onRetry={() => void liveQuery.refetch()}
      />
    );
  }

  if (fixtures.length === 0 && !liveQuery.isPending) {
    return (
      <EmptyState
        icon={liveOnly ? <Radio aria-hidden /> : <CalendarX aria-hidden />}
        title={liveOnly ? "No matches are live right now" : "No matches on this day"}
        message={
          liveOnly
            ? "Turn off the live filter to see all fixtures for the selected date."
            : "Pick another date — yesterday, tomorrow, or any day you like."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {liveCount > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-live size-1.5 animate-pulse rounded-full" aria-hidden />
              {liveCount} live {liveCount === 1 ? "match" : "matches"}
            </span>
          ) : (
            `${fixtures.length} ${fixtures.length === 1 ? "match" : "matches"}`
          )}
        </p>
        <button
          type="button"
          aria-pressed={liveOnly}
          onClick={() => setLiveOnly(!liveOnly)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50",
            liveOnly
              ? "border-live/40 bg-live/10 text-live"
              : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
        >
          <span
            aria-hidden
            className={cn("size-1.5 rounded-full", liveOnly ? "bg-live" : "bg-muted-foreground")}
          />
          Live only
        </button>
      </div>

      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.leagueId);
        return (
          <Collapsible
            key={group.leagueId}
            open={!isCollapsed}
            onOpenChange={(open) => {
              if (!open) toggleLeague(group.leagueId);
              else toggleLeague(group.leagueId);
            }}
          >
            <div className="bg-card overflow-hidden rounded-xl border">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="hover:bg-accent/50 flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors outline-none"
                  aria-expanded={!isCollapsed}
                >
                  <TeamLogo src={group.leagueLogoUrl} alt={group.leagueName} size={20} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {group.leagueName}
                    {group.leagueCountry ? (
                      <span className="text-muted-foreground font-normal"> · {group.leagueCountry}</span>
                    ) : null}
                  </span>
                  <span className="tabnum text-2xs text-muted-foreground">
                    {group.fixtures.length}
                  </span>
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "text-muted-foreground size-4 transition-transform duration-200",
                      isCollapsed && "-rotate-90",
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="divide-y divide-border/60">
                  {group.fixtures.map((fixture) => (
                    <MatchRow key={fixture.id} fixture={fixture} />
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
