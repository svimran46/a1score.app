# a1score.app — Football Intelligence & Market Valuation Platform

**a1score.app** ("Money meets the pitch") is a high-performance football intelligence and player analytics platform providing player career profiles, market value trajectory benchmarks, verified transfer records, competition standings, and squad valuations.

Built with a bespoke dark-themed interface, responsive charts, and Edge-rendered pages using Next.js 14 App Router deployed on Cloudflare Pages.

---

## ⚡ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Edge Runtime across all routes)
- **Deployment & Edge Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/) via `@cloudflare/next-on-pages`
- **Language:** TypeScript (Strict mode, zero-warning builds)
- **Styling:** Tailwind CSS (Custom Dark Palette & Glassmorphic Surface System)
- **Data Layer:** [Supabase](https://supabase.com/) REST API (`@supabase/supabase-js`) with strict Row Level Security (RLS)
- **Live Match Feeds & Standings:** [FotMob API](https://www.fotmob.com/)
- **Market Values & Rosters:** Official Transfermarkt Dataset & Feeds
- **Charts:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Automation & Testing:** Node.js native test runner & GitHub Actions

---

## 🏗️ Architecture & Routes

All application routes run on the Edge Runtime (`export const runtime = "edge"`):

- **Home (`/`):** Live matches, market value risers, competition quick links, and intelligence search.
- **Matches (`/matches`, `/matches/[id]`):** Real-time scores, timeline events, lineups, and head-to-head records.
- **Player Profile (`/players/[slug]`):** Market valuation history, career stats, and transfer timeline.
- **Club Profile (`/clubs/[id]`):** Senior squad rosters, total squad valuation, and positional depth.
- **League Directory (`/leagues`, `/leagues/[id]`):** Club standings and valuation rankings.
- **Transfers (`/transfers`):** Recent market transfers and loan transactions.
- **Asset Proxy (`/img/...`):** Hardened server-side asset proxy with hostname allowlists and SSRF mitigation.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or Node 20+
- npm

### 2. Environment Setup

Create `.env` based on `.env.example`:

```bash
cp .env.example .env
```

Configure your Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_JWT]"
NEXT_PUBLIC_SITE_URL="https://a1score.app"
```

### 3. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Running Checks & Tests

```bash
npx tsc --noEmit     # TypeScript typecheck
npm run lint         # ESLint validation
npm test             # Unit test suite
npm run build        # Production Next.js build
npm run check:rls    # Supabase RLS security verification
```

---

## 🚢 Deployment to Cloudflare Pages

1. Connect your repository to Cloudflare Pages.
2. Build configuration:
   - **Framework preset:** `None` (or `Next.js (Static HTML Export)`)
   - **Build command:** `npx @cloudflare/next-on-pages`
   - **Build output directory:** `.vercel/output/static`
   - **Node.js compatibility flag:** `nodejs_compat`
   - **Compatibility date:** `2024-09-23` or newer
3. Environment variables in Cloudflare Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`

---

## License
MIT
