# LiveScore

A football live-scores website — live scores, league tables, fixtures, lineups, stats, and
team/player profiles, in the spirit of FotMob/SofaScore but an original product with an
original identity.

## Stack

- **Next.js 16 (App Router)** · React 19 · TypeScript (strict, zero `any`)
- **Tailwind CSS v4** (CSS-first config) · shadcn/ui primitives
- **TanStack Query v5** for client polling · **Zustand** for favorites/UI state
- **Zod** schemas as the single source of truth for every external payload
- **Motion** for micro-interactions · **next-themes** for flash-free light/dark
- Vitest + React Testing Library (unit/component) · Playwright (E2E)

## Architecture — one shared key, one shared cache

```
Browser (Client Components)
   — TanStack Query polls OUR routes only, never api-sports.io
        ↓
Route Handlers  (src/app/api/**/route.ts)
   — the ONLY code that touches API configuration
        ↓
lib/api-football/*  (server-only fetchers)
   — fetch() with next.revalidate — this IS the shared cache
        ↓
BunnyCDN pull zone (optional — see docs/CDN_SETUP.md)
   — edge rule injects x-apisports-key; per-endpoint edge caching
        ↓
API-Football (v3.football.api-sports.io)
```

**CDN mode** (per API-Football's "Optimizing Sports Websites with BunnyCDN" guide): set
`API_FOOTBALL_CDN_URL` to your pull-zone URL and all server→API traffic flows through it;
the CDN edge rule injects the API key (the app stops sending it) and edge-caches
responses per endpoint. Optionally set `API_FOOTBALL_CDN_MEDIA_URL` and every
logo/photo URL is rewritten through your media zone (the image allow-list extends
automatically). See **docs/CDN_SETUP.md** for the full setup and verification steps.

- `API_FOOTBALL_KEY` is server-only. It is read exactly once, in
  `src/lib/api-football/client.ts`, and never prefixed `NEXT_PUBLIC_`. The `server-only`
  package makes it a build error to import a fetcher from client code, and the compiled
  client bundles contain no key, no auth header, and no upstream host.
- Every upstream response is cached once per deployment by the Next.js Data Cache and
  shared by **all** visitors. Client polling hits our own routes, which read the cache —
  so 10,000 visitors polling live scores still produce at most one upstream call per
  25-second window. Idle periods cost zero API calls (no cron warming needed).
- Revalidate windows follow the spec: live 25s · date fixtures 5min · finished 7d ·
  standings 15min–6h (gameweek-aware) · profiles 24h · top scorers 12h · leagues 7d.
- Daily upstream call volume is tracked in-process and exposed at `/api/status`.

## Error handling

Every fetcher returns `Result<T>` with a typed `AppError` (`network`, `rate_limited`,
`timeout`, `api_error`, `validation`, `http`, `unknown`). API-Football can return HTTP 200
with a non-empty `errors` object — that is detected and surfaced, never trusted by status
code alone. A failed Zod parse is a `validation` error, not a crash. `rate_limited` never
auto-retries in the client.

## Pages

`/` Matches (date tabs + live merge/poll) · `/leagues` · `/leagues/[id]` (fixtures, table,
top scorers, top assists) · `/matches/[id]` (overview, lineups, stats, H2H) ·
`/teams/[id]` · `/players/[id]` · `/search` · `/favorites` · `/settings`

Every page has Loading (skeleton), Empty, Error (retry), and Success states from one
shared component set. Match rows animate score changes; live badges pulse (static under
`prefers-reduced-motion`).

## Deploying

Self-hosting on a VPS is documented in **[DEPLOYMENT.md](DEPLOYMENT.md)**: the build
uses `output: "standalone"` (self-contained server in `.next/standalone`), and the repo
ships ready-made configs — `deploy/Caddyfile` (automatic-HTTPS reverse proxy),
`deploy/ecosystem.config.js` (pm2) and `deploy/livescore.service` (systemd, pick one).

## Commands

```bash
bun install        # install
bun run dev        # dev server on 0.0.0.0:3000
bun run build      # production build
bun run lint       # eslint (next/core-web-vitals + typescript)
bun run typecheck  # tsc --noEmit
bun test           # vitest unit/component tests
bun run test:e2e   # playwright (needs API_FOOTBALL_KEY + dev server)
```

## Scope choices & follow-ups

- **No account system.** Favorites live in localStorage via a persisted Zustand store.
  Auth.js + a database is a natural later addition.
- **Per-IP rate limiter** on `/api/*` routes is in-memory (resets per instance). For
  multi-instance hosting, swap in a shared store (e.g. Upstash Redis).
- **Vercel Cron warning:** the Hobby tier caps crons at once per day. The reactive cache
  here needs no cron; if you later want proactive warming, use an external pinger hitting
  a `/api/warm` route, or Vercel Pro.
- Team "Stats" tab derives season form from recent results rather than calling
  `/teams/statistics` without a league context; wire the league id through to enable it.

## Data

Data by [API-Football v3](https://www.api-football.com/). LiveScore is an independent
project and is not affiliated with any club or league.
