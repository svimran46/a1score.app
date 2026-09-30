# a1score.app — Phase 1: Security & Build Integrity Report

**Execution Date:** October 1, 2026  
**Auditor / Agent:** Antigravity AI  
**Repository Branch:** `main` (commits `af2a27e` through `e7a9260`)  
**Targets Covered:** Findings **S1, S2, S3, B1/S4, B2, B9, S5**

---

## 1. Executive Summary

In this phase, all critical security vulnerabilities (P0) and build integrity defects (P1) were resolved in code, validated with automated tests, and committed atomically to Git. The project now builds with strict TypeScript typechecking, automated ESLint checks on build, zero ignore flags, and no runtime dead-weight dependencies.

---

## 2. Detailed Findings & Fixes

### 🛡️ S1: Open Image Proxy Hardening (SSRF Mitigation)
* **File:** [`src/app/img/asset/[encoded]/route.ts`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/src/app/img/asset/%5Bencoded%5D/route.ts), [`src/lib/image-sanitize.ts`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/src/lib/image-sanitize.ts)
* **Problem:** Any base64-encoded `https://...` URL was fetched server-side without validation, exposing the application to SSRF, cloud metadata access, and arbitrary content injection.
* **Resolution:**
  - Implemented `ALLOWED_IMAGE_HOSTS` allowlist (`images.fotmob.com`, `img.a.transfermarkt.technology`, `www.transfermarkt.co.uk`, etc.).
  - Added strict URL validation rejecting non-HTTPS, credentials/userinfo, IPv4 and IPv6 literals, and loopback/private/internal hostnames.
  - Implemented manual redirect tracking (`redirect: "manual"`) validating every hop against the allowlist.
  - Added `AbortSignal.timeout(5000)` and enforced a 2 MB streaming body limit.
  - Enforced upstream Content-Type validation (must start with `image/` and cannot be `image/svg+xml`).
  - Added response headers: `X-Content-Type-Options: nosniff` and `Content-Security-Policy: default-src 'none'; sandbox`.
  - Added 9 unit tests in [`tests/image-proxy.test.ts`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/tests/image-proxy.test.ts).
* **Commit:** `af2a27e fix(S1): harden image asset proxy with hostname allowlist and SSRF mitigations`

---

### 🔑 S2: Supabase Credentials Fallback & RLS Verification
* **File:** [`src/lib/supabase.ts`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/src/lib/supabase.ts), [`docs/SUPABASE_RLS.md`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/docs/SUPABASE_RLS.md), [`scripts/check-rls.ts`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/scripts/check-rls.ts)
* **Problem:** Hardcoded fallback URL and anon JWT in source code silently pointed production builds to a single project and exposed the anon key in public Git history.
* **Resolution:**
  - Removed all hardcoded fallbacks from `src/lib/supabase.ts`. In production (`process.env.NODE_ENV === "production"`), missing credentials throw an immediate fatal error; in dev, a descriptive warning is logged.
  - Created [`docs/SUPABASE_RLS.md`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/docs/SUPABASE_RLS.md) detailing exact SQL to enable RLS and set public read-only (`SELECT`) policies across all 7 application tables (`Club`, `Player`, `League`, `Transfer`, `MarketValueHistory`, `SeasonStats`, `Injury`).
  - Created [`scripts/check-rls.ts`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/scripts/check-rls.ts) and wired `npm run check:rls`. Execution verified that all tables actively deny `INSERT`, `UPDATE`, and `DELETE` under the anon key.
  - Logged key rotation requirement as Item 4 in [`docs/UNFIXED_ISSUES.md`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/docs/UNFIXED_ISSUES.md).
* **Commit:** `2870472 fix(S2): remove hardcoded supabase credentials fallback, add RLS documentation and validation probe`

---

