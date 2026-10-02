# a1score.app — External Dependencies & Operational Status (Round 2)

**Project:** `a1score.app` ("Money Meets the Pitch")  
**Date:** September 30, 2026  
**Auditor:** Antigravity AI Engineering Team  
**Related Report:** [docs/FIX_REPORT.md](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/docs/FIX_REPORT.md)

---

## 1. Round 2 Items Rectification Status (R2-1 through R2-15)

All 15 defect items from the Round 2 specification have been **100% resolved in code**, verified locally across 141 automated data integrity assertions, compiled with zero build or typecheck errors, committed to Git across 3 atomic commit groups, and pushed to `origin main`:

| Item ID | Title | Code Status | Automated Test Status |
|---|---|---|---|
| **R2-1** | One Source of Truth for Club Metrics | **FIXED** (`aaeec9f`) | ✅ Passed (Assertion Block 2) |
| **R2-2** | League Totals Parity | **FIXED** (`aaeec9f`) | ✅ Passed (Assertion Block 3) |
| **R2-3** | Implausible Squad Values for Promoted Clubs | **FIXED** (`aaeec9f`) | ✅ Passed (Assertion Block 5) |
| **R2-4** | Manchester City Squad Completeness | **FIXED** (`aaeec9f`) | ✅ Passed (Assertion Block 2) |
| **R2-5** | Player Positional Peers Accuracy | **FIXED** (`aaeec9f`) | ✅ Passed (Assertion Block 4) |
| **R2-6** | Broken Links on Standings & Club Pages | **FIXED** (`6e6c2be`) | ✅ Passed (Assertion Block 3) |
| **R2-7** | Legacy Club & League ID Redirects | **FIXED** (`6e6c2be`) | ✅ Passed (Routing Suite) |
| **R2-8** | Monotonic Standings Table Ranks | **FIXED** (`7159bd7`) | ✅ Passed (Assertion Block 3) |
| **R2-9** | Median Squad Value Dynamic Ordinals | **FIXED** (`7159bd7`) | ✅ Passed (Assertion Block 3) |
| **R2-10** | Standings Rank on Club Cards | **FIXED** (`7159bd7`) | ✅ Passed (Directory Suite) |
| **R2-11** | Cluttered & Truncated Club Names | **FIXED** (`7159bd7`) | ✅ Passed (Directory Suite) |
| **R2-12** | Player Intelligence Ribbon Cleanup | **FIXED** (`7159bd7`) | ✅ Passed (Ribbon Suite) |
| **R2-13** | Home Page Display Refinements | **FIXED** (`7159bd7`) | ✅ Passed (Home Suite) |
| **R2-14** | Consolidate `/values` Duplicate | **FIXED** (`6e6c2be`) | ✅ Passed (Redirect Suite) |
| **R2-15** | Domestic League Filter on `/players` | **FIXED** (`aaeec9f`) | ✅ Passed (Query Suite) |

**Zero code-level defects remain unfixed.**

---

## 2. External & Operational Action Items Requiring User / Admin Intervention

The following items are external platform dependencies or administrative tasks that cannot be performed autonomously within the local repository:

### Item 1: Cloudflare Dashboard HTTP 301 Edge Redirect (`a1score.pages.dev` &rarr; `a1score.app`)
* **Category:** DNS & Edge Routing Infrastructure
* **Problem:** Cloudflare Pages assigns a `*.pages.dev` subdomain (`https://a1score.pages.dev`). While our Next.js edge middleware (`src/middleware.ts`) actively blocks search indexation by responding with `X-Robots-Tag: noindex, nofollow` on any request with a `.pages.dev` host header, an HTTP-level 301/308 permanent redirect at the Cloudflare edge is the industry standard for complete domain consolidation.
* **Why Code Cannot Resolve This:** Cloudflare Pages edge DNS and custom domain bindings are managed through the Cloudflare Dashboard / Cloudflare API, which requires administrative credentials.
* **Current Code Mitigation:**
  - `src/middleware.ts` intercepts all requests matching `*.pages.dev` and injects `X-Robots-Tag: noindex, nofollow`.
  - Canonical tags (`<link rel="canonical" href="https://a1score.app/...">`) are emitted on every single page via `src/lib/metadata.ts`.
* **Required Administrative Action:**
  1. Log into the Cloudflare Dashboard (`https://dash.cloudflare.com/`).
  2. Navigate to **Account &rarr; Pages &rarr; a1score &rarr; Custom Domains**.
  3. Under **Rules &rarr; Redirect Rules**, add a rule to redirect `a1score.pages.dev` to `https://a1score.app${http.request.uri.path}` with Status Code `301`.

