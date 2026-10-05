# Data Freshness & Sync Policy

## 1. Overview & Reality Baseline

a1score synthesizes two core intelligence domains:
1. **Match Pitch Intelligence** (Fixtures, confirmed lineups, live score progression, event timelines, league tables) sourced via FotMob.
2. **Financial Market Intelligence** (Player market valuations, 12-month value delta, transfer records, squad expenditure totals) sourced via Transfermarkt and persisted in Supabase PostgreSQL.

To maintain trust with users and eliminate false or exaggerated performance claims, the platform adheres strictly to measurable, real refresh rates and accurate terminology.

---

## 2. Refresh Architecture & Cadence

| Domain | Source | Real Refresh Cadence | Client Behavior | Edge / Server Caching | User-Facing Labeling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **In-Play Matches** | FotMob | **45-second polling** when in-progress (`useMatchSync`) | Tab visibility-aware (polling pauses when tab hidden; instant sync on tab foreground). | Edge TTL: `s-maxage=5, stale-while-revalidate=10`. Upstream timeout 5s. | "Updated HH:MM:SS" with note: *"Match events and scores may be 1 to 2 minutes behind the live broadcast."* |
| **Upcoming / Finished Matches** | FotMob | Static after completion / on-demand reload | Single fetch on load or day navigation. | Revalidated on request; edge cached. | "Full time", Kickoff time, or countdown. |
| **Player Market Valuations** | Transfermarkt | **Periodic market update cycles** (transfer window adjustments, quarterly updates) | No live polling. Read from database / edge cache. | 1h edge cache (`s-maxage=3600, stale-while-revalidate=3600`) with immutable snapshot histories. | **"Value update"** or **"Market valuation update"**. NEVER "live" or "real-time". |
| **Club Squad Totals** | Synthesized | Computed sum of active first-team player valuations. | Recomputed when player valuation updates occur. | 1h ISR edge cache. | "Squad market value", "Value update". |
| **News Feed** | Syndicated RSS (Sky, Guardian, BBC, Independent) | **5-minute ISR cache** (`revalidate: 300`) | Cached at edge, served statically. | 300s TTL. | "Updated Xm ago" / Article publication timestamp. |
| **System Health** | Internal (`/api/health`) | **15-minute scheduled probe** (Cloudflare Worker cron) + on-demand `/api/health` | Cached edge status. | Edge TTL 60s. | "Automated health monitoring", component status badges. |

---

## 3. Forbidden Claims & Permitted Terminology

### Forbidden Phrases
- ❌ **"real-time" / "realtime"**: Inaccurate. Upstream sports data feeds have unavoidable distribution and telemetry latencies (typically 60–120 seconds behind broadcast television), and valuations update in seasonal batches.
- ❌ **"live valuations" / "live market values"**: Valuations do NOT trade on a live tick-by-tick exchange. Transfermarkt publishes periodic review updates.
- ❌ **"every 5s" / "live updates every 5s"**: The client poll interval for in-progress matches is 45 seconds (to safeguard browser battery, network bandwidth, and free-tier edge limits), not 5 seconds.
- ❌ **"instant"** (for data/search): Data fetches require network hops; local search queries traverse indexed records.

### Permitted Phrases
- ✅ **"Live"**: Permitted **only** as a match state indicator for an active in-progress football match (e.g., `isLive`, "Live", "Live matches in progress").
- ✅ **"Value update" / "Market valuation update"**: The mandatory phrasing for any player or club valuation change.
- ✅ **"Updated HH:MM:SS"**: Computed and rendered strictly from the actual timestamp of the latest successful data fetch.
- ✅ **"~1-2m behind broadcast"**: Explicitly discloses provider latency relative to live cable/satellite transmission.
- ✅ **"In-play" / "Match events" / "Confirmed lineups"**: Honest descriptions of pitch intelligence.

---

## 4. Copy Claims Audit Log (FIX-A)

