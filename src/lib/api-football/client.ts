import "server-only";

/**
 * Low-level API-Football v3 client — the ONLY module that reads
 * API_FOOTBALL_KEY. Uses fetch() with `next.revalidate` so every response
 * is cached once per deployment and shared by all visitors (Section 2).
 *
 * Never import this from a Client Component: `server-only` makes that a
 * build error.
 */

import { describeError, err, ok, type Result } from "@/types/result";

const BASE_URL = "https://v3.football.api-sports.io/";

/**
 * Revalidate windows in seconds (Section 2, table).
 * Scale up if running on a lower-tier API plan.
 */
export const REVALIDATE = {
  liveFixtures: 25,
  dateFixtures: 5 * 60,
  finishedFixtures: 7 * 24 * 60 * 60,
  standingsGameweek: 15 * 60,
  standingsIdle: 6 * 60 * 60,
  teamProfile: 24 * 60 * 60,
  playerProfile: 24 * 60 * 60,
  topScorers: 12 * 60 * 60,
  leagues: 7 * 24 * 60 * 60,
  matchDetail: 5 * 60,
  matchEvents: 60,
  matchLineups: 2 * 60,
  matchStats: 2 * 60,
  injuries: 60 * 60,
  coach: 7 * 24 * 60 * 60,
} as const;

export type RevalidateKey = keyof typeof REVALIDATE;

/** Tag a cache entry so it can be revalidated on demand. */
function tagsFor(key: RevalidateKey, extra: string[]): string[] {
  return ["api-football", key, ...extra];
}

/* ------------------------------------------------------------------ */
/* Daily quota counter (process-local; Section 2 point 5)              */
/* ------------------------------------------------------------------ */

interface UsageState {
  day: string;
  count: number;
  lastCallAt: string | null;
  trackedErrors: number;
  upstreamOk: boolean;
}

const usage: UsageState = {
  day: currentDay(),
  count: 0,
  lastCallAt: null,
  trackedErrors: 0,
  upstreamOk: true,
};

function currentDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function recordCall(upstreamOk: boolean): void {
  const day = currentDay();
  if (usage.day !== day) {
    usage.day = day;
    usage.count = 0;
  }
  usage.count += 1;
  usage.lastCallAt = new Date().toISOString();
  usage.upstreamOk = upstreamOk;
  if (!upstreamOk) usage.trackedErrors += 1;
}

/** Snapshot of upstream usage for /api/status. */
export function getUsageSnapshot(): UsageState {
  return { ...usage };
}

/* ------------------------------------------------------------------ */
/* Request execution                                                   */
/* ------------------------------------------------------------------ */

const TIMEOUT_MS = 12_000;

/** Raw envelope returned by every API-Football v3 endpoint. */
interface ApiEnvelope<T> {
  get: string;
  parameters: Record<string, string>;
  errors: unknown;
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

/**
 * `errors` may be an object ({token: "..."}) on HTTP 200, an array of
 * strings, or an empty object/array. Normalize to a list of messages.
 */
function extractErrorMessages(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((m): m is string => typeof m === "string" && m.length > 0);
  }
  if (raw !== null && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== false && v !== 0 && v !== "")
      .map(([k, v]) => (typeof v === "string" ? `${k}: ${v}` : k));
  }
  return [];
}

/**
 * Perform a cached GET against API-Football.
 *
 * The `revalidateKey` selects the Section 2 window; `extraTags` lets
 * callers invalidate per-entity (e.g. `fixture:654321`).
 */
export async function apiGet<T>(
  path: string,
  params: Record<string, string | number>,
  revalidateKey: RevalidateKey,
  extraTags: string[] = [],
): Promise<Result<ApiEnvelope<T>>> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key || key.length === 0) {
    recordCall(false);
    return err({
      kind: "api_error",
      messages: ["Server is missing API_FOOTBALL_KEY configuration."],
    });
  }

  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "x-apisports-key": key },
      signal: controller.signal,
      next: {
        revalidate: REVALIDATE[revalidateKey],
        tags: tagsFor(revalidateKey, extraTags),
      },
    });

    if (res.status === 429) {
      recordCall(false);
      const retryAfter = Number(res.headers.get("retry-after"));
      return err({
        kind: "rate_limited",
        retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
      });
    }

    if (!res.ok) {
      recordCall(false);
      return err({ kind: "http", status: res.status });
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      recordCall(false);
      return err({ kind: "api_error", messages: ["Malformed JSON from data source."] });
    }

    const envelope = json as Partial<ApiEnvelope<T>> | undefined;
    if (!envelope || typeof envelope !== "object" || !Array.isArray(envelope.response)) {
      recordCall(false);
      return err({ kind: "api_error", messages: ["Unexpected response envelope."] });
    }

    const messages = extractErrorMessages(envelope.errors);
    if (messages.length > 0) {
      recordCall(false);
      return err({ kind: "api_error", messages });
    }

    recordCall(true);
    return ok({
      get: envelope.get ?? path,
      parameters: envelope.parameters ?? {},
      errors: envelope.errors ?? {},
      results: envelope.results ?? envelope.response.length,
      paging: envelope.paging ?? { current: 1, total: 1 },
      response: envelope.response,
    });
  } catch (e) {
    recordCall(false);
    return err(describeError(e));
  } finally {
    clearTimeout(timer);
  }
}
