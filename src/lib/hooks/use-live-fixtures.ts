"use client";

/**
 * TanStack Query hooks for fixture data. Polling hits OUR route handlers,
 * which read the shared Data Cache — upstream calls stay at one per window
 * no matter how many visitors are polling (Section 2).
 */

import { useQuery } from "@tanstack/react-query";
import type { Fixture } from "@/lib/schemas";
import { isLiveStatus } from "@/lib/match-status";
import { fetchJson } from "@/lib/api-client";

/** Poll cadence for live widgets. Slightly above the 25s cache window. */
const LIVE_POLL_MS = 30_000;

/**
 * All in-play fixtures, polled every 30s while the tab is visible.
 * `initialData` seeds the query with server-rendered data so the first
 * paint already has content (zero client round-trip on hydration).
 */
export function useLiveFixtures(initialData?: Fixture[]) {
  return useQuery<Fixture[]>({
    queryKey: ["fixtures", "live"],
    queryFn: async () => {
      const data = await fetchJson<{ fixtures: Fixture[] }>("/api/fixtures/live");
      return data.fixtures;
    },
    initialData,
    refetchInterval: LIVE_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/**
 * One fixture, polled only while the match is live.
 */
export function useFixture(fixtureId: number, initialData?: Fixture | null) {
  return useQuery<Fixture | null>({
    queryKey: ["fixture", fixtureId],
    queryFn: async () => {
      const data = await fetchJson<{ fixture: Fixture | null }>(`/api/fixtures/${fixtureId}`);
      return data.fixture;
    },
    initialData,
    refetchInterval: (query) => {
      const fixture = query.state.data;
      if (!fixture || !isLiveStatus(fixture.statusShort)) return false;
      return LIVE_POLL_MS;
    },
    refetchIntervalInBackground: false,
  });
}