The table below catalogs every hit inspected during the repository audit and records the final verdict.

| File | Line | Target Pattern | Original Text | Verdict & Action |
| :--- | :--- | :--- | :--- | :--- |
| `src/app/layout.tsx` | 15 | `real-time` | `"Football platform combining real-time scores with player market valuations..."` | **REPLACED:** `"Football platform combining match fixtures and scores with player market valuation updates..."` |
| `src/app/layout.tsx` | 23 | `live scores` | `"Football platform: live scores, player market valuations, and club records."` | **REPLACED:** `"Football platform: match scores, player market valuation updates, and club records."` |
| `src/app/layout.tsx` | 37 | `live scores` | `"Football platform: live scores, player market valuations, and club records."` | **REPLACED:** `"Football platform: match scores, player market valuation updates, and club records."` |
| `src/app/matches/page.tsx` | 5 | `every 5s` | `export const revalidate = 5; // Ultra-fresh live scores every 5s` | **REPLACED:** Clarified edge cache TTL `// Edge cache TTL 5s with stale-while-revalidate`. |
| `src/app/matches/page.tsx` | 9 | `real-time` | `title: "Live Matches — Real-Time Scores, Lineups & Squad Values"` | **REPLACED:** `title: "Matches — Scores, Lineups & Squad Values"`. |
| `src/app/matches/page.tsx` | 11 | `real-time` | `"Live football scores, real-time match events, confirmed tactical lineups..."` | **REPLACED:** `"Match scores, in-play timeline events, confirmed tactical lineups..."` |
| `src/app/matches/opengraph-image.tsx` | 5 | `real-time` | `export const alt = "Live Matches — Real-Time Scores & Squad Values";` | **REPLACED:** `export const alt = "Matches — Scores, Lineups & Squad Values";` |
| `src/app/matches/opengraph-image.tsx` | 57 | `live scores` | `Live scores & squad values` | **REPLACED:** `Match scores & squad values`. |
| `src/app/matches/opengraph-image.tsx` | 80 | `real-time` | `"Real-time match events, confirmed starting lineups..."` | **REPLACED:** `"In-play match events, confirmed starting lineups..."` |
| `src/app/matches/[id]/page.tsx` | 7 | `every 5s` | `export const revalidate = 5; // Ultra-fresh match details every 5s` | **REPLACED:** Clarified edge cache TTL `// Edge cache TTL 5s with stale-while-revalidate`. |
| `src/app/matches/[id]/opengraph-image.tsx` | 366 | `real-time` | `FotMob real-time match stats & Transfermarkt financial data` | **REPLACED:** `FotMob match statistics & Transfermarkt valuation data`. |
| `src/app/opengraph-image.tsx` | 84 | `real-time` | `"Real-time match events synthesized with Transfermarkt player valuations..."` | **REPLACED:** `"Match events synthesized with Transfermarkt player market valuations..."` |
| `src/app/page.tsx` | 196 | `live scores` | `<h1 className="sr-only">a1score — Football Market Values, Live Scores & Club Records</h1>` | **REPLACED:** `<h1 className="sr-only">a1score — Football Market Values, Match Scores & Club Records</h1>` |
| `src/app/status/page.tsx` | 42 | `real-time` | `"Real-time health monitoring of upstream APIs..."` | **REPLACED:** `"Automated health monitoring of upstream APIs..."` |
| `src/app/status/StatusDashboard.tsx` | 94 | `real-time` | `"Direct upstream proxy providing real-time scores, lineups..."` | **REPLACED:** `"Direct upstream proxy providing match scores, lineups..."` |
| `src/app/methodology/page.tsx` | 10 | `real-time` | `"...squad analytics, and real-time match operations."` | **REPLACED:** `"...squad analytics, and live match center operations."` |
| `src/app/methodology/page.tsx` | 26 | `live scores` | `"Most football platforms present either live scores or financial valuations..."` | **REPLACED:** `"Most football platforms present either match fixtures or financial valuations..."` |
| `src/app/methodology/page.tsx` | 78 | `real-time` | `"Live fixtures, in-play scores, confirmed tactical lineups... real-time match events..."` | **REPLACED:** `"...confirmed tactical lineups... in-match timeline events..."` |
| `src/app/methodology/page.tsx` | 83 | `live scores` | `"Live scores and match clocks synchronize efficiently..."` | **REPLACED:** `"Match scores and clocks synchronize efficiently with shared edge caching (5s edge TTL) and 45s visibility-aware polling..."` |
| `src/app/methodology/page.tsx` | 158 | `5s` | `"5 Seconds: Live Match Intelligence... Actively polled in Match Center during live matches via LiveAutoRefresher."` | **REPLACED:** `"45 Seconds (5s Edge): In-Play Match Intelligence... In-play matches sync every 45s on active tabs with 5s edge cache TTL. Scores may be 1–2 minutes behind broadcast."` |
| `src/components/CommandPalette.tsx` | 339 | `instant` | `No instant results found for "{query}"` | **REPLACED:** `No results found for "{query}"`. |
| `src/components/Footer.tsx` | 50 | `real-time` | `"Football platform synthesizing real-time match events with player market valuations..."` | **REPLACED:** `"Football platform synthesizing match events with player market valuation updates..."` |
| `src/components/match-tabs/FactsTab.tsx` | 95 | `live updates` | `Match Timeline {isLive && • Live Updates}` | **REPLACED:** `Match Timeline {isLive && • Live (45s sync)}`. |
| `src/components/LiveAutoRefresher.tsx` | 8, 15 | `5s` | `intervalMs = 5000; // default 5000 (5s)` | **REPLACED:** `intervalMs = 45000; // default 45000 (45s sync)` |
| `src/components/MatchScorecard.tsx` | 240+ | `live updates` | Live state rendering only showed minute or "Feed active" | **ADDED:** Real fetch timestamp `Updated HH:MM:SS` or `Feed active (45s sync)` + broadcast delay disclaimer `~1-2m behind broadcast` with tooltip. |
| `src/lib/transfermarkt/client.ts` | 5 | `real-time` | `Fetches real-time, up-to-date football intelligence directly from Transfermarkt` | **REPLACED:** `Fetches up-to-date football market intelligence directly from Transfermarkt`. |
| `src/app/api/players/most-valuable/route.ts` | 67 | `real-time` | `// Cache at edge 1h... valuations update twice per season, not real-time` | **KEPT (Allowlisted):** Code comment accurately refuting real-time valuations. |
| `src/app/img/club/[id]/route.ts` | 42 | `instant` | `// 1. Instant in-memory resolution from FOTMOB_TEAM_MAPPINGS (0ms)` | **KEPT (Allowlisted):** Technical code comment describing 0ms CPU hash map lookup. |
| `src/lib/cache.ts` | 116 | `instant` | `// 1. Check L1 in-memory cache first (instant 0ms)` | **KEPT (Allowlisted):** Technical code comment describing local memory map lookup. |
| `src/app/privacy/page.tsx` | 94 | `instant` | `revoke notification access instantly through your browser settings` | **KEPT (Allowlisted):** Accurate description of browser OS permission toggle. |
| `src/lib/fotmob/client.ts` | 6, 341 | `live scores`, `5s` | `fotmobFetch<any>(path, 5); // 5s cache` | **KEPT (Allowlisted):** Technical code comments defining internal 5s edge fetch TTL. |
| `README.md` | 29 | `real-time` | `Real-time scores, timeline events...` | **REPLACED:** `Match scores, timeline events, confirmed lineups...` |
| `DESIGN.md` | 4 | `real-time` | `...synthesizing real-time match events with player market valuations...` | **REPLACED:** `...synthesizing match events with player market valuations...` |
