# Cloudflare Free Plan Architecture, Limits & Data Sync Cadence

This document details the operational boundaries of the Cloudflare Pages free tier for `a1score.app`, the technical mitigations implemented, and the authoritative sync cadence for football intelligence.

---

## 1. Cloudflare Free Tier Operational Limits

| Resource / Feature | Free Plan Quota | Potential Pitfall | Implemented Architecture & Mitigation |
|---|---|---|---|
| **Worker CPU Time** | 50ms per request (or 10ms for non-bundled workers) | Heavy HTML scraping or dynamic parsing during SSR hits CPU limits, resulting in Worker 1101 errors. | Zero heavy compute in SSR. Calculations are pre-computed in Supabase PostgreSQL; Edge runtime only formats and serializes RSC payloads. |
| **KV Operations** | 100,000 reads/day<br>1,000 writes/day | Free KV has cold starts and unpredictable read latency (can exceed 2-3 seconds during cross-region edge calls). Hard KV dependencies fail page loads. | **Non-blocking cache pattern (`src/lib/cache.ts`):** All KV and remote cache reads are wrapped with strict `withTimeout(fetcher, 1500, fallback)`. If KV exceeds 1.5s, it gracefully returns in-memory L1 cache or falls back to direct read without failing page renders. Writes are batched. |
| **Subrequests** | 50 subrequests per request | Dynamic fetch calls to external APIs per render (e.g. scraping Transfermarkt for 20 players) exceed the 50 subrequest limit. | Roster and player profiles are fetched via single PostgREST queries or batched joins (`in` filters). TM scraping is eliminated from synchronous SSR routes. |
| **Outbound Egress & IP Blocking** | Cloudflare Edge IPs | Transfermarkt (`transfermarkt.co.uk`) actively detects and blocks or rate-limits requests originating from Cloudflare IP addresses with HTTP 403 Forbidden. | **Club Crest Proxy (`src/app/img/club/[id]/route.ts`):** Pre-mapped to FotMob AWS CloudFront CDN and TM Tech CDN. All 245 clubs have direct CDN URLs in Supabase, bypassing Transfermarkt website IP blocks completely. |
| **Background Execution / Daemons** | No long-running daemons allowed | Workers cannot run background loops or long scraping jobs. | Replaced in-worker background cron with **GitHub Actions scheduled workflows** (`.github/workflows/daily-squad-sync.yml`), running on standard runners with full execution budgets. |

---

## 2. Sync Cadence Architecture

Real-time sync of 245 clubs and 16,000+ players directly from Transfermarkt per page request is neither viable on free-tier edge runtimes nor acceptable for page latency. 

The architecture enforces a tiered sync cadence:

1. **Live Matches (Every 5 seconds):**
   - **Source:** FotMob Live API with MD5 signature authentication.
   - **Cadence:** Polled every 5 seconds on the client when viewing live matches (`LiveAutoRefresher.tsx`), cached for 5s at the edge (`s-maxage=5, stale-while-revalidate=10`).
   - **Cost & Latency:** FotMob JSON endpoints respond in ~80ms with 15KB–60KB payloads.

2. **Daily Automated Squad Reconciliation & Integrity Check (Every 24 hours at 02:00 UTC):**
   - **Runner:** GitHub Actions (`.github/workflows/daily-squad-sync.yml`).
   - **Script:** `scripts/reconcile-all-transfers.ts` followed by `scripts/nightly-integrity-check.ts`.
   - **Operations:**
     - Reconciles player departures, arrivals, and loans across all tracked clubs.
     - Detaches retired players and free agents.
     - Enforces first-team squad bounds for senior squads.
     - Updates `Club.lastSyncedAt` timestamp.
     - Fails loudly with exit code 1 if any contradictory transfers or stale clubs (>48h) are detected.

3. **Club Page Display:**
   - Club headers dynamically display `"Updated <Date>"` based on `Club.lastSyncedAt`.

---

## 3. FotMob Upstream Edge Limits & Safeguards

FotMob provides live match events, timelines, and lineups via authenticated REST endpoints. To ensure zero service disruptions under the Cloudflare Free tier:

1. **Dynamic MD5 Signature Header (`x-mas`):**
   - Every outbound request to FotMob requires a dynamic MD5 hash calculated from the path, query parameters, timestamp, and salt (`THREE_LIONS_SALT`).
   - Pure-JS MD5 (`pureMd5` in `src/lib/fotmob/client.ts`) runs in ~0.5ms on Edge V8 isolates with zero WebCrypto or Node crypto dependency overhead.

2. **Upstream Rate Limiting & Throttling:**
   - FotMob enforces burst rate limiting per origin IP. If thousands of users concurrently request uncached match payloads, FotMob responds with HTTP 429 or connection aborts.
   - **Mitigation:** Edge caching (`revalidate = 5`) ensures that multiple incoming client polls within a 5-second window are served from the Cloudflare edge cache layer. Only 1 upstream request per 5 seconds is forwarded to FotMob per active match.
   - **Timeout Protection:** Outbound FotMob calls use an `AbortController` timeout of 5,000ms. If upstream delays occur, stale cached data or graceful fallback objects are returned rather than failing the route.

---

## 4. Client Polling Behavior & Edge Quota Preservation

The 5-second live refresh rate is strictly scoped to prevent client-side runaway polling and preserve Cloudflare's 100,000 requests/day free tier quota:

1. **Active Mounting Scope:**
   - 5-second polling is **not** global. It is mounted exclusively on:
     - `/matches` (Live Match Center)
     - `/matches/[id]` (Live Match Detail)
     - Homepage (`/`) only when live matches are currently in progress.
   - All other routes (e.g. `/players`, `/clubs`, `/transfers`, `/methodology`) do not poll.

2. **Visibility & Background Tab Suppression:**
   - `LiveAutoRefresher.tsx` listens to the browser `visibilitychange` API.
   - When a user minimizes the browser or switches to another tab (`document.visibilityState === "hidden"`), polling immediately halts.
   - When the user returns to the tab, an immediate single refresh is triggered, and regular interval polling resumes.

3. **Manual Pause Control:**
   - The UI includes an interactive toggle on the Live badge allowing users to manually pause live score refreshes at any time.

4. **Quota Calculation:**
   - On the Free plan (100,000 requests/day), edge-cached routes count toward request limits. Because live scores have an edge cache TTL of 5s, 100 concurrent users generate 12 edge cache misses per minute (1 upstream call every 5 seconds), consuming only ~1,440 upstream requests over a 2-hour match window while effortlessly staying within the 100k daily ceiling.

