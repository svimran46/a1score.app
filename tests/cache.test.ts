import test from "node:test";
import assert from "node:assert/strict";
import {
  getCachedOrFetch,
  withTimeout,
  _clearMemoryCache,
  _getMemoryCacheSize,
  MAX_CACHE_ENTRIES,
} from "../src/lib/cache";

test("cache: single-flight deduplicates concurrent requests for the same key", async () => {
  _clearMemoryCache();
  let fetchCount = 0;

  const slowFetcher = async () => {
    fetchCount++;
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { data: "shared-payload" };
  };

  // Launch 5 concurrent calls for the same cold key
  const results = await Promise.all([
    getCachedOrFetch("flight-key", slowFetcher),
    getCachedOrFetch("flight-key", slowFetcher),
    getCachedOrFetch("flight-key", slowFetcher),
    getCachedOrFetch("flight-key", slowFetcher),
    getCachedOrFetch("flight-key", slowFetcher),
  ]);

  // All 5 callers should receive the exact same object
  for (const res of results) {
    assert.deepEqual(res, { data: "shared-payload" });
  }

  // Exactly 1 network fetcher was executed
  assert.equal(fetchCount, 1);
});

test("cache: timeout with stale cache returns stale value safely without throwing", async () => {
  _clearMemoryCache();

  // 1. Prime cache with an initial value and let it expire
  await getCachedOrFetch("stale-key", async () => "initial-value", 0.05); // 50ms TTL
  await new Promise((resolve) => setTimeout(resolve, 60)); // Wait until expired

  let slowFinished = false;
  const slowFetcher = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1700)); // > 1500ms soft timeout
    slowFinished = true;
    return "fresh-value";
  };

  const start = Date.now();
  const val = await getCachedOrFetch("stale-key", slowFetcher);
  const elapsed = Date.now() - start;

  // Stale value returned upon soft timeout (~1500ms)
  assert.equal(val, "initial-value");
  assert.ok(elapsed >= 1400 && elapsed < 2000, `Elapsed ${elapsed}ms should be around 1500ms`);

  // Wait for background fetch to complete and verify cache is updated with fresh value
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.ok(slowFinished, "Background fetch should finish without unhandled rejection");

  const refreshedVal = await getCachedOrFetch("stale-key", async () => "should-not-be-called");
  assert.equal(refreshedVal, "fresh-value");
});

test("cache: cold key awaits original fetcher beyond 1.5s up to hard timeout without duplicate calls", async () => {
  _clearMemoryCache();
  let fetchCalls = 0;

  const moderateSlowFetcher = async () => {
    fetchCalls++;
    await new Promise((resolve) => setTimeout(resolve, 1800)); // Takes 1.8s (beyond 1.5s soft timeout, well under 8s)
    return "cold-data-resolved";
  };

  const start = Date.now();
  const val = await getCachedOrFetch("cold-moderate-key", moderateSlowFetcher);
  const elapsed = Date.now() - start;

  assert.equal(val, "cold-data-resolved");
  assert.equal(fetchCalls, 1, "Fetcher must only be called once, no second duplicate attempt");
  assert.ok(elapsed >= 1700 && elapsed < 2500, `Elapsed ${elapsed}ms should reflect single fetch`);
});

test("cache: enforces MAX_CACHE_ENTRIES limit with LRU eviction", async () => {
  _clearMemoryCache();

  // Populate cache up to MAX_CACHE_ENTRIES + 10 entries
  for (let i = 0; i < MAX_CACHE_ENTRIES + 10; i++) {
    await getCachedOrFetch(`key-${i}`, async () => `val-${i}`, 3600);
  }

  // Size must be capped at MAX_CACHE_ENTRIES (500)
  assert.equal(_getMemoryCacheSize(), MAX_CACHE_ENTRIES);

  // The first 10 keys (key-0 through key-9) should have been evicted
  let callCounter = 0;
  await getCachedOrFetch("key-0", async () => {
    callCounter++;
    return "re-fetched-0";
  });
  assert.equal(callCounter, 1, "key-0 should have been evicted and required re-fetch");
});

test("withTimeout: handles fast resolution and timeout fallback correctly", async () => {
  const fast = await withTimeout(Promise.resolve("fast-ok"), 500, "fallback");
  assert.equal(fast, "fast-ok");

  const timedOut = await withTimeout(
    new Promise((resolve) => setTimeout(() => resolve("late"), 300)),
    50,
    "fallback-val"
  );
  assert.equal(timedOut, "fallback-val");
});
