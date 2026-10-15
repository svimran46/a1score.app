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
| More: Transfer Centre (Filter ▾, Sort ▾) | Transfer Centre: Latest / Record fees / Contract ends, filter by type, league, fee and following, sort by date or fee | `/transfers` |
| More: TV schedules (country) | TV schedules by country, day tabs, channels per match (unofficial source for now) | `/tv` |
| More: Notifications | Notifications (push opt-in + what you follow) | `/settings/notifications` |
| More: Settings | Settings | `/settings` |
| Settings: Theme | Theme: System default / Light / Dark | `/settings` |
| Settings: Currency, Measurement | Currency (EUR / GBP / USD, converted at the ECB reference rate) and Measurement (cm / ft-in) | `/settings` |
| Settings: Language, Temperature | Language needs i18n; no weather data, so no Temperature | — |
| Settings → Others: Share, Tips and support, Privacy policy, Advertise, App version | Same, plus Methodology and Terms | `/settings` |
| Following: Teams / Players cards, Edit, + | Same; player cards show value change since followed; Compare shortcut | `/following` (`/watchlist` 308-redirects here) |
| Leagues: Find leagues, Following (Edit), All competitions | Same; star to follow a league from the list or its page | `/leagues` |
| News: For you / Latest / Transfers / Leagues | Same; For you = stories about what you follow | `/news` |
| Matches ⋮ menu: Edit alerts, By time, Collapse/Expand all | Same | `/matches` |
| Matches: Following group | Matches of followed clubs from every league, matched by FotMob team id | `/matches` |
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

### Phase 4 — Preferences that change data display ✅
- **Currency** (EUR / GBP / USD). All data stays in euros. Pages are still rendered and cached in euros (search engines, share images and push notifications keep €); in the browser every figure converts with the latest ECB reference rate from `/api/fx` (cached 12 h). With no rate available, figures stay in euros. Settings shows the rate and its date.
  - Client components format with `useMoney()`; server components render `<Money eur={…} />`.
  - Fixed euro bands (filter options like "€50M+", the "points per €10M" index) stay in euros because they define the bands.
- **Measurement system** (cm / ft-in) for player height.
- **Following group at the top of Matches**: uses the existing FotMob team id → a1score club id table (`FOTMOB_TEAM_MAPPINGS`, 132 clubs), so a followed club only matches its own fixtures. Clubs not in that table don't appear until they are mapped.

### Phase 5 — Transfer Centre and TV schedules ✅
- Transfer Centre tabs: Latest, Record fees, Contract ends.
- Filter menu: type (Loan includes loans with an option to buy), league, fee ≥ €10M (label shown in the display currency), following only. Active filters show as removable chips.
- Sort menu: newest first, highest fee.
- League and following filters use club ids: transfer club names are matched exactly to tracked clubs in the data layer. Moves between untracked clubs only appear under "All leagues".
- Not built: the FotMob bell for transfer news. a1score has no transfer alerts to subscribe to yet; it belongs with Phase 6 notifications.
- **TV schedules** (`/tv?country=XX`): day tabs in the viewer's timezone, kick-off time, teams with crests, and every TV channel / stream per match; 33 countries. Opens the saved country, else one guessed from the browser language; More shows it ("TV schedules · Malaysia").
  - **Temporary unofficial source:** FotMob's public `/api/data/tvlistings` endpoint, behind a `TvProvider` interface (`src/lib/tv`). To move to an official provider, implement `TvProvider` and change one line in `src/lib/tv/index.ts`; the page credits the source and stays out of search results (`noindex`) until then.

### Phase 6 — Accounts and games
- Sign in to sync follows and settings across devices (Supabase Auth); migrates the device's local follows on first sign-in.
- Predict (score predictions, 2 pts outcome / 3 pts exact, leagues with friends) and Lineup Builder. Both need accounts and server-side storage.
