# a1score.app — Design System & Component Guidelines

> **"Money meets the pitch."**
> A modern, content-first sports intelligence interface synthesizing real-time match events with player market valuations and transfer records. Inspired by FotMob's clean, high-density, tone-separated design language.

---

## 1. Design Philosophy

- **Tonal Separation over Borders:** Containers, cards, and sections are differentiated by subtle background tone steps (`--bg-page` → `--bg-card` → `--bg-chip` → `--bg-hover`) rather than rigid outer borders or heavy drop shadows.
- **Valuation Prominence:** Player and club market valuations are treated as primary signals, rendered prominently with the signature amber accent (`--value-text`), always using tabular figures (`tabular-nums`) to prevent horizontal jitter.
- **High Information Density & Clean Hierarchy:** Compact rows with 64px standardized touch heights, clear two-line hierarchy (primary title in bold, metadata and context in muted text), and crisp badge indicators.
- **Strict Accessibility (WCAG 2.1 AA):** Minimum 4.5:1 contrast across dark and light modes, minimum 44px interactive tap targets on touch devices, visible focus rings on all interactive elements, and multi-modal indicators (color is never the sole carrier of information).

---

## 2. Design Tokens (`tokens.css`)

The design system uses a 3-layer token architecture: **Primitives** → **Semantic Tokens** → **Component Tokens**.

### Layer 1: Primitives

```css
/* Inks & Neutrals */
--ink-950: #07080b; /* Page background base */
--ink-900: #0f1116; /* Card surface base */
--ink-800: #181b22; /* Chip & hover base */
--ink-700: #232733; /* Divider line base */
--gray-100: #f4f5f7; /* High contrast primary text */
--gray-400: #9aa1ae; /* Secondary muted text */

/* Accents & Status */
--amber-400: #ffb020; /* Brand & valuation gold (dark theme) */
--amber-500: #f59e0b; /* Focus ring & button accents */
--green-500: #2ecc71; /* Live indicator & positive trends */
--red-500:   #ff5a5f; /* Negative trends & match alerts */
--blue-500:  #2563eb; /* Informational badges */
--white:     #ffffff;

/* Spacing Scale (4px grid) */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 20px;  --space-6: 24px;  --space-8: 32px;  --space-10: 40px;

/* Radii Scale */
--radius-sm: 10px;  --radius-md: 14px;  --radius-lg: 20px;  --radius-pill: 999px;

/* Typography Scale */
--font-sans: "Inter", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
--text-xs: 0.75rem;    --text-sm: 0.875rem;  --text-base: 1rem;
--text-lg: 1.125rem;   --text-xl: 1.375rem;  --text-2xl: 1.75rem;

/* Motion */
--ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
--dur-fast: 120ms;
--dur-base: 200ms;
```

### Layer 2: Semantic Tokens

| Token | Dark Mode Default | Light Mode (`[data-theme="light"]`) | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-page` | `#07080b` | `#f3f4f7` | Page viewport background |
| `--bg-card` | `#0f1116` | `#ffffff` | Elevated surface containers |
| `--bg-chip` | `#181b22` | `#eceef3` | Filter chips, pills, badges |
| `--bg-hover` | `#181b22` | `#f0f1f5` | Interactive hover highlight |
| `--divider` | `#232733` | `#e1e4ea` | Hairline dividers and rules |
| `--text-primary` | `#f4f5f7` (17.5:1) | `#0f1116` (18.5:1) | Headings, titles, primary labels |
| `--text-muted` | `#9aa1ae` (7.1:1) | `#5b6372` (5.9:1) | Timestamps, subtitles, secondary metadata |
| `--accent` | `#ffb020` (10.3:1) | `#b45309` (5.6:1) | Active chips, logo accent, key links |
| `--accent-contrast`| `#07080b` | `#ffffff` | Text inside solid accent fills |
| `--value-text` | `#ffb020` | `#b45309` | Player & club market values |
| `--trend-up` | `#2ecc71` | `#16a34a` | Positive valuation movements |
| `--trend-down` | `#ff5a5f` | `#dc2626` | Negative valuation movements |
| `--live` | `#2ecc71` | `#16a34a` | Live match minute & pulse dot |
| `--focus-ring` | `#ffb020` | `#b45309` | 2px visible keyboard focus indicator |

