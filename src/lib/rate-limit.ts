/**
 * Edge-compatible sliding-window rate limiter using in-memory Map.
 * 
 * NOTE ON EDGE ISOLATION:
 * On Cloudflare Pages (edge runtime), each V8 isolate maintains its own in-memory state.
 * In-memory rate limiting is defense-in-depth against single-node bursts, but true global
 * DDoS mitigation must be enforced via Cloudflare WAF Rate Limiting rules at the network edge.
 * See: docs/CLOUDFLARE_RATE_LIMITS.md
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
 * @param limit - Max requests per window (default: 60)
 * @param windowMs - Window size in milliseconds (default: 60s)
 */
export function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000
): RateLimitResult {
  cleanup();

  // If client identity cannot be verified (unknown key prefix), enforce a stricter limit
  const effectiveLimit = key.startsWith("unknown_") ? Math.min(limit, 10) : limit;

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit: effectiveLimit, remaining: effectiveLimit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= effectiveLimit) {
    return { success: false, limit: effectiveLimit, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, limit: effectiveLimit, remaining: effectiveLimit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract a rate-limit key from a Request.
 * Uses CF-Connecting-IP -> X-Forwarded-For -> X-Real-IP.
 *
 * When no client IP can be derived, we do NOT share a single global "anonymous" bucket,
 * which would allow one attacker to exhaust the quota for all unidentified clients.
 * Instead, we partition unidentified requests using a header fingerprint (User-Agent + Accept-Language)
 * and prefix with "unknown_" to apply stricter rate limit bounds.
 */
export function getClientIP(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const xff = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff) return xff;

  const xRealIp = request.headers.get("x-real-ip")?.trim();
  if (xRealIp) return xRealIp;

  // Derive partition key from available client telemetry instead of global shared bucket
  const ua = request.headers.get("user-agent") || "";
  const lang = request.headers.get("accept-language") || "";
  if (ua || lang) {
    let hash = 0;
    const combined = `${ua}|${lang}`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return `unknown_${Math.abs(hash).toString(36)}`;
  }

  return `unknown_client_${Date.now() % 10}`;
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
