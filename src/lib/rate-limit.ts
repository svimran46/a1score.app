/**
 * Edge-compatible sliding-window rate limiter using in-memory Map.
 * 
 * On Cloudflare Pages (edge), each isolate has its own memory,
 * so this is per-isolate, not globally coordinated. It still
 * prevents a single user from hammering a single edge node.
 *
 * For production, consider Cloudflare Rate Limiting rules or
 * Durable Objects for global coordination.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 60s to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  store.forEach((entry, key) => {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  });
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check and consume one request against the rate limit.
 * @param key - Unique identifier (e.g., IP + route)
 * @param limit - Max requests per window
 * @param windowMs - Window size in milliseconds (default 60s)
 */
export function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, limit, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract a rate-limit key from a Request.
 * Uses CF-Connecting-IP → X-Forwarded-For → X-Real-IP → "anonymous"
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

/**
 * Create standard rate-limit response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