### Layer 3: Component Dimensions

```css
--card-radius: var(--radius-lg); /* 20px */
--card-padding: var(--space-5);  /* 20px */
--chip-radius: var(--radius-pill); /* 999px */
--chip-height: 40px;             /* 44px on touch viewport */
--row-height: 64px;              /* Standard list row height */
--nav-height: 72px;              /* FotMob-style sticky top nav */
--container-max: 1280px;         /* Centered desktop layout */
--rail-left: 260px;              /* Desktop left navigation rail */
--rail-right: 320px;             /* Desktop right widgets rail */
--gap: var(--space-4);           /* 16px desktop column gap */
```

---

## 3. Layout Grid & Shell Architecture

```
Desktop (>= 1024px):
+--------------------------------------------------------------------------+
| TopNav (Sticky 72px, max-width 1280px)                                  |
+--------------------------------------------------------------------------+
| LeftRail (260px)   | Main Content (min-w-0 1fr)   | RightRail (320px)    |
| - Top Competitions | - Hero banner                | - Latest News (4)    |
| - Quick Navigation | - Filter chips               | - Value Movers (5)   |
|                    | - Core data tables / cards   |                      |
+--------------------------------------------------------------------------+
| Footer (Explore links, legal, data sources)                             |
+--------------------------------------------------------------------------+

Tablet (640px to 1023px):
- Left and right rails collapse.
- Horizontal TabletLeaguesScroller appears below TopNav.
- Right rail widgets stack below main content.

Mobile (< 640px):
- Single column feed.
- Fixed BottomNav (56px) with 5 primary touch destinations.
- Expandable "More" sheet drawer for secondary destinations.
- Main container padding bottom (`pb-20`) prevents bottom nav overlap.
```

---

## 4. UI Components Catalog

All shared primitive components reside under `src/components/ui/` and are showcased interactively at `/styleguide`.

### 1. `Card`
- Single surface token: `bg-[var(--bg-card)]`
- Radius: `rounded-[var(--card-radius)]` (20px)
- Padding: `p-[var(--card-padding)]` (20px)
- Borderless in dark mode; no hard drop shadows.

### 2. `Chip`
- Height: `h-10 min-h-[44px] sm:min-h-[40px]`
- Shape: Full pill (`rounded-[var(--chip-radius)]`)
- Active State: `bg-[var(--accent)] text-[var(--accent-contrast)]`
- Inactive State: `bg-[var(--bg-chip)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`
- Focus: `focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]`

### 3. Row Components
- **`MatchRow`:** Time/Live status, Team names + logos, Live score or kickoff time, market value badges.
- **`PlayerRow`:** Rank/Shirt #, Avatar, Name, Position, Club name + crest, Market valuation in amber with trend indicator.
- **`ClubRow`:** Rank, Crest, Club name, Senior squad size, Total squad valuation.
- **`TransferRow`:** Date, Player avatar + name, Origin club → Destination club, Fee badge (Fee / Loan / Free).
- **`NewsCardRow`:** 96px fixed aspect thumbnail, Entity tag, 2-line headline, Source + relative time, outbound link indicator.

### 4. Skeletons & Loading Feedback
- Skeletons use animated pulse over `bg-[var(--bg-elevated)]` with matching border-radii (`CardSkeleton`, `MatchRowSkeleton`, `PlayerRowSkeleton`, `ClubRowSkeleton`, `TransferRowSkeleton`).
- Never leave operations taking >300ms without visual skeleton or inline spinner feedback.

### 5. Empty & Error States
- **`EmptyState`:** Plain sentence case copy (e.g. "No matches scheduled for this date."), muted icon, optional actionable button. No exclamation marks.
- **`ErrorState`:** "Couldn't load data right now." with clear retry link.

---

