# a1score.app — External Dependencies & Unfixed Operational Tasks

**Project:** `a1score.app` ("Money Meets the Pitch")  
**Date:** September 30, 2026  
**Auditor:** Antigravity AI Engineering Team  

---

## 1. Overview

While all 35 engineering and data defects across Phases A through G have been 100% resolved and validated in the application codebase, certain operational, legal, and infrastructure items depend on external platforms or human authorization that cannot be executed solely via code in this repository.

This document details those remaining operational tasks, their current mitigation status in code, and the specific actions required by human administrators.

---

## 2. Inventory of Operational & External Action Items

### Item 1: Cloudflare Dashboard HTTP 301 Edge Redirect (`a1score.pages.dev` &rarr; `a1score.app`)

* **Category:** DNS & Edge Routing Infrastructure
* **Description:** Cloudflare Pages automatically assigns a `*.pages.dev` subdomain (`https://a1score.pages.dev`). While our Next.js edge middleware (`src/middleware.ts`) actively blocks search indexation by responding with `X-Robots-Tag: noindex, nofollow` on any request with a `.pages.dev` host header, an HTTP-level 301/308 permanent redirect at the Cloudflare edge is the gold standard for full domain consolidation.
* **Why Code Cannot Fully Resolve This:** Cloudflare Pages edge DNS and custom domain bindings are managed through the Cloudflare Dashboard / Cloudflare API, which requires administrative credentials.
* **Current Code Mitigation:**
  - `src/middleware.ts` intercepts all requests matching `*.pages.dev` and injects `X-Robots-Tag: noindex, nofollow`.
  - Canonical tags (`<link rel="canonical" href="https://a1score.app/...">`) are emitted on every single page via `src/lib/metadata.ts`.
* **Required Administrative Action:**
  1. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/).
  2. Navigate to **Account &rarr; Pages &rarr; a1score &rarr; Custom Domains**.
  3. Under **Rules &rarr; Redirect Rules** (or Bulk Redirects), add a rule:
     - Match: `hostname eq "a1score.pages.dev"`
     - Action: Dynamic Redirect to `https://a1score.app${http.request.uri.path}` with Status Code `301 (Permanent Redirect)`.

---

### Item 2: Formal Legal Counsel Review of Terms of Service & Privacy Policy

* **Category:** Compliance & Legal Risk
* **Description:** We have authored comprehensive, standard GDPR/CCPA-compliant privacy policy (`/privacy`) and terms of service (`/terms`) pages. These disclaim official affiliation with FIFA, UEFA, the Premier League, Transfermarkt, or FotMob, explain cookie-free operation, and establish clear terms for educational and analytical fair use.
* **Why Code Cannot Fully Resolve This:** A coding assistant cannot substitute for qualified legal counsel licensed in the company's operating jurisdiction.
* **Current Code Mitigation:**
  - Robust privacy and terms documents are live and linked in the site-wide footer (`src/app/privacy/page.tsx` and `src/app/terms/page.tsx`).
  - Clear intellectual property disclaimers specify that all trademarks, club crests, and competition names belong to their respective rights holders.
* **Required Administrative Action:**
  - Have company legal counsel review the text in `src/app/privacy/page.tsx` and `src/app/terms/page.tsx` prior to launching any commercial subscription tier or ad network integration.

---

### Item 3: Upstream Live Match Commentary Coverage (FotMob API Limitation)

* **Category:** Upstream Third-Party Data Depth
* **Description:** Minute-by-minute text commentary is available for major European fixtures (e.g. Premier League, UEFA Champions League, LaLiga top fixtures), but smaller fixtures or lower-tier domestic cup ties occasionally omit text commentary in the upstream FotMob feed.
* **Why Code Cannot Fully Resolve This:** The live commentary array is populated directly by FotMob's data feed. If the upstream provider does not provide human text commentary for a specific match, our client correctly handles this gracefully.
* **Current Code Mitigation:**
  - `MatchTimeline.tsx` and `MatchCenterClient.tsx` render an informative empty state ("No live commentary recorded for this fixture; following live match timeline and scoreboard") instead of crashing or leaving blank space.
* **Required Administrative Action:**
  - None required for MVP. If comprehensive lower-league text commentary becomes a core business requirement in the future, evaluate secondary live text feed providers (e.g., Sportradar or Stats Perform) as an upstream fallback.

---

### Item 4: Continuous Automated Data Verification in CI/CD (GitHub Actions)

* **Category:** DevOps & Automated Testing Pipeline
* **Description:** We created `scripts/verify-data-integrity.ts` and registered `npm run verify:data`, which tests 108 assertions across rosters, valuations, promoted clubs, and medians in 16 seconds.
* **Why Code Cannot Fully Resolve This:** Running the script locally confirms everything passes, but embedding it as a mandatory merge blocker in GitHub requires committing a `.github/workflows/verify.yml` configuration and configuring repository branch protection rules.
* **Current Code Mitigation:**
  - The script is committed and can be invoked anytime with `npm run verify:data`.
  - All 108 assertions currently pass with 0 failures.
* **Recommended Administrative Action:**
  - Add a GitHub Actions workflow to run `npm run verify:data` and `npm run build` on every Pull Request to `main`.

---

## 3. Summary

No blocking code-level issues remain. The codebase is clean, statically typechecked, verified across 108 empirical data assertions, and builds into a production-ready Cloudflare Pages bundle.
