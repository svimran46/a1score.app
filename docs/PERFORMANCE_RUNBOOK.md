# a1score — Performance & Core Web Vitals Runbook

This runbook documents the architecture, collection mechanisms, metric thresholds, and diagnostic procedures for monitoring and optimizing Real User Monitoring (RUM) Core Web Vitals and Lighthouse budgets across a1score.app.

---

## 1. Monitored Core Web Vitals

We collect field telemetry in aggregate via Google's standard `web-vitals` library directly from user browsers without collecting any Personally Identifiable Information (Zero-PII).

| Metric | Target (Good) | Needs Improvement | Poor | Description in a1score |
|---|---|---|---|---|
| **LCP** (Largest Contentful Paint) | **&le; 2.5s** | 2.5s – 4.0s | &gt; 4.0s | Time until main player card, match scorecard, or hero banner is fully rendered. |
| **INP** (Interaction to Next Paint) | **&le; 200ms** | 200ms – 500ms | &gt; 500ms | Latency of user actions: clicking tabs, toggle watchlist, search triggers, or compare rows. |
| **CLS** (Cumulative Layout Shift) | **&le; 0.1** | 0.1 – 0.25 | &gt; 0.25 | Unexpected movement of visible elements during page load (fonts, images, ad containers). |
| **FCP** (First Contentful Paint) | **&le; 1.8s** | 1.8s – 3.0s | &gt; 3.0s | First time any text or UI skeleton appears on screen. |
| **TTFB** (Time to First Byte) | **&le; 800ms** | 800ms – 1.8s | &gt; 1.8s | Edge response time from Cloudflare edge nodes. |

---

## 2. Telemetry Architecture

1. **Client Collection (`src/lib/analytics/web-vitals.ts`):**
   - Uses `web-vitals` v4 (`onLCP`, `onINP`, `onCLS`, `onFCP`, `onTTFB`).
   - Runs non-blockingly after the main thread is idle.
   - Values are rounded to milliseconds (and CLS to integer parts &times; 1000).
2. **Transport (`/api/analytics/vitals`):**
   - Transmitted asynchronously via `navigator.sendBeacon` (or `fetch` with `keepalive: true`), ensuring zero delay on page unload or navigation.
   - The endpoint drops client IP addresses, device identifiers, and request cookies.
3. **Aggregate Storage:**
   - In production, metrics feed into Cloudflare Analytics Engine or edge time-series tables for 75th percentile (p75) compliance evaluations.

---

## 3. How to Read & Analyze Field Telemetry

### Evaluating Metric Distributions (p75 Rule)
Core Web Vitals are evaluated against the **75th percentile (p75)** of page views across both mobile and desktop devices:
- If 75% or more of user page loads experience LCP &le; 2.5s, the route is considered **Healthy (Good)**.
- If more than 25% of visits exceed 2.5s, an incident must be logged and resolved.

### Route-Level Breakdown
Field metrics are tagged with normalized paths (`path`):
- `/` — Homepage fixture feed and valuation leaders.
- `/players/[slug]` — Player detail profile and interactive valuation history chart.
- `/clubs/[id]` — Club squad roster and squad total valuation.
- `/matches/[id]` — Live match center, lineups pitch view, and events timeline.
- `/compare` — Multi-player comparative valuation graph and facts table.
- `/news` — Football editorial headlines and transfer rumors.

---

## 4. Diagnostic & Triage Procedures

### If LCP Regresses (&gt; 2.5s):
1. **Check Hero Element Priority:**
   - Verify that the largest element above the fold (e.g. player portrait, club crest, or scorecard logo) has `fetchpriority="high"` and Next.js `priority={true}`.
2. **Verify Font Display Swap:**
   - Ensure `next/font/google` retains `display: "swap"` in `src/app/layout.tsx`.
3. **Audit Edge Cache Hit Rates:**
   - Verify that upstream responses from FotMob and Transfermarkt are cached via Next.js ISR and LRU memory cache, preventing SSR origin delays.
4. **Inspect Analytics & Script Deferral:**
   - Verify that third-party scripts (Cloudflare Analytics, Ad scripts) remain deferred until after the first user interaction or idle callback.

### If CLS Regresses (&gt; 0.1):
1. **Audit Image Dimensions:**
   - Confirm that all `EntityImage` components have explicit `width` and `height` properties or parent aspect-ratio placeholders.
2. **Verify Ad Slot Reserved Heights:**
   - Confirm that any rendered `<AdSlot />` container enforces strict `minHeightPx` (`min-h-[250px]` or `min-h-[90px]`) and is never injected without pre-allocated container dimensions.
3. **Check Consent Banner Position:**
   - Confirm `<ConsentBanner />` is positioned as `fixed` overlay, never pushing or reflowing sibling DOM nodes in document flow.

### If INP Regresses (&gt; 200ms):
1. **Audit React State Transitions:**
   - Heavy client-side filtering (e.g. news category filter, market values sorting) should use `React.useTransition()` (`startTransition`).
2. **Review Recharts Lazy Loading:**
   - Verify that Recharts components (`CompareValuationChart`, `ValuationHistoryChart`) are dynamically imported with `next/dynamic` (`ssr: false`).
3. **Passive Event Listeners:**
   - Confirm scroll and touch handlers pass `{ passive: true }`.

---

## 5. Automated CI Guardrails

Run these automated checks before any release:

```bash
# 1. Check bundle sizes and static asset limits against perf-budget.json
npm run perf:budget

# 2. Verify zero hardcoded hex colors
npm run lint:colors

# 3. Execute unit and integrity tests
npm test

# 4. Run local mobile Lighthouse CI emulation
npm run lhci:mobile
```
