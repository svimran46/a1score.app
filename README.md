# a1score.app — Football Player Database & Market Valuation Platform

**a1score.app** is a football intelligence and player analytics platform providing player career profiles, market value trajectory charts, transfer histories, competition standings, and squad valuations.

Modeled on the robust information architecture of Transfermarkt, with a 100% bespoke, modern dark-themed user interface, responsive charts, and server-rendered SEO-optimized pages using Next.js 14+ App Router and Incremental Static Regeneration (ISR).

---

## ⚡ Tech Stack

- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router, ISR, Server Components, Route Handlers)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom Dark Palette & Glassmorphic Surface System)
- **Database:** PostgreSQL (Hosted on Supabase or Neon)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Charts:** [Recharts](https://recharts.org/) (Responsive Area Charts with gradients & tooltips)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Automation:** GitHub Actions (`.github/workflows/sync-dataset.yml`)
- **Hosting:** Vercel

---

## 🏗️ Architecture & Pages

- **Home (`/`):** Global search bar, top competition quick links, and top most valuable players.
- **Player Profile (`/players/[slug]`):** Biographical header, current valuation, interactive valuation history chart over time, career statistics breakdown, transfer history timeline, and injury history.
- **Club Profile (`/clubs/[id]`):** Club badges, total squad valuation, and squad roster table ranked by player market value.
- **League Profile (`/leagues/[id]`):** Participating clubs ranked by total squad valuation.
- **Search & Explorer (`/search`):** Multi-attribute filtering across player positions and names.
- **API Handlers (`/api/...`):** Clean REST endpoints for search, player details, club details, and leagues.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 & 22)
- npm or npx
- A PostgreSQL database (e.g. from [Supabase](https://supabase.com/) or [Neon](https://neon.tech/))

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Set your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require"
```

### 3. Install & Push Prisma Schema

```bash
npm install
npm run db:push
```

### 4. Seed / Ingest Real Data

Populate clubs, competitions, players, valuations, and transfers directly using the zero-scraping CC0 dataset pipeline:

```bash
npm run sync:dataset
```

### 5. Run the Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 Data Pipeline

1. **Tier 1 (Primary - Ingested): `transfermarkt-datasets` (dcaribou)**
   - Weekly refreshed CC0 dataset published on Cloudflare R2 (`players`, `clubs`, `competitions`, `player_valuations`, `transfers`).
   - Run manually via `npm run sync:dataset` or automatically every Sunday via GitHub Actions.
2. **Tier 2 (Freshness - Optional): API-Football v3 REST API**
   - For daily match events and live injury status.

---

## 🚢 Deployment to Vercel

1. Push this repository to GitHub (`svimran46/a1score.app`).
2. Import the project into [Vercel](https://vercel.com/).
3. Add the `DATABASE_URL` environment variable under Project Settings.
4. Deploy! Next.js will automatically generate pages and handle ISR revalidation.

---

## License
MIT