## 5. Accessibility (A11y) Rules

1. **Contrast Ratio:** Text must maintain >= 4.5:1 contrast against surrounding surfaces in both dark and light modes.
2. **Focus Indicators:** Interactive elements must display a 2px outline using `var(--focus-ring)` when focused via keyboard (`:focus-visible`). Never remove outlines without providing this ring.
3. **Touch Targets:** All clickable links, buttons, and chips must measure at least 44px by 44px on mobile viewports with >= 8px spacing.
4. **Non-Color Conveyance:**
   - **Trends:** Use arrow symbols (`▲` / `▼`), mathematical signs (`+` / `−`), and percentage text alongside green/red colors.
   - **Live Matches:** Use explicit "LIVE" text or minute marks (e.g., `64'`) alongside pulsing green dots.
   - **Errors:** Use alert icons and descriptive text alongside red styling.
5. **Charts & Visualizations:**
   - Always supply screen-reader accessible summaries (`<p className="sr-only">...</p>`).
   - Recharts tooltips display exact numbers with currency symbols and date context.
6. **Landmarks & Skip Link:**
   - Semantic HTML5 landmarks: `<header>`, `<nav>`, `<main id="main-content">`, `<aside>`, `<footer>`.
   - Accessible skip link positioned at the top of the DOM: `<a href="#main-content">Skip to content</a>`.

---

## 6. Motion & Animation Rules

- **Allowed Properties:** Animate exclusively `opacity` and `transform`.
- **Prohibited Properties:** Never animate layout properties (`width`, `height`, `margin`, `padding`, `top`, `left`).
- **Duration & Timing:** 120ms to 200ms using `var(--ease-out)` (`cubic-bezier(0.2, 0.8, 0.2, 1)`).
- **Reduced Motion:** When `prefers-reduced-motion: reduce` is detected, animations and transitions are collapsed to instantaneous (`0.01ms !important`).

---

## 7. Token Hygiene & Automated Verification

- **Zero Hardcoded Colors:** Never write hardcoded hex values (`#fff`, `#000`, `#ffb020`), RGB/RGBA literals, or Tailwind color family classes (`text-slate-400`, `bg-gray-900`) inside UI components.
- **Color Linter:** Enforced by running:
  ```bash
  npm run lint:colors
  ```
  This scans all 80+ component files to ensure 100% compliance with CSS variables.

---

## 8. Performance Guardrails & Lighthouse CI

### Budgets & Metrics (`perf-budget.json`)
The application enforces strict performance limits across bundle sizes, static assets, and Core Web Vitals:
- **Route JS Limits (gzipped):**
  - `/` (Home): <= 200 kB
  - `/values` (Market Values directory): <= 250 kB
  - `/players/[slug]` (Player Detail): <= 250 kB
  - `/clubs/[id]` (Club Detail): <= 200 kB
  - `/news` (News Hub): <= 200 kB
- **Asset Limits:**
  - Single image weight: <= 250 kB
  - Font weight: <= 100 kB
- **Lighthouse CI Mobile Thresholds:**
  - Performance score: >= 85
  - Accessibility score: >= 95
  - Largest Contentful Paint (LCP): <= 2.5s
  - Cumulative Layout Shift (CLS): <= 0.1
  - Total Blocking Time (TBT): <= 300ms

### Running Local Verification
1. **Build the production bundle:**
   ```bash
   npm run build
   ```
2. **Verify bundle sizes and static asset weights against budgets:**
   ```bash
   npm run perf:budget
   ```
3. **Execute local Lighthouse CI audit on mobile emulation:**
   ```bash
   npm run lhci:mobile
   ```
   Reports and trace artifacts are generated inside `.lighthouseci/`.

---

## 9. Mobile Page Headers

To ensure high information density, content prominence, and zero viewport waste on mobile devices, entity profiles (Players, Clubs, Leagues) follow strict mobile header rules:

