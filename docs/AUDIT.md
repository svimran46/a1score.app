# Repository Audit: a1score.app

**Date:** 2026-09-29  
**Branch:** `chore/audit`  
**Deployment Target:** Cloudflare Pages (`https://a1score.pages.dev`)  

---

## 1. System, Framework & Dependencies

* **Framework:** Next.js `14.2.35` (App Router)
* **Runtime:** Node.js `v22.14.0` (Build & Ingestion scripts); Cloudflare Pages Edge Workers for live web serving.
* **Package Manager:** `npm` (Lockfile: `package-lock.json` v3)
* **Core Production Dependencies:**
  * `react`: `18.3.1` / `react-dom`: `18.3.1`
  * `@prisma/client`: `5.22.0`
  * `@prisma/adapter-pg`: `5.22.0` (Postgres driver adapter for Prisma)
  * `pg`: `^8.23.0` (node-postgres connection pool for scripts)
  * `@supabase/supabase-js`: `^2.117.2` (PostgREST HTTP client used for Cloudflare Edge runtime database queries)
  * `clsx`: `^2.1.1` & `tailwind-merge`: `^2.5.4` (Class styling utilities)
  * `lucide-react`: `^0.453.0` (UI icons)
  * `recharts`: `^2.13.0` (Client charting)
  * `csv-parse`: `^5.5.6` (CSV data pipeline ingestion)
* **Development & Build Dependencies:**
  * `@cloudflare/next-on-pages`: `^1.13.16` (Translates Next.js build output into Cloudflare Pages `_worker.js`)
  * `@opennextjs/cloudflare`: `^1.20.6`
  * `wrangler`: `^4.141.0` (Cloudflare CLI)
  * `prisma`: `5.22.0`
  * `tailwindcss`: `^3.4.14` & `autoprefixer`: `^10.4.20`
  * `tsx`: `^4.19.1` (TypeScript script execution)
  * `typescript`: `^5.6.3`

---

## 2. Route Map & Runtime Architecture

All dynamic pages and API routes enforce `export const runtime = "edge"`. Next.js static and edge ISR routes compile via `@cloudflare/next-on-pages` into `.vercel/output/static` with an edge functions bundle.

| Route | Type | Runtime | Cache / Revalidate | Metadata Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` (`src/app/page.tsx`) | Server Component | `edge` | `revalidate = 30` (ISR) | Inherits Root (`layout.tsx`) |
| `/matches` (`src/app/matches/page.tsx`) | Server Component | `edge` | `revalidate = 5` (ISR) | Inherits Root (`layout.tsx`) |
| `/matches/[id]` (`src/app/matches/[id]/page.tsx`) | Server Component | `edge` | `revalidate = 5` (ISR) | Inherits Root (`layout.tsx`) |
| `/players` (`src/app/players/page.tsx`) | Server Component | `edge` | `revalidate = 3600` (ISR) | Inherits Root (`layout.tsx`) |
| `/players/[slug]` (`src/app/players/[slug]/page.tsx`) | Server Component | `edge` | `revalidate = 3600` (ISR) | Inherits Root (`layout.tsx`) |
| `/clubs` (`src/app/clubs/page.tsx`) | Server Component | `edge` | `revalidate = 3600` (ISR) | Inherits Root (`layout.tsx`) |
| `/clubs/[id]` (`src/app/clubs/[id]/page.tsx`) | Server Component | `edge` | `revalidate = 3600` (ISR) | Inherits Root (`layout.tsx`) |
| `/leagues` (`src/app/leagues/page.tsx`) | Server Component | `edge` | `revalidate = 3600` (ISR) | Inherits Root (`layout.tsx`) |
| `/leagues/[id]` (`src/app/leagues/[id]/page.tsx`) | Server Component | `edge` | `revalidate = 3600` (ISR) | Inherits Root (`layout.tsx`) |
| `/search` (`src/app/search/page.tsx`) | Server Component | `edge` | Dynamic (`searchParams`) | Inherits Root (`layout.tsx`) |
| `/_not-found` | Static Page | `nodejs` | Prerendered | Static |
| `/api/matches` (`src/app/api/matches/route.ts`) | Route Handler | `edge` | `s-maxage=5, stale-while-revalidate=5` | N/A |
| `/api/matches/[id]` (`src/app/api/matches/[id]/route.ts`) | Route Handler | `edge` | `s-maxage=5, stale-while-revalidate=5` | N/A |
| `/api/players/[id]` (`src/app/api/players/[id]/route.ts`) | Route Handler | `edge` | Dynamic | N/A |
| `/api/players/most-valuable` (`src/app/api/players/most-valuable/route.ts`)| Route Handler | `edge` | `s-maxage=3600, stale-while-revalidate=86400`| N/A |
| `/api/players/search` (`src/app/api/players/search/route.ts`) | Route Handler | `edge` | Dynamic | N/A |
| `/api/clubs/[id]` (`src/app/api/clubs/[id]/route.ts`) | Route Handler | `edge` | Dynamic | N/A |
| `/api/leagues` (`src/app/api/leagues/route.ts`) | Route Handler | `edge` | Dynamic | N/A |

---

## 3. Data Model & Database Architecture

Managed via **Prisma 5.22.0** on **Supabase PostgreSQL** (`aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`).

```
┌──────────────────┐       1:N       ┌──────────────────────┐
│      League      │ ──────────────< │         Club         │
└──────────────────┘                 └──────────────────────┘
                                                 │ 1:N
                                                 v
