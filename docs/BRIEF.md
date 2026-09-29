PROJECT BRIEF: a1score.app

WHAT IT IS
A football intelligence site: player profiles, market-value history, transfer analytics, club/league pages, and a live match center. Live at https://a1score.pages.dev/.

POSITIONING (this drives every decision)
"Money meets the pitch." Most sites do either live scores or player valuations. We combine them: squad market values inside the match center, value-vs-results analytics, value movers, and value history charts. Every feature should reinforce that identity.

STACK (verified from repo)
- Next.js (App Router) deployed on Cloudflare Pages (Edge Runtime)
- Code on GitHub
- FotMob API for live matches, fixtures, match events, confirmed lineups, match stats, player season stats, and league standings (zero-cost, edge-compatible anti-bot signature protocol)
- Transfermarkt for market values, valuation history, player profiles, transfer history, and club squad values (curated open dataset + direct edge live proxy)
- Database & ORM: Supabase PostgreSQL with Prisma ORM (for schema & ingestion scripts) and @supabase/supabase-js (for Cloudflare Edge runtime HTTP queries)

DESIGN DIRECTION
Ink black and amber. Premium, calm, editorial. Dark by default, with a light theme. Details are in Phase 2.

ENGINEERING RULES (apply to every task)
1. Read before writing. Inspect the repo, then propose a plan and WAIT for approval before editing.
2. Never break existing routes or URLs. If a URL must change, add a redirect.
3. TypeScript strict. No `any` unless commented with a reason.
4. Small, reviewable commits with clear messages. Work on a feature branch, never on main.
5. No new dependency without a one-line justification and a bundle-size note. Prefer what's already installed.
6. Never commit secrets. All keys go through env vars; update `.env.example`.
7. Never invent data. If a field isn't in a real source, hide the UI for it rather than fabricating.
8. Accessibility: semantic HTML, visible focus states, keyboard support, WCAG AA contrast, respect prefers-reduced-motion.
9. Performance budget: LCP < 2.0s on mobile 4G for home/player/club pages, CLS < 0.05, keep client JS lean (server components by default; client components only where interaction requires).
10. Cloudflare compatibility: check every API/route/library against the Cloudflare Pages runtime (edge vs node) before using it.
11. Destructive database changes (drops, dedupes, migrations that lose data) need a dry run report and my explicit approval first.
12. Every phase ends with: a summary of what changed, files touched, how to test manually, and any follow-ups or risks.
