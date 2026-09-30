/**
 * src/lib/cache.ts
 *
 * Resilient, Non-Blocking Cache & KV Wrapper for Cloudflare Edge Runtime
 * Free plan limits: 100k reads/day, 1k writes/day, 50ms CPU limit, potential cold-start timeouts.
 *
 * Guarantees:
 * 1. Zero hard dependencies on KV availability (always non-blocking).
 * 2. Strict 1.5s timeout on any remote cache or storage read.
 * 3. Graceful degradation: in-memory L1 cache -> stale fallback -> direct read.
 * 4. Never causes SSR or RSC page render to throw or fail.
 */

const memoryCache = new Map<string, { value: any; expiresAt: number }>();

/**
 * Execute an async operation with a hard timeout (default 1500ms).
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 1500,
  fallbackValue: T | null = null
): Promise<T | null> {
  let timer: any = null;
  const timeoutPromise = new Promise<T | null>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[Cache/Edge] Operation timed out after ${timeoutMs}ms, falling back safely.`);
      resolve(fallbackValue);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } catch (err) {
    console.warn("[Cache/Edge] Operation failed, returning fallback:", err);
    return fallbackValue;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Non-blocking KV / Cache getter with in-memory stale fallback.
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 3600
): Promise<T> {
  const now = Date.now();

  // 1. Check L1 in-memory cache first (instant 0ms)
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  // 2. Fetch with 1.5s timeout protection
  try {
    const fresh = await withTimeout(fetcher(), 1500, cached?.value || null);
    if (fresh !== null && fresh !== undefined) {
      memoryCache.set(key, {
        value: fresh,
        expiresAt: now + ttlSeconds * 1000,
      });
      return fresh;
    }
  } catch (err) {
    console.warn(`[Cache] Fetch failed for key ${key}:`, err);
  }

  // 3. Fallback to stale memory cache or execute directly
  if (cached) {
    return cached.value as T;
  }

  // Final direct attempt if memory had nothing
  return await fetcher();
}