### ⚙️ S3: Build Integrity & React Hook Ordering
* **File:** [`next.config.mjs`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/next.config.mjs), [`src/components/MarketValueChart.tsx`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/src/components/MarketValueChart.tsx)
* **Problem:** `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` masked underlying code errors during build.
* **Resolution:**
  - Removed both ignore flags from `next.config.mjs`.
  - Installed `eslint` and `eslint-config-next` into `devDependencies`.
  - Fixed a React Rules-of-Hooks violation in `src/components/MarketValueChart.tsx` where `ageAtPeak = useMemo(...)` was called conditionally after an early `if (fullTimeline.length === 0) return ...`.
  - Fixed TypeScript DOM `BodyInit` type mismatch in the asset route.
* **Commit:** `cd54764 fix(S3): remove ignoreBuildErrors and ignoreDuringBuilds, fix MarketValueChart hook order and route type`

---

### 📦 B1 / S4: Prisma & PG Removal from Runtime Dependencies
* **File:** [`src/lib/prisma.ts`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/src/lib/prisma.ts) (deleted), [`package.json`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/package.json)
* **Problem:** Prisma and `pg` with `rejectUnauthorized: false` (S4) were packaged in production dependencies despite the application using Supabase REST API exclusively. `prisma generate` also slowed down builds.
* **Resolution:**
  - Verified by grep that zero application components or routes import `src/lib/prisma.ts`.
  - Deleted `src/lib/prisma.ts`.
  - Removed `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `@types/pg` from production `dependencies`.
  - Removed `prisma generate &&` from `build` script and removed `postinstall` hook.
  - Decoupled developer scripts in `scripts/` so they instantiate client dependencies locally without referencing application runtime paths.
* **Commit:** `848076b fix(B1): remove prisma client and pg from runtime dependencies, remove src/lib/prisma.ts`

---

### ☁️ B2: Standardize on Cloudflare next-on-pages Adapter
* **File:** [`package.json`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/package.json), [`README.md`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/README.md)
* **Problem:** Two competing adapters (`@cloudflare/next-on-pages` and `@opennextjs/cloudflare`) were installed, and documentation still referred to Vercel.
* **Resolution:**
  - Removed `@opennextjs/cloudflare` from `devDependencies`.
  - Added `"pages:build": "npx @cloudflare/next-on-pages"` script targeting `.vercel/output/static` as configured in `wrangler.toml`.
  - Completely updated `README.md` to document the actual stack: Cloudflare Pages edge runtime, Supabase REST API, FotMob live feeds, and Transfermarkt rosters.
* **Commit:** `e849bdc fix(B2): standardize on cloudflare next-on-pages adapter and update README`

---

### 🧹 B9: Clean Remote Patterns & Document Environment Variables
* **File:** [`next.config.mjs`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/next.config.mjs), [`.env.example`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/.env.example)
* **Problem:** Stale configurations for `media.api-sports.io`, `images.unsplash.com`, and `API_FOOTBALL_KEY` existed in configs.
* **Resolution:**
  - Stripped obsolete `remotePatterns` from `next.config.mjs`.
  - Documented all 7 active environment variables in `.env.example`:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SITE_URL` / `NEXT_PUBLIC_SITE_URL`
    - `NEXT_PUBLIC_APP_VERSION`
    - `NEXT_PUBLIC_CF_IMAGE_RESIZING`
    - `NEXT_PUBLIC_R2_URL`
    - `DATABASE_URL` / `DIRECT_URL` (local scripts)
* **Commit:** `8eaa4a6 fix(B9): clean remotePatterns and document environment variables in .env.example`

---

### ⏱️ S5: Rate Limiting Hardening & Cloudflare WAF Guidance
* **File:** [`src/lib/rate-limit.ts`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/src/lib/rate-limit.ts), [`docs/CLOUDFLARE_RATE_LIMITS.md`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/docs/CLOUDFLARE_RATE_LIMITS.md), [`tests/pure-functions.test.ts`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/tests/pure-functions.test.ts)
* **Problem:** When no client IP could be resolved, all unknown clients were lumped into a single `"anonymous"` bucket, allowing one client to exhaust the rate limit for all users. In-memory limiting is also per-isolate on Cloudflare.
* **Resolution:**
  - Updated `getClientIP()` to partition unidentified callers via request telemetry fingerprints (`user-agent` + `accept-language`) with `unknown_` prefix rather than a shared bucket.
  - Enforced a strict 10 req/min cap for any unverified client key.
  - Created [`docs/CLOUDFLARE_RATE_LIMITS.md`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/docs/CLOUDFLARE_RATE_LIMITS.md) specifying recommended Cloudflare WAF rate limiting rules for `/api/*` (60 req/min) and `/img/asset/*` (120 req/min).
  - Added unit test coverage for `getClientIP` and partitioned rate limits.
