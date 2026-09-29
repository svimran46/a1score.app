# PROJECT BRIEF: a1score.app

## 1. What It Is
A football intelligence platform synthesizing real-time match events with transfer market valuations, squad expenditure analytics, and player valuation histories.  
Live deployment: `https://a1score.pages.dev/`

## 2. Positioning ("Money Meets the Pitch")
Most football platforms either track live scores without financial context, or track player valuations without real-time pitch intelligence. `a1score.app` bridges this gap:
- Starting XI market values and live disparity barometers inside the match center.
- Value vs. Results analytics (tracking underdogs vs. market heavyweights).
- 254k+ historical valuation trajectory curves with career peaks.
- Market movers (biggest risers and fallers).
- Club squad valuation pyramids and commercial transfer ledgers.
- League financial parity and "Points-per-€10M" valuation efficiency metrics.

Every feature must directly reinforce this identity.

## 3. Technology Stack & Runtime Contracts
- **Framework:** Next.js 14 App Router deployed to **Cloudflare Pages Edge Runtime** via `@cloudflare/next-on-pages`.
- **Database & Storage:** Supabase PostgreSQL with Prisma 5 (CLI migrations and ingestion scripts) and `@supabase/supabase-js` (PostgREST HTTP REST API on the Edge). Direct TCP connections (`pg`/`PrismaClient`) are prohibited on edge routes.
- **Edge Deployment Target:** Every dynamic route must declare `export const runtime = "edge"`.
- **Data Engine Architecture:**
  1. **Live Match Operations Engine:** Delivers fixtures, live match events, confirmed starting lineups, pitch coordinates, official match stats, and league standings via edge-authenticated protocol.
  2. **Valuation & Commercial Transfer Engine:** Delivers player market valuations, historical valuation snapshots, career player profiles, and commercial transfer fees.
  3. **Strict Ban on Restricted Paywall APIs:** Completely prohibited. All systems operate independently with edge caching.

## 4. Design System & Visual Guidelines
- **Palette:** Ink black (`#09090b` / `slate-950`) base with warm amber accents (`#f59e0b` dark, `#9A5B00` on light theme for WCAG AA contrast).
- **Live Status:** Pure Red (`#EF4444` / `rose-500`) reserved exclusively for live matches, active stoppage clocks, and red cards. No green for live status.
- **Theme:** Dark by default with zero-FOUC light mode toggle (inline anti-flash script in `src/app/layout.tsx`).
- **Typography & Numeral Stability:** Tabular numerals (`font-variant-numeric: tabular-nums`) must be applied across all currency amounts, scoreboard timers, and statistics to eliminate jitter during 5-second live polling.

## 5. Engineering & Data Integrity Rules
1. **Never Invent Data:** If a metric, event, or valuation is missing, hide the component or render an honest fallback. Never guess or fabricate explanations in user-facing UI.
2. **Lineup Valuation Coverage Guard:** When calculating Starting XI valuations or disparity ratios from confirmed match lineups, always compute and display the coverage ratio (e.g. `"8/11 valued"`). If coverage is incomplete, qualify or suppress the disparity banner to prevent false narratives.
3. **Shared Edge Caching & Polling Guards:**
   - Edge endpoints must declare `Cache-Control: public, s-maxage=5, stale-while-revalidate=10` with ETags.
   - Client polling (`LiveAutoRefresher`) must employ an overlap guard (`inFlightRef`), exponential backoff on error/429, and automatic suspension when `document.visibilityState === "hidden"`.
4. **Data Deduplication & Season Scoping:** League membership must be season-scoped to prevent historical club counts from polluting active competition tables. Validation script (`npm run data:validate`) must support `--dry-run` and `--json`.
5. **Image Delivery on Cloudflare Pages:** Standard Next.js `/_next/image` requires an edge-friendly loader or unoptimized configuration. All `<Image>` tags must provide restrictive `sizes` props and fallback to resilient SVG icons (`Shield`, `User`, `Trophy`) on load error.
6. **SEO Completeness:** Every public entity route must provide dynamic metadata with canonical URLs, OpenGraph/Twitter card images, and JSON-LD structured data. Internal search and utility pages must specify `noindex`.
7. **TypeScript Strictness:** Strict mode is enforced. No untyped `any` leaks.
8. **Small Reviewable PRs:** 1 feature/fix = 1 branch = 1 PR with small, clean commits and verified test runs. Never push directly to `main`.
