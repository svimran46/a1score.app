/**
 * Minimal per-IP sliding-window limiter for our own /api routes.
 * Process-local (resets on deploy) — fine for one app server; a shared
 * store (Upstash) is the documented follow-up for multi-instance hosting.
 */

interface Hit {
  timestamps: number[];
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

const hits = new Map<string, Hit>();

/** Periodically evict stale entries so the map cannot grow unbounded. */
let lastSweep = Date.now();
function sweep(now: number): void {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, hit] of hits) {
    hit.timestamps = hit.timestamps.filter((t) => now - t < WINDOW_MS);
    if (hit.timestamps.length === 0) hits.delete(key);
  }
}

export interface RateLimitVerdict {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** Check (and record) a request for the given identity key. */
export function rateLimit(identity: string): RateLimitVerdict {
  const now = Date.now();
  sweep(now);

  const hit = hits.get(identity) ?? { timestamps: [] };
  hit.timestamps = hit.timestamps.filter((t) => now - t < WINDOW_MS);

  if (hit.timestamps.length >= MAX_REQUESTS) {
    hits.set(identity, hit);
    const oldest = hit.timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)),
    };
  }

  hit.timestamps.push(now);
  hits.set(identity, hit);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - hit.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/** Extract a best-effort client identity from request headers. */
export function identityFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    const ip = first?.trim();
    if (ip) return ip;
  }
  return headers.get("x-real-ip") ?? "anonymous";
}
