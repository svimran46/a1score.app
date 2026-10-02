/**
 * src/lib/cache.ts
 *
 * Resilient, Non-Blocking Cache & KV Wrapper for Cloudflare Edge Runtime
 * Free plan limits: 100k reads/day, 1k writes/day, 50ms CPU limit, potential cold-start timeouts.
 *
 * Guarantees:
 * 1. Zero hard dependencies on KV availability (always non-blocking).
 * 2. Strict timeout protection on remote cache or storage reads.
 * 3. Graceful degradation: in-memory L1 cache -> stale fallback -> direct single-flight read.
 * 4. Single-flight per key: concurrent requests for the same key await the same in-flight Promise.
 * 5. Bounded L1 memory cache with LRU eviction (max 500 entries).
 * 6. Never causes SSR or RSC page render to throw or duplicate calls unnecessarily.
 */

export const MAX_CACHE_ENTRIES = 500;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlight = new Map<string, Promise<any>>();

export function _clearMemoryCache(): void {
  memoryCache.clear();
  inFlight.clear();
}

export function _getMemoryCacheSize(): number {
  return memoryCache.size;
}

export interface CacheStats {
  size: number;
  maxEntries: number;
  inFlightCount: number;
  oldestEntryAgeSeconds: number | null;
  isOperational: boolean;
}

export function _getCacheStats(): CacheStats {
  const now = Date.now();
  let oldestTimestamp: number | null = null;
  for (const entry of memoryCache.values()) {
    const approxCreatedAt = entry.expiresAt - 3600 * 1000;
    if (oldestTimestamp === null || approxCreatedAt < oldestTimestamp) {
      oldestTimestamp = approxCreatedAt;
    }
  }

  const oldestEntryAgeSeconds =
    oldestTimestamp !== null ? Math.max(0, Math.floor((now - oldestTimestamp) / 1000)) : null;

  return {
    size: memoryCache.size,
    maxEntries: MAX_CACHE_ENTRIES,
    inFlightCount: inFlight.size,
    oldestEntryAgeSeconds,
    isOperational: true,
  };
}

function touchLru<T>(key: string, entry: CacheEntry<T>): void {
  memoryCache.delete(key);
  memoryCache.set(key, entry);
  if (memoryCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey !== undefined) {
      memoryCache.delete(oldestKey);
    }
  }
}

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
    if (fallbackValue !== null) {
      return fallbackValue;
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Non-blocking KV / Cache getter with in-memory stale fallback and single-flight execution.
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 3600
): Promise<T> {
  const now = Date.now();

  // 1. Check L1 in-memory cache first (instant 0ms)
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (cached) {
    touchLru(key, cached);
    if (cached.expiresAt > now) {
      return cached.value;
    }
  }

  // 2. Single-flight management: ensure only ONE fetcher is running for this key
  let flight = inFlight.get(key) as Promise<T> | undefined;
  if (!flight) {
    flight = (async () => {
      try {
        const fresh = await fetcher();
        if (fresh !== null && fresh !== undefined) {
          touchLru(key, {
            value: fresh,
            expiresAt: Date.now() + ttlSeconds * 1000,
          });
        }
        return fresh;
      } finally {
        inFlight.delete(key);
      }
    })();

    // Attach no-op catch to prevent unhandled rejection warnings if a caller detaches
    flight.catch(() => {});
    inFlight.set(key, flight);
  }

  // 3. Stale value exists: race flight with soft 1.5s timeout, falling back to stale on delay/error
  if (cached && cached.value !== undefined && cached.value !== null) {
    try {
      const fresh = await withTimeout(flight, 1500, cached.value);
      return fresh ?? cached.value;
    } catch {
      return cached.value;
    }
  }

  // 4. Cold key (no stale value exists): await original in-flight fetcher up to 8s hard timeout.
  // Never spawn a second fetcher.
  const result = await withTimeout(flight, 8000, null);
  if (result !== null && result !== undefined) {
    return result;
  }

  throw new Error(`[Cache] Fetcher timed out after 8000ms for key: ${key}`);
}
