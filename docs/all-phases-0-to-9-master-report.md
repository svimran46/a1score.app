# a1score.app — Complete Master Report: Phases 0 to 9

**Project:** `a1score.app` (Football Valuation & Match Intelligence)  
**Architecture:** Next.js 14 (App Router, Edge + Node runtimes), Tailwind CSS with strict CSS Tokens, TypeScript, Prisma, Supabase PostgreSQL, Cloudflare Pages, Web Push API, Service Workers.  
**Quality Record:** 75/75 tests passing, 0 hardcoded hex colors across all 89 component files, 100% bundle budgets passing, zero breaking schema/URL modifications.

---

## Table of Contents
1. [Global Architectural Principles](#1-global-architectural-principles)
2. [Phase 0: Foundation, Audit & Design Tokens](#phase-0-foundation-audit--design-tokens)
3. [Phase 1: Responsive 3-Column Shell](#phase-1-responsive-3-column-shell)
4. [Phase 2: Shared UI Components & Styleguide](#phase-2-shared-ui-components--styleguide)
5. [Phase 3: Restyling Core Pages (Valuation-First)](#phase-3-restyling-core-pages-valuation-first)
6. [Phase 4: Football News Feed & Entity Linking](#phase-4-football-news-feed--entity-linking)
7. [Phase 5: Design Polish, Accessibility & Documentation](#phase-5-design-polish-accessibility--documentation)
8. [Phase 6: Performance Budgets & Valuation Freshness](#phase-6-performance-budgets--valuation-freshness)
9. [Phase 7: SEO Engine, JSON-LD & Dynamic Sitemap](#phase-7-seo-engine-json-ld--dynamic-sitemap)
10. [Phase 8: Watchlist (Favorites) & Value Tracking](#phase-8-watchlist-favorites--value-tracking)
11. [Phase 9: PWA Web Push Notifications for Value Updates](#phase-9-pwa-web-push-notifications)
12. [Master Verification & Quality Results](#12-master-verification--quality-results)

---

## 1. Global Architectural Principles

Across all 10 phases, four invariant design and engineering principles were strictly enforced:

1. **Valuation-First Design**: Market values are the primary visual anchor (rendered in amber `--value-text` with tabular numerals and explicit trend indicators: arrow + number/percentage, never color alone).
2. **Strict CSS Design Token Compliance**: 0 hardcoded hex/RGB colors in UI files. Every color, border, shadow, radius, and elevation is resolved from CSS variables (`tokens.css` / `globals.css`) supporting seamless Dark and Light themes. Enforced via `npm run lint:colors`.
3. **Resilient Data & Non-Blocking Edge Execution**: Pages run on Cloudflare Pages (`export const runtime = "edge"` where appropriate). Remote databases and APIs use bounded timeouts, L1 LRU memory caching, and stale fallbacks (`src/lib/cache.ts`).
4. **Data Layer & URL Stability**: Existing database schemas, APIs, and canonical routes were preserved across all iterations without destructive migrations or breaking changes.

---

## Phase 0: Foundation, Audit & Design Tokens
*Commit: `77755c6`*

### Goals & Requirements
- Audit existing codebase for visual inconsistencies, fragmented styles, and hardcoded colors.
- Establish a token system (`tokens.css`) defining background tiers, text contrasts, accent colors, trend indicators, and component variables for both dark and light modes.
- Build an automated color linter (`scripts/check-hardcoded-colors.ts`) to prevent regressions.

### What Was Built
- **Design Token Engine (`src/app/tokens.css`)**: Defined semantic CSS variables for `--bg-page`, `--bg-card`, `--bg-elevated`, `--bg-chip`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`, `--value-text`, `--trend-up`, `--trend-down`, and spacing/border-radius constants.
- **Automated Color Linter (`scripts/check-hardcoded-colors.ts`)**: AST/Regex scanner parsing all `.tsx` and `.jsx` component files. Fails the build if any hardcoded hex (`#...`) or raw RGB color is detected.
- **Tailwind Configuration (`tailwind.config.ts`)**: Mapped semantic token classes directly to CSS variables.

### Key Files Changed
- `src/app/tokens.css` (created)
- `scripts/check-hardcoded-colors.ts` (created)
- `tailwind.config.ts` (updated)
- `src/app/globals.css` (updated)
- `package.json` (added `lint:colors` script)

---

## Phase 1: Responsive 3-Column Shell
*Commit: `4c960e6`*

### Goals & Requirements
- Replace the legacy monolithic navigation bar with a responsive 3-column layout inspired by modern sports platforms (FotMob / SofaScore).
- Responsive breakdown:
  - **Desktop (≥1024px)**: Left rail (navigation & top leagues, 240px), center column (max 720px), right rail (news & value movers, 320px).
  - **Tablet (640px – 1023px)**: Single center column, horizontal top leagues chip scroller, persistent top nav.
  - **Mobile (<640px)**: Bottom navigation bar (44px tap targets, 5 tabs: Matches, Players, Clubs, Values, More modal).

### What Was Built
- **`AppShell` (`src/components/AppShell.tsx`)**: Responsive wrapper managing column arrangement and safe-area insets.
- **`LeftRail` (`src/components/shell/LeftRail.tsx`)**: Displays authentic top leagues with crests and quick links.
- **`RightRail` (`src/components/shell/RightRail.tsx`)**: Shows latest news and top 5 valuation movers (risers and fallers).
- **`TopNav` (`src/components/shell/TopNav.tsx`)**: Clean sticky header with brand logo, search launcher (`Cmd+K`), and theme toggle.
- **`BottomNav` (`src/components/shell/BottomNav.tsx`)**: High-performance mobile bottom bar with live match counter badge and "More" sheet.
- **`TabletLeaguesScroller` (`src/components/shell/TabletLeaguesScroller.tsx`)**: Horizontal league pill selector for tablet widths.

### Key Files Changed
- `src/components/AppShell.tsx` (created)
- `src/components/shell/LeftRail.tsx` (created)
- `src/components/shell/RightRail.tsx` (created)
- `src/components/shell/TopNav.tsx` (created)
- `src/components/shell/BottomNav.tsx` (created)
- `src/components/shell/TabletLeaguesScroller.tsx` (created)
- `src/components/Navbar.tsx` (refactored to re-export shell components)

---

## Phase 2: Shared UI Components & Styleguide
*Commit: `e7af47f`*

### Goals & Requirements
- Build reusable UI primitives implementing token variables and valuation-first patterns.
- Create an interactive living styleguide at `/styleguide` displaying all tokens, typography, rows, chips, states, and layouts.

### What Was Built
- **Atomic UI Primitives (`src/components/ui/`)**:
  - `Card`: Surface container with token radius, padding, and subtle borders.
  - `Chip`: Filter/category pill supporting active, hover, and count badge states.
  - `Tabs`: Accessible tab navigation with keyboard arrows support (`ArrowLeft`/`ArrowRight`).
  - `Skeleton`: Shimmer pulse loading placeholders matching exact component dimensions.
  - `EmptyState`: Centered empty states with iconography, helpful copy, and action buttons.
  - `ErrorState`: Resilient error fallbacks with retry actions.
  - `SectionHeader`: Standardized headers with uppercase subtitles and "See all" links.
- **Domain Row Components (`src/components/ui/`)**:
  - `PlayerRow`: Rank (24px) | Avatar (40px) | Name + Club Crest | Age/Nationality | Market Value (Amber, 700) + Trend arrow/%.
  - `ClubRow`: Crest | Name + League | Squad Size | Total Valuation.
  - `MatchRow`: Time/Status | Home team vs Away team with scores | Competition badge.
  - `TransferRow`: Player details | Selling club -> Buying club | Transfer fee / Loan badge.
- **Interactive Styleguide (`src/app/styleguide/page.tsx`)**: Live showcase of tokens, buttons, cards, rows, states, and responsive viewports.

### Key Files Changed
- `src/components/ui/Card.tsx`, `Chip.tsx`, `Tabs.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `SectionHeader.tsx` (created)
- `src/components/ui/PlayerRow.tsx`, `ClubRow.tsx`, `MatchRow.tsx`, `TransferRow.tsx` (created)
- `src/components/ui/index.ts` (created)
- `src/app/styleguide/page.tsx` (created)

---

## Phase 3: Restyling Core Pages (Valuation-First)
*Commit: `50f65a0`*

### Goals & Requirements
- Restyle all existing application pages using the Phase 2 shared components and tokens.
- Replace duplicate table/row implementations across Home, Values, Players, Clubs, and Transfers.

### What Was Built
- **Home Page (`src/app/page.tsx`)**: Transformed into a central hub featuring live match hero strips, top valuation risers/fallers, and recent high-profile transfers.
- **Market Values Directory (`src/app/values/page.tsx`)**: Fast, filterable list of most valuable worldwide players sorted by market valuation with position/league filters.
- **Player Detail Profile (`src/app/players/[slug]/page.tsx`)**: Hero valuation card, interactive valuation history chart (`MarketValueChart`), transfer ledger, injury log, and key athletic facts.
- **Club Detail Profile (`src/app/clubs/[id]/page.tsx`)**: Club header with total squad valuation, club honours strip, interactive squad table, and transfer ledger.
- **Transfers Center (`src/app/transfers/page.tsx`)**: Ledger of verified moves, loans, and fees.
- **Directory Clients**: Standardized `PlayersDirectoryClient`, `ClubsDirectoryClient`, and `LeaguesDirectoryClient`.

### Key Files Changed
- `src/app/page.tsx`, `src/app/values/page.tsx`, `src/app/transfers/page.tsx`, `src/app/players/[slug]/page.tsx`, `src/app/clubs/[id]/page.tsx` (refactored)
- `src/components/PlayerTabsContainer.tsx` (created)
- 24 existing components refactored to eliminate duplicate markup.

---

## Phase 4: Football News Feed & Entity Linking
*Commit: `0f77839`*

### Goals & Requirements
- Implement a dedicated news feed at `/news` and syndication widgets across the app.
- Provide entity linking: news items tag players and clubs, appearing on player/club detail pages.
- Fallback content support when external RSS feeds are unavailable.

### What Was Built
- **News Data Service (`src/lib/data/news.ts`)**: Multi-source aggregator with RSS parsing, fallback fixtures, entity tag resolution, and in-memory LRU caching.
- **News API Route (`src/app/api/news/route.ts`)**: Edge API route serving news filtered by tag, player ID, or club ID.
- **News Components (`src/components/news/`)**:
  - `NewsCardHero`: Featured visual headline card with relative timestamp.
  - `NewsCardRow`: Compact list row with source logo and entity badges.
  - `RelatedNewsCard`: Contextual news strip embedded in player and club profiles.
  - `NewsDirectoryClient`: Filterable news page with category chips (All, Transfers, Valuation, UCL).
- **Integration**: Linked news into `RightRail`, `/players/[slug]`, and `/clubs/[id]`.

### Key Files Changed
- `src/lib/data/news.ts` (created)
- `src/types/news.ts` (created)
- `src/app/api/news/route.ts` (created)
- `src/app/news/page.tsx` (created)
- `src/components/news/NewsCardHero.tsx`, `NewsCardRow.tsx`, `RelatedNewsCard.tsx`, `NewsDirectoryClient.tsx` (created)

---

## Phase 5: Design Polish, Accessibility & Documentation
*Commit: `170f110`*

### Goals & Requirements
- Comprehensive accessibility audit: WCAG AA color contrast, keyboard focus indicators, tap targets (min 44px), screen-reader labels.
- Refine animations, elevation layers, and Command Palette (`Cmd+K`).
- Write comprehensive design system documentation (`DESIGN.md`).

### What Was Built
- **Design System Manifesto (`DESIGN.md`)**: Complete 190-line documentation covering principles, tokens, typography scales, spacing, components, and accessibility checklist.
- **Accessibility Pass**:
  - `focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]` across all interactive elements.
  - Verified contrast ratios for text on dark (`#0a0d12`) and light surfaces.
  - Added `aria-label` and screen-reader status cues.
- **Command Palette (`src/components/CommandPalette.tsx`)**: Instant global search dialog accessible via `Cmd+K` / `Ctrl+K` with keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`).
- **Footer (`src/components/Footer.tsx`)**: Clean FotMob-style footer with legal disclaimers, methodology link, and theme toggler.

### Key Files Changed
- `DESIGN.md` (created)
- `src/components/CommandPalette.tsx`, `Footer.tsx`, `ThemeToggle.tsx` (polished)
- `tokens.css` (enhanced contrast tokens)

---

## Phase 6: Performance Budgets & Valuation Freshness
*Commit: `fe69ae4`*

### Goals & Requirements
- Enforce strict client-side bundle budgets and asset weights.
- Integrate Lighthouse CI configuration (`lighthouserc.json`).
- Implement visual "Valuation Freshness Indicator" informing users of when a valuation was last updated.

### What Was Built
- **Bundle & Asset Budget Script (`scripts/check-perf-budget.ts`)**:
  - Audits production Next.js build output against `perf-budget.json`.
  - Enforces route JS limits: `/` ≤ 200 kB, `/values` ≤ 250 kB, `/players/[slug]` ≤ 250 kB, `/clubs/[id]` ≤ 200 kB, `/news` ≤ 200 kB.
  - Audits static assets in `public/` (all images ≤ 250 kB).
- **Valuation Freshness Component (`src/components/ui/ValuationFreshness.tsx`)**:
  - Displays relative age ("Updated 3d ago", "Updated 2w ago") with tooltip and timestamp.
  - Color-coded indicator: Fresh (within 30 days) vs Review pending.
- **Lighthouse CI Config (`lighthouserc.json`)**: Configured mobile/desktop assertion profiles for Core Web Vitals (LCP, FID, CLS).

### Key Files Changed
- `perf-budget.json` (created)
- `scripts/check-perf-budget.ts` (created)
- `lighthouserc.json` (created)
- `src/components/ui/ValuationFreshness.tsx` (created)
- Embedded in `players/[slug]/page.tsx`, `clubs/[id]/page.tsx`, and `values/page.tsx`.

---

## Phase 7: SEO Engine, JSON-LD & Dynamic Sitemap
*Commit: `73c7b71`*

### Goals & Requirements
- Implement per-page canonical metadata without duplicate suffix bugs.
- Generate valid Schema.org JSON-LD structured data (`Person`, `SportsTeam`, `BreadcrumbList`).
- Generate dynamic XML sitemap (`/sitemap.xml`) indexing players, clubs, leagues, and news.

### What Was Built
- **Metadata Generator (`src/lib/metadata.ts`)**:
  - `constructMetadata`: Enforces title constraints, Open Graph cards, canonical URLs, and clean suffix formatting (`| a1score`).
- **Structured Data (JSON-LD)**:
  - Players: Schema.org `Person` with nationality, birthDate, image, and `SportsTeam` affiliation.
  - Clubs: Schema.org `SportsTeam` with roster members and league organization.
  - Breadcrumbs: Schema.org `BreadcrumbList` matching breadcrumb UI.
- **Breadcrumb Primitive (`src/components/ui/Breadcrumbs.tsx`)**: Accessible breadcrumb strip.
- **Dynamic Sitemap (`src/app/sitemap.ts`)**: Edge sitemap fetching entities with weekly changefreq and priority ranking.
- **SEO Test Suite (`tests/seo.test.ts`)**: 165 lines testing title formatting, JSON-LD schema correctness, and robot crawl rules.

### Key Files Changed
- `src/lib/metadata.ts` (updated)
- `src/components/ui/Breadcrumbs.tsx` (created)
- `src/app/sitemap.ts` (updated)
- `tests/seo.test.ts` (created)
- `src/app/players/[slug]/page.tsx`, `src/app/clubs/[id]/page.tsx` (JSON-LD integrated)

---

## Phase 8: Watchlist (Favorites) & Value Tracking
*Commit: `894530f`*

### Goals & Requirements
- Add star/follow button to player rows and detail headers.
- Store favorites in `localStorage` behind a modular `WatchlistAdapter` interface with in-memory fallback.
- Sync state across open browser tabs via `storage` event.
- Build `/watchlist` page showing valuation change since followed (`+X.X%` / `-X.X%`).
- Display top 5 followed players in desktop right-rail card.

### What Was Built
- **Storage Architecture (`src/lib/watchlist/storage.ts`)**: Singleton `LocalStorageWatchlistAdapter` wrapping storage with `try/catch`, in-memory fallback, and subscription listeners.
- **Reactive Hook (`src/lib/watchlist/useWatchlist.ts`)**: State synchronization, optimistic toggling, and storage availability flags.
- **Follow Button (`src/components/watchlist/FollowButton.tsx`)**: Accessible button (`aria-pressed`, `aria-label`, 44px tap target, zero layout shift) supporting `icon` and `button` variants.
- **Right Rail Card (`src/components/watchlist/WatchlistRightRailCard.tsx`)**: Sidebar card listing top 5 followed players with current value and change trend.
- **Watchlist Page (`src/components/watchlist/WatchlistClient.tsx` & `src/app/watchlist/page.tsx`)**:
  - Players and Clubs tabs with count badges.
  - Calculated change since followed: `currentValueEur - initialValueEur`.
  - Individual item removal and inline "Clear all" confirmation dialog.
- **Row Integration (`src/components/PlayerRow.tsx` & `src/components/ui/PlayerRow.tsx`)**: Separated row container link from star button to eliminate nested `<button>` DOM errors.
- **Watchlist Unit Tests (`tests/watchlist.test.ts`)**: Unit tests verifying persistence, listeners, and percentage calculations.

### Key Files Changed
- `src/lib/watchlist/storage.ts`, `src/lib/watchlist/useWatchlist.ts` (created)
- `src/components/watchlist/FollowButton.tsx`, `WatchlistClient.tsx`, `WatchlistRightRailCard.tsx` (created)
- `src/app/watchlist/page.tsx` (created)
- `src/components/PlayerRow.tsx`, `src/components/ui/PlayerRow.tsx` (updated)
- `src/components/shell/RightRail.tsx`, `BottomNav.tsx`, `TopNav.tsx`, `LeftRail.tsx` (nav updated)
- `tests/watchlist.test.ts` (created)

---

## Phase 9: PWA Web Push Notifications
*Commit: `5c561c9`*

### Goals & Requirements
- Notify users when followed players have a market value update.
- Respect constraints: say "value update" (never "live/real-time"), no permission prompts on page load, iOS Home Screen installation detection (iOS 16.4+).
- Use Web Push API with VAPID keys; zero PII invariant (store only anonymous endpoint, keys, followed IDs, and threshold in Cloudflare KV / D1 / memory).
- Group multiple player updates into one push; rate-limit to 1 push/user/day; auto-clean 404/410 subscriptions.

### What Was Built
- **Service Worker (`public/sw.js`)**: Push event listener (parses JSON, creates rich notification) and notificationclick listener (focuses or opens player page).
- **Web App Manifest (`src/app/manifest.ts`)**: Standalone display, token background/theme (`#0a0d12`), accurate copy.
- **Subscription Store (`src/lib/notifications/store.ts`)**: Anonymous store backed by Cloudflare KV (`PUSH_SUBSCRIPTIONS_KV`), D1, and in-memory fallback.
- **VAPID Config (`src/lib/notifications/vapid.ts`)**: Keys, subject, and ArrayBuffer converter for Web Push API.
- **Notification Dispatcher (`src/lib/notifications/dispatcher.ts`)**: Evaluates player value changes, checks user thresholds (`±3%`, `±5%`, `±10%`), groups multiple players ("3 players you follow changed in value"), applies 1 push/day rate-limit, and purges expired endpoints.
- **Client Hook (`src/lib/notifications/useNotifications.ts`)**: Manages subscription state, PushManager integration, threshold preferences, and iOS standalone detection.
- **Notification Settings Card (`src/components/notifications/NotificationSettingsCard.tsx`)**: Watchlist card with toggle, threshold chips, test alert button, and privacy notice.
- **Post-Follow In-Page Prompt (`src/components/notifications/PostFollowNotificationPrompt.tsx`)**: Non-intrusive toast shown *only* after a follow action occurs.
- **API Routes**:
  - `POST /api/notifications/subscribe`
  - `POST /api/notifications/unsubscribe`
  - `POST /api/notifications/cron` (Cloudflare Worker cron trigger)
  - `POST /api/notifications/test` (simulates single/grouped push alerts)
- **Unit Tests (`tests/push-notifications.test.ts`)**: Tests verifying manifest, SW event listeners, store CRUD, zero PII, and rate limiting.

### Key Files Changed
- `public/sw.js` (push & click handlers added)
- `src/app/manifest.ts` (updated)
- `src/lib/notifications/store.ts`, `types.ts`, `vapid.ts`, `dispatcher.ts`, `useNotifications.ts` (created)
- `src/components/notifications/NotificationSettingsCard.tsx`, `PostFollowNotificationPrompt.tsx` (created)
- `src/app/api/notifications/subscribe/route.ts`, `unsubscribe/route.ts`, `cron/route.ts`, `test/route.ts` (created)
- `tests/push-notifications.test.ts` (created)

---

## 12. Master Verification & Quality Results

| Verification Check | Tool / Script | Status | Result Details |
| :--- | :--- | :---: | :--- |
| **Color Token Compliance** | `scripts/check-hardcoded-colors.ts` | **PASS** | 0 hardcoded colors found across all 89 component files |
| **Unit & Invariant Tests** | `tests/*.test.ts` (Node Test Runner) | **PASS** | 75 passed, 0 failed, 0 errors |
| **Production Build** | `next build` | **PASS** | 41 routes successfully compiled (Edge + Node runtimes) |
| **Bundle Size Budgets** | `scripts/check-perf-budget.ts` | **PASS** | All routes under 200 kB – 250 kB thresholds |
| **Static Asset Weights** | `scripts/check-perf-budget.ts` | **PASS** | All public icons/OG images under 250 kB threshold |
| **Git Version Control** | `git push origin main` | **PASS** | Up to date on commit `5c561c9` |

All 10 phases are fully implemented, tested, and live in the codebase.