### 1. Height & Visibility Budget
- **Maximum Vertical Height:** The header card must fit in **at most ~220px of height on a 390px-wide viewport** (e.g. iPhone 12/13/14/15), guaranteeing that the primary interactive tabs and first content rows are immediately visible above the fold without requiring user scrolling.
- **Scroll Behavior:** The header card scrolls away naturally with the page; navigation and interactive tab bars stick beneath the top navigation bar with `--ease-out` transitions.
- **Safe-Area Insets:** Respects `env(safe-area-inset-top)` and bottom navigation clearance (`pb-20 sm:pb-0`).

### 2. Information Hierarchy
- **Visual Anchor (Avatar / Crest):** Maximum 56px dimension on mobile (`w-14 h-14`), expanding to at most 64px (`w-16 h-16`) on desktop. Always uses strict dimensions to guarantee **Zero CLS** (Cumulative Layout Shift) with placeholder skeleton backgrounds (`--bg-chip`).
- **Entity Name:** Clear bold hierarchy (`--text-primary`), maximum 2 lines (`line-clamp-2`), with graceful ellipsis truncation for long names. Never triggers horizontal overflow or text clipping.
- **Key Metadata:** One clean, concise horizontal line of secondary context (`--text-secondary`):
  - *Player:* Position & Nationality • Current Club & League • Age
  - *Club:* Country • League • Active Squad Size • Avg Age
  - *League:* Country • Tier • Club Count • Season
- **Primary Value Signal (Valuation):** Rendered prominently in brand amber (`--value-text`), always using `tabular-nums` figures, accompanied by a directional trend indicator (`--trend-positive` / `--trend-negative`) or freshness badge (`ValuationFreshness`).

### 3. Action Bar Standards
- **Unified Action Row:** Action controls (Follow button, Share trigger) are consolidated in a single horizontal row on both mobile and desktop.
- **Minimum Tap Targets:** All interactive buttons guarantee **44px minimum tap targets** (WCAG 2.1 AA requirement).
- **No Secondary Wrapping:** Actions never wrap into an awkward secondary row on small viewports (down to 320px width).

### 4. Shared Polymorphic Architecture
- Implemented as a single, reusable `PageHeader` component in `src/components/ui/PageHeader.tsx` supporting `player`, `club`, `league`, and `directory` variants. Duplicate header markup is eliminated.

---

## 10. Ad Slot Standards & Placement Guardrails

To preserve platform speed, clean typography, and zero-distraction market intelligence, optional promotional or sponsorship ad slots (configured behind the `NEXT_PUBLIC_ADS_ENABLED=false` feature flag) adhere to strict layout guardrails:

### 1. Mandatory Placement Invariants
- **Never Above the Main Valuation Block:** The primary valuation card, player profile header, club crest, and key meta must always command initial viewport priority. Ads are strictly prohibited above the fold or above valuation metrics.
- **Never Inside Tables or Rows:** Ad slots must never interrupt tabular listings (match fixtures, player transfer ledgers, squad rosters, league standings tables, or compare matrices).
- **Max 1 Per Viewport on Mobile:** At no point may multiple ad slots occupy a single visible viewport on mobile devices (<= 768px).
- **Prohibited on Watchlist and Settings:** Personal utility surfaces—including `/watchlist`, notification management, and user preferences—are permanent ad-free safe zones.

### 2. Zero-CLS Reserved Containers
- Every ad slot must render a strictly reserved, fixed-height container (`min-h-[250px]` for rectangles, `min-h-[90px]` for horizontal leaderboards).
- When `NEXT_PUBLIC_ADS_ENABLED=false`, the slot returns `null`, adding zero markup to the DOM.
- When enabled, the fixed height prevents any Cumulative Layout Shift (CLS) when creative assets load.
- Containers are labeled with an explicit text badge: `Advertisement` in `--text-muted` uppercase micro-copy.

### 3. Deferred Script Execution
- Third-party ad scripts are never included in initial HTML head or hydration bundles.
- Scripts are lazily loaded only after first user interaction (pointerdown, keydown, scroll) or post-LCP `requestIdleCallback`, preserving Lighthouse Core Web Vitals budgets.