┌──────────────────┐       1:N       ┌──────────────────────┐
│  SeasonStats     │ >────────────── │        Player        │
└──────────────────┘                 └──────────────────────┘
                                       │ 1:N        │ 1:N
                                       v            v
                       ┌──────────────────────┐  ┌──────────┐
                       │ MarketValueHistory   │  │ Transfer │
                       └──────────────────────┘  └──────────┘
```

### Models & Schema Details
1. **`Player`**:
   * Fields: `id` (cuid, PK), `fullName`, `commonName`, `dateOfBirth`, `nationality` (text array), `position`, `subPosition`, `preferredFoot`, `heightCm`, `photoUrl`, `apiFootballId` (Int, unique), `transfermarktId` (String, unique), `latestMarketValue` (BigInt), `lastSeason` (Int), `currentClubId` (FK -> Club.id), `createdAt`, `updatedAt`.
   * Indexes: `fullName`, `position`, `currentClubId`, `latestMarketValue` (DESC).
2. **`Club`**:
   * Fields: `id` (cuid, PK), `name`, `code`, `logoUrl`, `country`, `transfermarktId` (unique), `totalMarketValue` (BigInt), `squadSize` (Int), `leagueId` (FK -> League.id).
   * Indexes: `leagueId`, `name`, `totalMarketValue` (DESC).
3. **`League`**:
   * Fields: `id` (cuid, PK), `name`, `country`, `tier`, `logoUrl`, `transfermarktId` (unique), `totalMarketValue` (BigInt), `totalPlayers` (Int), `clubCount` (Int).
4. **`MarketValueHistory`**:
   * Fields: `id` (cuid, PK), `playerId` (FK -> Player.id CASCADE), `date`, `valueEur` (BigInt), `clubName`.
   * Indexes: `[playerId, date]`.
5. **`Transfer`**:
   * Fields: `id` (cuid, PK), `playerId` (FK -> Player.id CASCADE), `fromClubName`, `toClubName`, `date`, `feeEur` (BigInt), `transferType`.
   * Indexes: `playerId`, `date`.
6. **`SeasonStats`**:
   * Fields: `id` (cuid, PK), `playerId` (FK -> Player.id CASCADE), `season`, `competition`, `clubName`, `appearances`, `goals`, `assists`, `minutesPlayed`, `yellowCards`, `redCards`.
   * Indexes: `[playerId, season]`.
7. **`Injury`**:
   * Fields: `id` (cuid, PK), `playerId` (FK -> Player.id CASCADE), `type`, `startDate`, `endDate`, `status`.
   * Indexes: `playerId`.

---

## 4. Data Sources, Ingestion & Cron Jobs

1. **Historical Dataset Ingestion:**
   * **Source:** Open Transfermarkt dataset mirror (`https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data` / Kaggle).
   * **Scripts:**
     * `scripts/sync-dataset.ts`: Ingests `competitions.csv`, `clubs.csv`, `players.csv`, `player_valuations.csv`, `transfers.csv`.
     * `scripts/backfill-and-enhance.ts`: Backfills indexed columns (`latestMarketValue`, `lastSeason`, `squadSize`, `totalMarketValue`, `clubCount`).
   * **Automation:** `.github/workflows/sync-dataset.yml` scheduled weekly on Sunday at `03:00 UTC` (`0 3 * * 0`).
2. **Live Match Center:**
   * **Source:** FotMob API (`https://www.fotmob.com/api/data/matches` and `/api/data/matchDetails`).
   * **Implementation:** `src/lib/fotmob/client.ts` generates dynamic `x-mas` anti-bot headers using pure-JS MD5 hashing without Node dependencies.
   * **Polling:** Live matches poll every 5s on active tabs via `src/components/LiveAutoRefresher.tsx`.
