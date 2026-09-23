"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { TeamLogo } from "@/components/shared/team-logo";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RateLimitError } from "@/lib/api-client";
import type { SearchResult } from "@/lib/schemas";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 400;
const MIN_CHARS = 2;

type Tab = "all" | "teams" | "leagues";

/**
 * Search (Section 8.7): debounced (400ms, min 2 chars) search across teams
 * and leagues with tabbed results. Queries run through TanStack Query
 * against our own /api/search route.
 */
export default function SearchPage() {
  const [rawQuery, setRawQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const isClient = useIsClient();

  // Debounce the trimmed input; short queries clear on a 0ms timer (kept
  // asynchronous so the effect never sets state synchronously).
  useEffect(() => {
    const trimmed = rawQuery.trim();
    const short = trimmed.length < MIN_CHARS;
    const t = setTimeout(
      () => setDebounced(short ? "" : trimmed),
      short ? 0 : DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [rawQuery]);

  const enabled = isClient && debounced.length >= MIN_CHARS;

  const searchQuery = useQuery({
    queryKey: ["search", debounced],
    queryFn: async ({ signal }): Promise<SearchResult[]> => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`, {
        signal,
        headers: { Accept: "application/json" },
      });
      if (res.status === 429) throw new RateLimitError();
      if (!res.ok) throw new Error(`Search failed (HTTP ${res.status}).`);
      const data = (await res.json()) as { results: SearchResult[] };
      return data.results;
    },
    enabled,
    staleTime: 60_000,
    retry: (failureCount, error) => (error instanceof RateLimitError ? false : failureCount < 1),
  });

  const results = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);

  const visible = useMemo(() => {
    if (tab === "all") return results;
    return results.filter((r) => (tab === "teams" ? r.kind === "team" : r.kind === "league"));
  }, [results, tab]);

  const teamCount = results.filter((r) => r.kind === "team").length;
  const leagueCount = results.filter((r) => r.kind === "league").length;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Search</h1>

      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <label htmlFor="search-page-input" className="sr-only">
          Search teams and leagues
        </label>
        <Input
          id="search-page-input"
          type="search"
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          placeholder="Search teams and leagues…"
          autoComplete="off"
          className="h-11 pl-9 text-base"
        />
      </div>

      <div
        role="tablist"
        aria-label="Result type"
        className="bg-muted flex w-fit items-center gap-1 rounded-lg p-1"
      >
        {(["all", "teams", "leagues"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors outline-none",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              {t === "teams" && teamCount > 0 ? ` (${teamCount})` : ""}
              {t === "leagues" && leagueCount > 0 ? ` (${leagueCount})` : ""}
            </button>
          );
        })}
      </div>

      {searchQuery.isPending && enabled ? (
        <div className="flex flex-col gap-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-card flex items-center gap-3 rounded-xl border p-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      ) : null}

      {searchQuery.isError ? (
        <ErrorState
          message={searchQuery.error instanceof Error ? searchQuery.error.message : "Search failed."}
          onRetry={() => void searchQuery.refetch()}
        />
      ) : null}

      {!enabled ? (
        <EmptyState
          icon={<Search aria-hidden className="size-8" />}
          title="Find your team"
          message="Start typing to search teams and leagues — at least 2 characters."
        />
      ) : null}

      {enabled && !searchQuery.isPending && !searchQuery.isError && visible.length === 0 ? (
        <EmptyState
          title={`No results for “${debounced}”`}
          message="Check the spelling or try a shorter query."
        />
      ) : null}

      {visible.length > 0 ? (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => {
            const href = r.kind === "team" ? `/teams/${r.id}` : `/leagues/${r.id}`;
            const image = r.kind === "player" ? r.photoUrl : r.logoUrl;
            const country = r.kind === "player" ? null : r.country;
            return (
              <li key={`${r.kind}:${r.id}`}>
                <Link
                  href={href}
                  className="bg-card hover:border-primary/40 flex items-center gap-3 rounded-xl border p-3 transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <TeamLogo src={image} alt={r.name} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.name}</span>
                    <span className="text-muted-foreground block truncate text-xs capitalize">
                      {r.kind}
                      {country ? ` · ${country}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
