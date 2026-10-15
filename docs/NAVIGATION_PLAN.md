# Navigation & menus plan (FotMob-style)

Goal: give a1score the menu structure people already know from FotMob (bottom
bar, More hub, Settings, Following, Leagues and News tabs) while keeping what
makes a1score different: market values on every surface.

Out of scope by decision: **Follow us** and **Redeem code**.

## Information architecture

| FotMob | a1score | Route |
|---|---|---|
| Bottom bar: Matches · News · Leagues · Following · More | Same five tabs | `/matches` `/news` `/leagues` `/following` `/more` |
| More: account card | "Saved on this device" note (no accounts yet) | `/more` |
| More: FotMob+, Lineup Builder, Predict | Market Values, Compare Players (Predict / Lineup Builder are later phases) | `/values` `/compare` |
| More: Transfer Centre | Transfer Centre | `/transfers` |
| More: TV schedules | Later phase (needs a broadcast data source) | — |
| More: Notifications | Notifications (push opt-in + what you follow) | `/settings/notifications` |
| More: Settings | Settings | `/settings` |
| Settings: Theme | Theme: System default / Light / Dark | `/settings` |
| Settings: Language, Currency, Measurement, Temperature | Currency + Measurement in Phase 4; Language needs i18n; no weather data, so no Temperature | — |
| Settings → Others: Share, Tips and support, Privacy policy, Advertise, App version | Same, plus Methodology and Terms | `/settings` |
| Following: Teams / Players cards, Edit, + | Same; player cards show value change since followed; Compare shortcut | `/following` (`/watchlist` 308-redirects here) |
| Leagues: Find leagues, Following (Edit), All competitions | Same; star to follow a league from the list or its page | `/leagues` |
| News: For you / Latest / Transfers / Leagues | Same; For you = stories about what you follow | `/news` |
| Matches ⋮ menu: Edit alerts, By time, Collapse/Expand all | Same | `/matches` |
| Desktop | Left sidebar mirrors the same groups (Browse / Tools / Account) | all |

Single source of truth: `src/lib/nav/config.ts` drives the bottom bar, the
desktop sidebar and the More hub, so the three can't drift apart.

## Phases

Each phase ships only when `npx tsc --noEmit`, `npm run lint`,
`npm run lint:colors`, `npm run test:unit` and `npm run build` pass, and the
new screens are checked at 390px in dark and light themes.

### Phase 1 — Bottom bar, More hub, Settings ✅
- New bottom bar (Matches · News · Leagues · Following · More); More is a page, not a sheet.
- `/more` hub and `/settings` (Theme with System default, Share, Tips and support, Privacy, Terms, Methodology, Advertise, App version).
- Theme preference shared by the header toggle, Settings and the pre-paint boot script.

### Phase 2 — Following, league follows, Notifications ✅
- `/following` with Teams / Players cards, Edit mode and "+" (opens search).
- Follows extended to leagues (`type: "league"`); star on `/leagues` rows and league pages.
- `/leagues`: Find leagues, Following with Edit, All competitions.
- `/settings/notifications`: push opt-in plus followed Players / Teams / Leagues.
- Desktop left sidebar restructured to mirror the mobile menus.

### Phase 3 — Matches and News ✅
- Matches ⋮ menu: By time (remembered), Collapse all, Expand all, Edit alerts.
- News tabs: For you (falls back to Latest with a nudge), Latest, Transfers, Leagues (with league chips).

### Phase 4 — Preferences that change data display
- Currency (EUR / GBP / USD) applied through `formatCompactEur` and friends, with a dated exchange-rate source.
- Measurement system (cm / ft-in) for player height.
- "Following" group at the top of Matches. Needs a reliable club ↔ FotMob team id mapping first; matching on names would show wrong teams.

### Phase 5 — Transfer Centre and TV schedules
- Transfer Centre filter (league, type: permanent / loan / free) and sort (date, fee), bell to follow transfer news.
- TV schedules by country, only once a licensed broadcast-listings source is chosen.

### Phase 6 — Accounts and games
- Sign in to sync follows and settings across devices (Supabase Auth); migrates the device's local follows on first sign-in.
- Predict (score predictions, 2 pts outcome / 3 pts exact, leagues with friends) and Lineup Builder. Both need accounts and server-side storage.