3. **Live Club & Player Proxy:**
   * **Source:** Transfermarkt direct web scraping proxy (`src/lib/transfermarkt/client.ts`).
   * **Usage:** On-demand fetching for club squad sheets (`/verein/kader/verein/[id]`) and player search when requested.
4. **Data Provider Architecture Decision (No API-Football):**
   * **Decision:** Replace API-Football entirely with **FotMob API** + **Transfermarkt**.
   * **Rationale:** Eliminates API-Football's restrictive 100 req/day paywall and missing credentials. FotMob API provides fixtures, live scores, confirmed match lineups with formations, team stats, live events, league tables, and player ratings at zero cost with edge authentication. Transfermarkt provides player valuation histories, transfer records, career bios, and club rosters.
   * **Action Items:** Season stats, league standings, and live matches will use FotMob API edge endpoints; market values and career transfers will use Transfermarkt data.

---

## 5. Caching Architecture

| Layer | Target | Duration / Mechanism |
| :--- | :--- | :--- |
| **Edge API (`/api/matches`)** | Cloudflare Edge | `Cache-Control: public, s-maxage=5, stale-while-revalidate=5` |
| **Edge API (`/api/matches/[id]`)**| Cloudflare Edge | `Cache-Control: public, s-maxage=5, stale-while-revalidate=5` |
| **Edge API (`/api/players/most-valuable`)**| Cloudflare Edge | `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` |
| **Match Pages (`/matches`, `/matches/[id]`)** | Next.js Edge ISR | `revalidate = 5` seconds |
| **Entity Pages (`/players/[slug]`, `/clubs/[id]`)** | Next.js Edge ISR | `revalidate = 3600` (1 hour) |
| **Homepage (`/`)** | Next.js Edge ISR | `revalidate = 30` seconds |
| **Client Browser Tab** | `LiveAutoRefresher` | `setInterval(5000)` calling `router.refresh()` inside a React transition (paused when tab hidden). |

---

## 6. Image Handling & Hotlinking

1. **Configuration (`next.config.mjs`):**
   * Remote patterns allow wildcard: `{ protocol: 'https', hostname: '**' }`.
   * Explicit patterns: `img.a.transfermarkt.technology`, `tmssl.akamaized.net`, `media.api-sports.io`, `images.unsplash.com`.
2. **Current Hotlinked Domains in Production:**
   * **16,649 player portraits:** Hotlinked directly to `https://img.a.transfermarkt.technology/portrait/header/...`.
   * **Team Crests:** Hotlinked directly to `https://images.fotmob.com/image_resources/logo/teamlogo/...` and `https://img.a.transfermarkt.technology/wappen/...`.
3. **Sizing & Optimization Issue:**
   * Several `<Image>` tags use `fill` without a `sizes` attribute (e.g., `src/app/clubs/page.tsx` line 48, `src/app/clubs/[id]/page.tsx` line 140, `src/app/leagues/[id]/page.tsx` line 92).
   * Next.js defaults missing `sizes` to `100vw`, generating viewport sizes up to `w=3840` for 32px–64px avatars.

---

## 7. Environment Variables

* **`.env` (Local):**
  * `DATABASE_URL`: Supabase connection pooler URL (`aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require`).
  * `DIRECT_URL`: Supabase direct connection URL.
* **Cloudflare Pages Dashboard:**
  * `DATABASE_URL` (Encrypted secret)
  * `DIRECT_URL` (Encrypted secret)
* **GitHub Repository Secrets:**
  * `DATABASE_URL` (Used by `.github/workflows/sync-dataset.yml`)