* **Commit:** `2bf59a7 fix(S5): partition unknown clients, enforce stricter limits, and document Cloudflare rate limiting rules`

---

## 3. Global Verification Evidence

### 1. `npx tsc --noEmit`
```text
Exit code: 0
(Zero TypeScript errors across all source, components, routes, and scripts)
```

### 2. `npm run lint`
```text
> a1score.app@0.1.0 lint
> next lint

✔ No ESLint warnings or errors
Exit code: 0
```

### 3. `npm test`
```text
> a1score.app@0.1.0 test
> npm run test:unit

> a1score.app@0.1.0 test:unit
> tsx --test tests/pure-functions.test.ts tests/positions.test.ts tests/image-proxy.test.ts

TAP version 13
1..19
# tests 19
# suites 0
# pass 19
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1286.4758
Exit code: 0
```

### 4. `npm run build`
```text
> a1score.app@0.1.0 build
> next build

  ▲ Next.js 14.2.35
  - Environments: .env

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
 ⚠ Using edge runtime on a page currently disables static generation for that page
   Generating static pages (3/3)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ƒ /                                    1.92 kB         115 kB
├ ○ /_not-found                          151 B          87.7 kB
├ ƒ /api/clubs/[id]                      0 B                0 B
├ ƒ /api/health                          0 B                0 B
├ ƒ /api/leagues                         0 B                0 B
├ ƒ /api/matches                         0 B                0 B
├ ƒ /api/matches/[id]                    0 B                0 B
├ ƒ /api/players/[id]                    0 B                0 B
├ ƒ /api/players/most-valuable           0 B                0 B
├ ƒ /api/players/search                  0 B                0 B
├ ƒ /clubs                               5.27 kB         115 kB
├ ƒ /clubs/[id]                          10.7 kB         121 kB
├ ƒ /img/asset/[encoded]                 0 B                0 B
├ ƒ /img/club/[id]                       0 B                0 B
├ ƒ /img/league/[id]                     0 B                0 B
├ ƒ /img/player/[id]                     0 B                0 B
├ ƒ /leagues                             3.4 kB          113 kB
├ ƒ /leagues/[id]                        7.99 kB         118 kB
├ ƒ /matches                             3.38 kB         113 kB
├ ƒ /matches/[id]                        15.9 kB         126 kB
├ ƒ /methodology                         151 B          87.7 kB
├ ƒ /players                             4.53 kB         118 kB
├ ƒ /players/[slug]                      110 kB          220 kB
├ ƒ /transfers                           1.18 kB         111 kB
└ ƒ /values                              151 B          87.7 kB
+ First Load JS shared by all            87.6 kB
ƒ Middleware                             26.9 kB

Exit code: 0
```

---

## 4. Git Commit History for Phase 1

```text
e7a9260 chore: update package-lock.json with eslint and cloudflare adapter changes
2bf59a7 fix(S5): partition unknown clients, enforce stricter limits, and document Cloudflare rate limiting rules
8eaa4a6 fix(B9): clean remotePatterns and document environment variables in .env.example
e849bdc fix(B2): standardize on cloudflare next-on-pages adapter and update README
848076b fix(B1): remove prisma client and pg from runtime dependencies, remove src/lib/prisma.ts
cd54764 fix(S3): remove ignoreBuildErrors and ignoreDuringBuilds, fix MarketValueChart hook order and route type
2870472 fix(S2): remove hardcoded supabase credentials fallback, add RLS documentation and validation probe
af2a27e fix(S1): harden image asset proxy with hostname allowlist and SSRF mitigations
```
