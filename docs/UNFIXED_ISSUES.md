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