* **Missing from `.env.example` & Secrets:**
  * No `API_FOOTBALL_KEY` / `RAPIDAPI_KEY` defined.
  * No Cloudflare R2 credentials configured (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`).

---

## 8. Cloudflare Pages Deployment Configuration

* **Project Name:** `a1score`
* **Canonical Domain:** `https://a1score.pages.dev`
* **Build System:** `npx @cloudflare/next-on-pages` (preset: Next.js App Router)
* **Build Destination Directory:** `.vercel/output/static`
* **Compatibility Date:** `2024-09-23`
* **Compatibility Flags:** `["nodejs_compat"]`
* **Runtime Behavior:** Dynamic routes are compiled into an Edge Worker (`_worker.js`). All dynamic database queries on Edge bypass TCP `pg`/`PrismaClient` by utilizing `@supabase/supabase-js` over HTTPS REST.

---

## 9. Known Issues to Verify

### a. League pages show impossible club counts (Premier League 37, Serie A 39, Ligue 1 36, LaLiga 33, Bundesliga 31)
* **Verdict: CONFIRMED**
* **Evidence:**
  * Database query on `League` table yields:
    * Premier League: `clubCount: 37` (37 rows linked in `Club` with `leagueId = 'cmuihndux0003b23fizizm4a0'`)
    * Serie A: `clubCount: 39` (39 rows linked)
    * Ligue 1: `clubCount: 36` (36 rows linked)
    * LaLiga: `clubCount: 33` (33 rows linked)
    * Bundesliga: `clubCount: 31` (31 rows linked)
    * Liga Portugal: `clubCount: 35` (35 rows linked)
    * Eredivisie: `clubCount: 29` (29 rows linked)
  * **Root Cause:** In `prisma/schema.prisma`, `Club` has a static `leagueId` foreign key to `League`. In the Kaggle dataset (`clubs.csv`), any club that played in the Premier League between 2013 and 2024 (e.g. Wigan Athletic, Reading FC, Huddersfield, Stoke City, Sunderland, Cardiff City) was permanently linked to `Premier League`. There is no season-scoped join table (`LeagueSeasonClub`).

### b. Every page shares the homepage `<title>` and meta description
* **Verdict: CONFIRMED**
* **Evidence:**
  * In `src/app/layout.tsx` lines 9–13, `export const metadata: Metadata` defines:
    * Title: `"a1score.app — Football Player Database, Market Values & Transfer Analytics"`
    * Description: `"Explore football player profiles, market value evolution charts, career statistics, injury tracking, and transfer history on a1score.app."`
  * Zero child pages (`src/app/players/[slug]/page.tsx`, `src/app/clubs/[id]/page.tsx`, `src/app/leagues/[id]/page.tsx`, `src/app/matches/[id]/page.tsx`, etc.) export `generateMetadata` or page-level `metadata`.
  * Verified via `curl -s https://a1score.pages.dev/players/pedri-683840` which returns the root homepage title and description.

### c. Player/club images are requested at w=3840 via /_next/image
* **Verdict: CONFIRMED**
* **Evidence:**
  * In `src/app/clubs/page.tsx` line 48: `<Image src={club.logoUrl} alt={club.name} fill className="object-contain p-1" />`.
  * In `src/app/clubs/[id]/page.tsx` line 140: `<Image src={p.photoUrl} alt={p.fullName} fill className="object-cover" />`.
  * In `src/app/leagues/[id]/page.tsx` line 92: `<Image src={club.logoUrl} alt={club.name} fill className="object-contain" />`.
  * Omitting the `sizes` attribute on `<Image fill>` causes Next.js to assign `sizes="100vw"`, outputting a responsive `srcset` up to `w=3840` (`deviceSizes` in Next.js). On 4K / Retina screens, the browser selects the 3840px variant for a 40px icon.

### d. Images are hotlinked from `img.a.transfermarkt.technology` and `images.fotmob.com`
* **Verdict: CONFIRMED**
* **Evidence:**
  * Database audit shows **16,649 players** have `photoUrl` hosted directly on `https://img.a.transfermarkt.technology/portrait/header/...`.
  * `src/lib/fotmob/client.ts` lines 313, 322 and `src/components/MatchCard.tsx` generate image links from `https://images.fotmob.com/image_resources/logo/teamlogo/${id}_small.png`.
  * These third-party CDNs are subject to hotlink blocking, domain changes, or rate limiting.

### e. The header has no visible search field
* **Verdict: PARTIALLY CONFIRMED (CONFIRMED ON MOBILE & NARROW DESKTOP)**
* **Evidence:**
  * In `src/components/Navbar.tsx` lines 85–96, an `<input>` element exists inside `<div className="hidden sm:flex items-center flex-1 max-w-xs ml-4">`.
  * On mobile (`< 640px`), the search input is completely hidden from the header and buried inside the hamburger drawer.
  * On desktop, it is a plain text input that triggers a hard form redirect to `/search?q=...`. There is no ⌘K command palette, no keyboard shortcut, no autocomplete, and no live dropdown search.

### f. The live match UI polls every 5 seconds from each client
* **Verdict: CONFIRMED**
* **Evidence:**
  * `src/components/LiveAutoRefresher.tsx` runs `setInterval(..., 1000)` and invokes `router.refresh()` every 5 seconds (`intervalMs = 5000`).
  * `src/app/matches/page.tsx` renders `<LiveAutoRefresher intervalMs={5000} label="Live Scores" />`.
  * `src/app/matches/[id]/page.tsx` renders `<LiveAutoRefresher intervalMs={5000} label="Match Sync" />`.
  * While Cloudflare Edge caches `/api/matches` for 5s (`s-maxage=5`), every concurrent browser tab sends requests every 5 seconds.

### g. Player pages show "No detailed season stats recorded" for top players
* **Verdict: CONFIRMED**
* **Evidence:**
  * In `src/components/StatsTable.tsx` lines 19–24:
    ```tsx
    if (!stats || stats.length === 0) {
      return <div>No detailed season stats recorded.</div>;
    }
    ```
  * Direct PostgreSQL query: `SELECT COUNT(*) FROM "SeasonStats";` returns **0 rows**.
  * Top players (Erling Haaland, Lamine Yamal, Kylian Mbappé, Jude Bellingham) have 0 season stat records in the database, resulting in the placeholder being shown on every player profile.

### h. Player "transfer history" includes youth-team promotions (e.g. U16 -> U19)
* **Verdict: CONFIRMED**
* **Evidence:**
  * PostgreSQL query for Lamine Yamal in `Transfer` table:
    * `2023-06-30`: `Barça U19` -> `Barcelona`
    * `2022-06-30`: `Barça U16` -> `Barça U19`
    * `2021-06-30`: `Barça Youth` -> `Barça U16`
    * `2014-06-30`: `Torreta Yth.` -> `Barça Youth`
  * In `src/components/TransfersTable.tsx`, transfers are rendered without filtering out youth or internal academy promotions.
  * Line 63 in `TransfersTable.tsx` explicitly renders the combined fallback `"Free / Undisclosed"`.

### i. Club squads look incomplete (e.g. FC Barcelona shows 20 players)
* **Verdict: CONFIRMED**
* **Evidence:**
  * When `getClubById` executes in `src/lib/data/clubs.ts`, it first calls `tmGetClub` (Transfermarkt scraper). Transfermarkt's default squad table (`/verein/kader/verein/131`) lists only registered senior first-team players (approx 20–22 players), omitting reserve team players who play regular first-team minutes (e.g., Marc Bernal, Gerard Martín).
  * Conversely, the database fallback contains 58 players for Barcelona because youth and historical players with `current_club_id = 131` from Kaggle CSVs are mixed together without first-team indicators or market values.

### j. Match timelines can disagree with match stats (e.g. a yellow card in stats with no card event in the timeline)
* **Verdict: CONFIRMED**
* **Evidence:**
  * In `src/lib/fotmob/client.ts` lines 402–404:
    * `events: content.matchFacts?.events?.events || []`
    * `stats: content.stats?.Periods?.All?.stats || []`
  * FotMob aggregate statistics come from OPTA/FotMob statistical feeds (which count bench bookings, staff cards, and post-whistle cautions), whereas `matchFacts.events` only records on-pitch match incidents.
  * In `src/app/matches/[id]/page.tsx`, both are rendered independently with zero reconciliation, leading to scenarios where the stats section shows 3 yellow cards while the timeline only lists 2.

---

## 10. Architectural Risks & Blockers

1. **API-Football Key & Quota Constraints:**
   * Phase 1A/1D/1E and Phase 4 require API-Football for season stats, live match events, and lineups. An API-Football key is currently **missing** from `.env`. Free/starter tier quotas (100 req/day) can be exhausted in minutes if unthrottled or polled directly from clients.
2. **Cloudflare Pages Edge Runtime Limitations:**
   * Edge Workers enforce strict CPU execution limits (50ms on free tier, 30s wall time) and do not support native Node.js TCP sockets. Direct PostgreSQL connections via `pg` fail in Cloudflare Pages; all database queries on edge must route through the Supabase REST/PostgREST HTTP API (`@supabase/supabase-js`).
3. **Image Hotlink Vulnerability:**
   * Hotlinking 16,649 player portraits from `img.a.transfermarkt.technology` creates a single point of failure (rate limiting, referer blocking, or broken URLs). An image mirroring pipeline to Cloudflare R2 is required.
4. **Data Deduplication & Foreign Key Constraints:**
   * Merging duplicate clubs or introducing a season-scoped `LeagueSeasonClub` table requires careful data migration to avoid foreign key violation cascades in `Player.currentClubId`.