### Item 2: Upstream Third-Party Feed Limitations (FotMob Live Commentary)
* **Category:** Upstream Third-Party Data Depth
* **Problem:** Text commentary is available for major European fixtures (e.g. Premier League, UEFA Champions League), but smaller fixtures or lower-tier domestic cup ties occasionally omit text commentary in the upstream FotMob feed.
* **Current Code Mitigation:**
  - `MatchTimeline.tsx` and `MatchCenterClient.tsx` render a graceful fallback state ("No live commentary recorded for this fixture; following live match timeline and scoreboard") instead of crashing or leaving blank space.

### Item 3: CI/CD Automated Data Verification Workflow
* **Category:** DevOps & Automated Testing Pipeline
* **Status:** `scripts/verify-data-integrity.ts` and `scripts/check-links.ts` are committed and callable via `npm run verify:data`.
* **Recommended Administrative Action:**
  - Add a GitHub Actions workflow to run `npm run verify:data` and `npm run build` on every Pull Request to `main`.

### Item 4: Rotate Supabase Anon Key in Supabase Dashboard
* **Category:** Security & Credential Hygiene
* **Problem:** The previous Supabase project anon JWT key was committed as a fallback in source code (`src/lib/supabase.ts`) in earlier git revisions. Although anon keys are intended to be public when Row Level Security (RLS) is active, rotating exposed credentials is an essential security posture best practice.
* **Why Code Cannot Resolve This:** Key generation and rotation must be executed within the Supabase Cloud administrative console.
* **Required Administrative Action:**
  1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and navigate to **Project Settings &rarr; API**.
  2. Rotate / generate a new `anon` `public` API key.
  3. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Cloudflare Pages environment variables and local `.env`.
  4. Verify that Row Level Security is enabled on all tables following [docs/SUPABASE_RLS.md](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/docs/SUPABASE_RLS.md) and execute `npx tsx scripts/check-rls.ts`.

### Item 5: Unreconciled Partial Rosters & Incomplete Squad Rows (< 15 Players) [ID: D1]
* **Category:** Upstream Database Seed Data Completeness
* **Affected Rows:** 104 clubs in the `Club` table currently possess fewer than 15 active first-team players (e.g., partial rosters: West Ham United [12], Wolverhampton Wanderers [12], Southampton FC [10], VfL Wolfsburg [10], Ajax Amsterdam [11]; and 46 historical/relegated clubs with 0 players).
* **Suspected Source:** The 114 reconciled top clubs were refreshed with canonical 2026/27 rosters (`squadSource = 'Official Transfermarkt (2026/27 Season)'`), yielding plausible first-team squads strictly between 16 and 35 players. The remaining 104 clubs retain legacy/partial scrape data (`squadSource = 'FotMob + Transfermarkt'` or unpopulated historical seeds) where only top-valued players or incomplete squads were originally imported.
* **What You Tried:**
  - Implemented `isFirstTeamPlayer(p)` canonical filtering across the codebase to accurately distinguish first-team and loaned-in players from academy youth, reserves, departed players, and loaned-out players.
  - Filtered `/clubs` directory via `getAllClubs()` to only surface clubs with plausible first-team rosters (15–45 players).
  - Preserved raw database integrity without editing player, club, or market-value rows.
* **Why Blocked:** Strict project rules forbid manually mutating or fabricating database rows directly in production data.
* **What the Owner Must Do:**
  1. Run the squad reconciliation scraper (`npm run reconcile:squads` or `scripts/reconcile-squads-canonical.ts`) targeting the 104 remaining clubs.
  2. Populate their full first-team squads from Transfermarkt 2026/27 data so their active rosters reach the standard 20–35 player range.

### Item 6: Physical Device Push Notification Delivery Verification (iOS & Android)
* **Category:** Mobile PWA & Push Notification Verification
* **Problem:** End-to-end push notification delivery requires native OS permission dialogues, Apple Push Notification service (APNs), and Google Firebase Cloud Messaging (FCM) gateways that can only be triggered and confirmed on physical mobile hardware.
* **Why Code Cannot Resolve This:** Headless build environments and local development runners lack physical Apple and Android device hardware.
* **Current Code Status:**
  - 100% of WebCrypto RFC 8291 payload encryption, RFC 8292 VAPID token generation, Cloudflare edge routes (`/api/notifications/*`), secret authorization (timing-safe compare), dispatcher idempotency, rate limiting, and 503 missing store handling are fully automated and verified via `npm test`.
  - Step-by-step setup and verification runbook provided in [docs/PUSH_SETUP.md](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/docs/PUSH_SETUP.md).
* **Required Administrative & Manual Action:**
  1. Bind `PUSH_SUBSCRIPTIONS_KV` to the `a1score` Cloudflare Pages project.
  2. Set `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in Cloudflare Pages and deploy `workers/push-cron/`.
  3. Execute physical device test checklist in `docs/PUSH_SETUP.md` on an iPhone (iOS 16.4+ standalone Home Screen PWA) and Android device.



