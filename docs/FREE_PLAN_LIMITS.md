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
   - **Cadence:** Polled every 5 seconds on client when viewing live matches (`LiveAutoRefresher.tsx`), cached for 5s at the edge.
   - **Cost:** Negligible; FotMob JSON endpoint responds in < 80ms.

2. **Daily Automated Squad Reconciliation & Integrity Check (Every 24 hours at 02:00 UTC):**
   - **Runner:** GitHub Actions (`.github/workflows/daily-squad-sync.yml`).
   - **Script:** `scripts/reconcile-all-transfers.ts` followed by `scripts/nightly-integrity-check.ts`.
   - **Operations:**
     - Reconciles player departures, arrivals, and loans across all tracked clubs.
     - Detaches retired players and free agents.
     - Enforces the 20–35 player bounds for first-team senior squads.
     - Updates `Club.lastSyncedAt` timestamp.
     - Fails loudly with exit code 1 if any contradictory transfers or stale clubs (>48h) are detected.

3. **Club Page Display:**
   - Club headers dynamically display `"Updated <Date>"` based on `Club.lastSyncedAt`.
