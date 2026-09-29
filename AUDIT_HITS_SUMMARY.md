# THIRD-PARTY SOURCE AUDIT HITS
Total files: 36 | Total non-CSV hits: 234

### docs\AUDIT.md (23 hits)
- **L84**: `* Fields: 'id' (cuid, PK), 'fullName', 'commonName', 'dateOfBirth', 'nationality' (text array), 'position', 'subPosition', 'preferredFoot', 'heightCm', 'photoUrl', 'apiFootballId' (Int, unique), 'transfermarktId' (String, unique), 'latestMarketValue' (BigInt), 'lastSeason' (Int), 'currentClubId' (FK -> Club.id), 'createdAt', 'updatedAt'.`
- **L87**: `* Fields: 'id' (cuid, PK), 'name', 'code', 'logoUrl', 'country', 'transfermarktId' (unique), 'totalMarketValue' (BigInt), 'squadSize' (Int), 'leagueId' (FK -> League.id).`
- **L90**: `* Fields: 'id' (cuid, PK), 'name', 'country', 'tier', 'logoUrl', 'transfermarktId' (unique), 'totalMarketValue' (BigInt), 'totalPlayers' (Int), 'clubCount' (Int).`
- **L109**: `* **Source:** Open Transfermarkt dataset mirror ('https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data' / Kaggle).`
- **L115**: `* **Source:** FotMob API ('https://www.fotmob.com/api/data/matches' and '/api/data/matchDetails').`
- **L116**: `* **Implementation:** 'src/lib/fotmob/client.ts' generates dynamic 'x-mas' anti-bot headers using pure-JS MD5 hashing without Node dependencies.`
- **L119**: `* **Source:** Transfermarkt direct web scraping proxy ('src/lib/transfermarkt/client.ts').`
- **L122**: `* **Decision:** Replace API-Football entirely with **FotMob API** + **Transfermarkt**.`
- **L123**: `* **Rationale:** Eliminates API-Football's restrictive 100 req/day paywall and missing credentials. FotMob API provides fixtures, live scores, confirmed match lineups with formations, team stats, live events, league tables, and player ratings at zero cost with edge authentication. Transfermarkt provides player valuation histories, transfer records, career bios, and club rosters.`
- **L124**: `* **Action Items:** Season stats, league standings, and live matches will use FotMob API edge endpoints; market values and career transfers will use Transfermarkt data.`
- **L146**: `* Explicit patterns: 'img.a.transfermarkt.technology', 'tmssl.akamaized.net', 'media.api-sports.io', 'images.unsplash.com'.`
- **L148**: `* **16,649 player portraits:** Hotlinked directly to 'https://img.a.transfermarkt.technology/portrait/header/...'.`
- **L149**: `* **Team Crests:** Hotlinked directly to 'https://images.fotmob.com/image_resources/logo/teamlogo/...' and 'https://img.a.transfermarkt.technology/wappen/...'.`
- **L190**: `* Implemented 'OFFICIAL_LEAGUE_CLUB_COUNTS' in 'src/lib/fotmob/client.ts' mapping tier-1 competitions to their exact official team count (Premier League: 20, LaLiga: 20, Serie A: 20, Bundesliga: 18, Ligue 1: 18).`
- **L191**: `* In 'src/lib/data/leagues.ts', 'getLeagueById' and 'getLeagues' dynamically prioritize FotMob's live 'standings.length' / 'teamsCount' and 'OFFICIAL_LEAGUE_CLUB_COUNTS' over the stale cumulative CSV counts.`
- **L209**: `### d. Images are hotlinked from 'img.a.transfermarkt.technology' and 'images.fotmob.com'`
- **L236**: `* Created 'src/components/PlayerIntelligenceRibbon.tsx' and integrated FotMob live tournament season stats.`
- **L237**: `* Displays goals, assists, matches, minutes, and FotMob average match ratings for active competitions alongside Transfermarkt valuation trajectory.`
- **L252**: `* Harmonized Transfermarkt live roster proxy ('tmGetClub') with database records to ensure full roster visibility.`
- **L259**: `* In 'src/lib/fotmob/client.ts', implemented 'cardReconciliation' which tallies on-pitch yellow/red card events against aggregate match statistics.`
- **L266**: `1. **FotMob API & Cloudflare Edge Ingestion:**`
- **L267**: `* Pure JS MD5 signature generator implemented without native Node.js crypto dependencies ('src/lib/fotmob/crypto.ts').`
- **L281**: `| **Phase 0** | 'chore/audit' | '6b9783f' | Repository audit, '/docs/BRIEF.md', '/docs/AUDIT.md', FotMob + Transfermarkt architecture. | Completed |`

### docs\AUDIT_HANDOFF.md (14 hits)
- **L7**: `**Data Providers:** FotMob API (Live scores, confirmed tactical lineups, OPTA match stats, league tables) + Transfermarkt (Player market valuations, 254k+ historical valuation points, commercial transfer records, club rosters). **Strictly zero dependency on API-Football.**`
- **L15**: `2. **Transfer Sites (e.g. Transfermarkt):** Provide rich valuation and transfer data, but lack real-time live match centers, tactical pitch boards, and live financial disparity barometers.`
- **L26**: `1. **FotMob API:** Reverse-engineered edge client with dynamic pure-JavaScript MD5 anti-bot signature generator ('x-mas' header) running without native Node.js crypto dependencies. Supplies live fixtures, scores, pitch coordinates, events, and standings at zero cost.`
- **L27**: `2. **Transfermarkt Ingestion & Live Proxy:** Open dataset mirror ingested into Supabase (16k+ players, 254k+ valuation points, 100k+ transfers) supplemented by an edge HTML/CEAPI parser ('src/lib/transfermarkt/client.ts').`
- **L46**: `| **a** | **Impossible Top-Flight Club Counts** (PL showed 37 clubs, Serie A showed 39) | Kaggle 'clubs.csv' linked every club that played in top flights between 2013–2024 to the league without season scoping. | Defined 'OFFICIAL_LEAGUE_CLUB_COUNTS' in 'src/lib/fotmob/client.ts'. 'getLeagueById' and 'getLeagues' in 'src/lib/data/leagues.ts' dynamically prioritize FotMob live standings team count and official league sizes (20 for PL/LaLiga/Serie A, 18 for Bundesliga/Ligue 1). | 'src/lib/fotmob/client.ts', 'src/lib/data/leagues.ts' |`
- **L49**: `| **d** | **Image CDN Single Point of Failure (Hotlinks)** | 16,649 player portraits hotlinked directly from Transfermarkt CDN without fallbacks. | Implemented resilient SVG fallback avatars ('Shield', 'User', 'Trophy') that render automatically if remote images are blocked or missing. | 'src/components/SafeImage.tsx', 'src/components/PlayerCard.tsx', 'src/components/MatchCard.tsx' |`
- **L52**: `| **g** | **Missing Season Stats for Star Players** | 'SeasonStats' table contained 0 rows, resulting in "No detailed season stats recorded" for Haaland, Mbappé, Yamal. | Built 'PlayerIntelligenceRibbon.tsx' synthesizing real-time FotMob tournament stats (goals, assists, FotMob ratings) with Transfermarkt valuation velocity. | 'src/components/PlayerIntelligenceRibbon.tsx', 'src/app/players/[slug]/page.tsx' |`
- **L54**: `| **i** | **Incomplete Club Squads** | Transfermarkt HTML scraping only returned first-team roster (~20 players) while DB mixed youth players without values. | Created 'SquadValuationPyramid.tsx' providing a 4-tier valuation pyramid (*World Class/Elite*, *Key Starters*, *Core Squad*, *Rotation/Prospects*), positional capital splits, and demographic indexes (average age, asset concentration). | 'src/components/SquadValuationPyramid.tsx', 'src/app/clubs/[id]/page.tsx' |`
- **L55**: `| **j** | **Match Timelines Disagreeing with Match Stats** | OPTA match stats counted bench bookings and post-whistle cards, while timeline only listed on-pitch incidents. | Built 'MatchTimeline.tsx' and implemented 'cardReconciliation' in 'src/lib/fotmob/client.ts' to tally on-pitch vs aggregate disciplinary cards with an explanatory footnote. | 'src/components/MatchTimeline.tsx', 'src/lib/fotmob/client.ts', 'src/app/matches/[id]/page.tsx' |`
- **L70**: `8. **'src/components/PlayerIntelligenceRibbon.tsx'**: Career intelligence header synthesizing FotMob tournament stats with Transfermarkt valuation velocity and peak delta.`
- **L71**: `9. **'src/components/PitchLineup.tsx'**: Responsive tactical pitch board with official SVG field markings, true FotMob '{x, y}' coordinate positioning, jersey numbers, and valuation badges.`
- **L98**: `15. **'src/lib/fotmob/client.ts'**: Added 'OFFICIAL_LEAGUE_CLUB_COUNTS', pure-JS MD5 'x-mas' header signing, and card reconciliation logic.`
- **L101**: `18. **'src/lib/data/leagues.ts'**: Added dynamic club count prioritization and FotMob live table integration.`
- **L124**: `3. **No Fabricated Data:** Confirm that whenever data is unavailable from FotMob or Transfermarkt, the UI hides the respective metric or displays an honest placeholder rather than inventing dummy numbers.`

### docs\BRIEF.md (3 hits)
- **L23**: `1. **FotMob API:** Exclusively supplies fixtures, live match events, confirmed starting lineups, pitch coordinates, official match stats, and league standings. Authenticated via pure-JS MD5 anti-bot signature generator ('x-mas' protocol) with zero Node crypto dependencies.`
- **L24**: `2. **Transfermarkt:** Exclusively supplies player market valuations, historical valuation snapshots, career player profiles, and commercial transfer fees (open Kaggle dataset mirror in Supabase + live edge scraper proxy 'src/lib/transfermarkt/client.ts').`
- **L35**: `2. **Lineup Valuation Coverage Guard:** When calculating Starting XI valuations or disparity ratios from FotMob lineups, always compute and display the coverage ratio (e.g. '"8/11 valued"'). If coverage is incomplete, qualify or suppress the disparity banner to prevent false narratives.`

### next.config.mjs (2 hits)
- **L16**: `hostname: 'img.a.transfermarkt.technology',`
- **L24**: `hostname: 'images.fotmob.com',`

### prisma\schema.prisma (3 hits)
- **L24**: `transfermarktId String?              @unique`
- **L48**: `transfermarktId String?  @unique`
- **L68**: `transfermarktId  String?  @unique`

### README.md (2 hits)
- **L5**: `Modeled on the robust information architecture of Transfermarkt, with a 100% bespoke, modern dark-themed user interface, responsive charts, and server-rendered SEO-optimized pages using Next.js 14+ App Router and Incremental Static Regeneration (ISR).`
- **L82**: `1. **Tier 1 (Primary - Ingested): 'transfermarkt-datasets' (dcaribou)**`

### scripts\backfill-and-enhance.ts (7 hits)
- **L54**: `const dbPlayers = await client.query('SELECT "transfermarktId" FROM "Player"');`
- **L55**: `const dbTmIds = new Set(dbPlayers.rows.map(r => r.transfermarktId));`
- **L84**: `WHERE p."transfermarktId" = u.tm_id;`
- **L138**: `WHERE l."transfermarktId" = $1;`
- **L155**: `WHERE "transfermarktId" = $7;`
- **L179**: `SELECT "transfermarktId", name, country, "clubCount", "totalPlayers", "totalMarketValue"`
- **L185**: `code: r.transfermarktId,`

### scripts\mirror-images-to-r2.ts (1 hits)
- **L5**: `* Mirrors club crests and player portrait images from Transfermarkt to a Cloudflare R2 bucket.`

### scripts\season-scope-clubs.ts (5 hits)
- **L65**: `const dbClubsRes = await client.query('SELECT id, "transfermarktId", name, "leagueId" FROM "Club"');`
- **L79**: `if (c.transfermarktId && tmMap.has(c.transfermarktId)) {`
- **L81**: `updates.push({ id: c.id, season: tmMap.get(c.transfermarktId)! });`
- **L133**: `WHERE l."transfermarktId" = $1 AND c."lastSeason" = 2025;`
- **L149**: `WHERE "transfermarktId" = $4;`

### scripts\sync-dataset.ts (13 hits)
- **L5**: `* Downloads and syncs CC0 curated data from transfermarkt-datasets (dcaribou)`
- **L129**: `where: { transfermarktId: r.competition_id },`
- **L136**: `transfermarktId: r.competition_id,`
- **L153**: `const leagueMap = new Map(leagues.map((l) => [l.transfermarktId, l.id]));`
- **L161**: `where: { transfermarktId: String(r.club_id) },`
- **L168**: `transfermarktId: String(r.club_id),`
- **L189**: `const clubs = await prisma.club.findMany({ select: { id: true, transfermarktId: true } });`
- **L190**: `const clubMap = new Map(clubs.map((c) => [c.transfermarktId, c.id]));`
- **L203**: `transfermarktId: String(r.player_id),`
- **L236**: `select: { id: true, transfermarktId: true },`
- **L238**: `const playerMap = new Map(players.map((p) => [p.transfermarktId, p.id]));`
- **L281**: `select: { id: true, transfermarktId: true },`
- **L283**: `const playerMap = new Map(players.map((p) => [p.transfermarktId, p.id]));`

### scripts\validate-data.ts (8 hits)
- **L78**: `'SELECT "clubCount", "name" FROM "League" WHERE "transfermarktId" = $1',`
- **L88**: `WHERE l."transfermarktId" = $1 AND c."lastSeason" = 2025',`
- **L115**: `SELECT "transfermarktId", COUNT(*) as cnt`
- **L117**: `WHERE "transfermarktId" IS NOT NULL`
- **L118**: `GROUP BY "transfermarktId"`
- **L126**: `name: "Zero Duplicate Players (by transfermarktId)",`
- **L131**: `? "No duplicate transfermarktId found in Player table."`
- **L132**: `: 'Found ${dupCount} duplicated transfermarktId values.',`

### src\app\api\matches\route.ts (1 hits)
- **L2**: `import { getMatchesByDate, pureMd5 } from "@/lib/fotmob/client";`

### src\app\api\matches\[id]\route.ts (1 hits)
- **L2**: `import { getMatchDetails, pureMd5 } from "@/lib/fotmob/client";`

### src\app\api\players\most-valuable\route.ts (1 hits)
- **L10**: `* Mirrors Transfermarkt "Most valuable players in the world" page.`

### src\app\clubs\[id]\page.tsx (1 hits)
- **L178**: `p.transfermarktId || p.id`

### src\app\leagues\[id]\page.tsx (1 hits)
- **L114**: `{/* Standings Table (if available from FotMob) */}`

### src\app\matches\page.tsx (3 hits)
- **L2**: `import { getMatchesByDate } from "@/lib/fotmob/client";`
- **L16**: `"Live football scores, real-time match events, confirmed tactical lineups, and squad market values powered by edge FotMob integration on a1score.app.",`
- **L107**: `Real-time scores, lineups, and match stats powered by FotMob API`

### src\app\matches\[id]\page.tsx (1 hits)
- **L4**: `import { getMatchDetails } from "@/lib/fotmob/client";`

### src\app\methodology\page.tsx (7 hits)
- **L10**: `"Explore how a1score.app powers 'Money meets the pitch' through our dual data architecture: Transfermarkt market valuation intelligence and FotMob live match feeds.",`
- **L32**: `{/* Source 1: Transfermarkt */}`
- **L42**: `Transfermarkt Intelligence`
- **L46**: `Market values, career valuation trajectories, historical transfers, contract durations, and club squad values are sourced directly from curated Transfermarkt data feeds and real-time edge scrapers.`
- **L64**: `{/* Source 2: FotMob API */}`
- **L74**: `FotMob Match Intelligence`
- **L78**: `Live fixtures, in-play scores, confirmed tactical lineups with pitch formations, real-time match events, official league tables, and player tournament performance are powered by edge-authenticated FotMob protocols.`

### src\app\page.tsx (3 hits)
- **L4**: `import { getMatchesByDate } from "@/lib/fotmob/client";`
- **L235**: `<p className="text-xs text-slate-400">Verified market valuations curated from Transfermarkt intelligence</p>`
- **L274**: `Read our methodology on how Transfermarkt valuations, career curve graphs, and FotMob live match events are processed with zero fabricated numbers.`

### src\app\sitemap.ts (1 hits)
- **L91**: `p.transfermarktId || p.id`

### src\components\ClubTransferLedger.tsx (3 hits)
- **L31**: `transfermarktId?: string | null;`
- **L157**: `p.transfermarktId || p.id`
- **L241**: `Verified Transfermarkt Commercial Ledger`

### src\components\CommandPalette.tsx (2 hits)
- **L26**: `transfermarktId?: string | null;`
- **L242**: `p.transfermarktId || p.id`

### src\components\Footer.tsx (1 hits)
- **L45**: `Combining Transfermarkt valuation analytics with FotMob real-time match delivery.`

### src\components\MatchCard.tsx (2 hits)
- **L3**: `import { FotmobMatch } from "@/lib/fotmob/client";`
- **L7**: `match: FotmobMatch;`

### src\components\PitchLineup.tsx (1 hits)
- **L273**: `// If FotMob provides verticalLayout coordinates`

### src\components\PlayerCard.tsx (2 hits)
- **L13**: `transfermarktId?: string | null;`
- **L26**: `player.transfermarktId || player.id`

### src\components\PlayerIntelligenceRibbon.tsx (1 hits)
- **L129**: `FotMob x Transfermarkt Synthesis`

### src\components\SquadValuationPyramid.tsx (2 hits)
- **L30**: `transfermarktId?: string | null;`
- **L452**: `p.transfermarktId || p.id`

### src\lib\data\clubs.ts (6 hits)
- **L2**: `import { tmGetClub } from "@/lib/transfermarkt/client";`
- **L5**: `// 1. Try Transfermarkt live proxy for up-to-date squads and valuations`
- **L29**: `transfermarktId,`
- **L35**: `.or('id.eq.${id},transfermarktId.eq.${id}')`
- **L128**: `transfermarktId`
- **L150**: `transfermarktId`

### src\lib\data\leagues.ts (15 hits)
- **L4**: `FotmobStandingsRow,`
- **L5**: `} from "@/lib/fotmob/client";`
- **L17**: `transfermarktId,`
- **L30**: `.filter((l) => l.transfermarktId !== "CL" || Number(l.totalMarketValue) > 0)`
- **L57**: `transfermarktId,`
- **L71**: `.or('id.eq.${id},transfermarktId.eq.${id}')`
- **L79**: `// Attempt to fetch official live standings from FotMob`
- **L80**: `let fotmobData: {`
- **L84**: `standings: FotmobStandingsRow[];`
- **L88**: `fotmobData = await getLeagueStandings(league.transfermarktId);`
- **L90**: `console.warn('[Data Layer] FotMob standings fetch failed for league ${league.name}:', e);`
- **L99**: `fotmobData?.teamsCount ||`
- **L117**: `const enrichedStandings = (fotmobData?.standings || []).map((row) => {`
- **L138**: `transfermarktId: league.transfermarktId,`
- **L144**: `season: fotmobData?.season || "2024/2025",`

### src\lib\data\players.ts (25 hits)
- **L6**: `} from "@/lib/transfermarkt/client";`
- **L7**: `import { getFotmobPlayerStats } from "@/lib/fotmob/client";`
- **L10**: `// 1. First, attempt to fetch live worldwide rankings directly via Transfermarkt proxy`
- **L31**: `transfermarktId,`
- **L73**: `const fotmobData = await getFotmobPlayerStats(livePlayer.commonName || livePlayer.fullName);`
- **L74**: `if (fotmobData && fotmobData.seasonStats && fotmobData.seasonStats.length > 0) {`
- **L75**: `livePlayer.seasonStats = fotmobData.seasonStats;`
- **L113**: `.or('id.eq.${slugOrId},transfermarktId.eq.${possibleTmId},transfermarktId.eq.${slugOrId}')`
- **L142**: `// If seasonStats is empty, enrich with authentic FotMob tournament statistics`
- **L146**: `const fotmobData = await getFotmobPlayerStats(player.commonName || player.fullName);`
- **L147**: `if (fotmobData && fotmobData.seasonStats && fotmobData.seasonStats.length > 0) {`
- **L148**: `sortedSeasonStats = fotmobData.seasonStats;`
- **L150**: `if (fotmobData && fotmobData.injury && injuries.length === 0) {`
- **L153**: `id: 'fotmob-inj-${fotmobData.id}',`
- **L154**: `type: fotmobData.injury.injuryType || "Injury",`
- **L155**: `startDate: fotmobData.injury.startDate || new Date().toISOString(),`
- **L156**: `endDate: fotmobData.injury.expectedReturn || null,`
- **L162**: `console.warn('[Data Layer] FotMob enrichment failed for ${player.fullName}:', err);`
- **L188**: `// 1. Live search via Transfermarkt proxy when searching by name`
- **L211**: `transfermarktId,`
- **L284**: `transfermarktId,`
- **L320**: `p.transfermarktId || p.id`
- **L402**: `transfermarktId,`
- **L420**: `.filter((p: any) => p.id !== excludePlayerId && p.transfermarktId !== excludePlayerId)`
- **L431**: `slug: '${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${p.transfermarktId || p.id}',`

### src\lib\fotmob\client.ts (53 hits)
- **L2**: `* src/lib/fotmob/client.ts`
- **L4**: `* Edge-compatible FotMob Live Match Intelligence Client`
- **L9**: `const FOTMOB_BASE = "https://www.fotmob.com";`
- **L11**: `const FOTMOB_HEADERS = {`
- **L15**: `Referer: "https://www.fotmob.com/",`
- **L166**: `// Generate the authentic FotMob x-mas anti-bot header`
- **L183**: `export async function fotmobFetch<T = any>(path: string, revalidate = 5): Promise<T | null> {`
- **L184**: `const url = '${FOTMOB_BASE}${path}';`
- **L194**: `...FOTMOB_HEADERS,`
- **L202**: `console.warn('[FotMob API] ${path} returned status ${res.status}');`
- **L208**: `console.error('[FotMob API Error] Failed fetching ${path}:', err.message || err);`
- **L215**: `export interface FotmobTeam {`
- **L223**: `export interface FotmobMatch {`
- **L230**: `home: FotmobTeam;`
- **L231**: `away: FotmobTeam;`
- **L252**: `export interface FotmobLeagueGroup {`
- **L257**: `matches: FotmobMatch[];`
- **L265**: `leagues: FotmobLeagueGroup[];`
- **L277**: `const data = await fotmobFetch<any>(path, 5); // 5s cache for ultra-responsive live scores`
- **L291**: `const leagues: FotmobLeagueGroup[] = data.leagues.map((l: any) => {`
- **L292**: `const matches: FotmobMatch[] = (l.matches || []).map((m: any) => {`
- **L313**: `? 'https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}_small.png'`
- **L322**: `? 'https://images.fotmob.com/image_resources/logo/teamlogo/${m.away.id}_small.png'`
- **L357**: `export const FOTMOB_LEAGUE_MAP: Record<string, number> = {`
- **L378**: `export interface FotmobStandingsRow {`
- **L401**: `standings: FotmobStandingsRow[];`
- **L403**: `let fotmobId: number | undefined;`
- **L406**: `fotmobId = leagueIdOrCode;`
- **L408**: `fotmobId = Number(leagueIdOrCode);`
- **L410**: `fotmobId = FOTMOB_LEAGUE_MAP[leagueIdOrCode.toUpperCase()] || FOTMOB_LEAGUE_MAP[leagueIdOrCode];`
- **L413**: `if (!fotmobId) {`
- **L417**: `const path = '/api/data/leagues?id=${fotmobId}';`
- **L418**: `const data = await fotmobFetch<any>(path, 300); // 5 min cache for league standings`
- **L427**: `const standings: FotmobStandingsRow[] = rawTable.map((row: any) => ({`
- **L440**: `imageUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/${row.id}_small.png',`
- **L444**: `leagueId: fotmobId,`
- **L452**: `* Search FotMob for players, teams, or leagues`
- **L454**: `export async function searchFotmob(query: string) {`
- **L458**: `const data = await fotmobFetch<any>(path, 60);`
- **L472**: `imageUrl: 'https://images.fotmob.com/image_resources/playerimages/${s.id}.png',`
- **L480**: `imageUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/${s.id}_small.png',`
- **L489**: `export async function getFotmobPlayerStats(playerNameOrId: string | number) {`
- **L490**: `let fotmobId: string | number | null = null;`
- **L493**: `fotmobId = playerNameOrId;`
- **L495**: `const searchRes = await searchFotmob(String(playerNameOrId));`
- **L497**: `fotmobId = searchRes.players[0].id;`
- **L501**: `if (!fotmobId) return null;`
- **L503**: `const path = '/api/data/playerData?id=${fotmobId}';`
- **L504**: `const data = await fotmobFetch<any>(path, 600); // 10 min cache for player stats`
- **L535**: `id: 'fotmob-${fotmobId}-${tour.leagueId || tour.tournamentId}-${seasonName}',`
- **L550**: `id: 'fotmob-${fotmobId}-${seasonName}',`
- **L568**: `id: fotmobId,`
- **L583**: `const data = await fotmobFetch<any>(path, 5); // 5s cache for live match details and lineups`

### src\lib\image-loader.ts (1 hits)
- **L31**: `if (r2BaseUrl && (src.includes('transfermarkt') || src.includes('akamaized.net'))) {`

### src\lib\transfermarkt\client.ts (17 hits)
- **L2**: `* src/lib/transfermarkt/client.ts`
- **L4**: `* High-Performance Direct Live Proxy for Transfermarkt`
- **L5**: `* Fetches real-time, up-to-date football intelligence directly from Transfermarkt`
- **L9**: `const TM_BASE = "https://www.transfermarkt.com";`
- **L15**: `Referer: "https://www.transfermarkt.com/",`
- **L73**: `* Fetch top most valuable players worldwide directly from Transfermarkt ranking table`
- **L127**: `transfermarktId: pId,`
- **L142**: `? 'https://img.a.transfermarkt.technology/wappen/tiny/${clubId}.png'`
- **L327**: `transfermarktId: pId,`
- **L343**: `? 'https://img.a.transfermarkt.technology/wappen/head/${currentClubId}.png'`
- **L361**: `* Search players live on Transfermarkt`
- **L400**: `transfermarktId: pId,`
- **L410**: `logoUrl: 'https://img.a.transfermarkt.technology/wappen/tiny/${clubMatch[1]}.png',`
- **L428**: `* Fetch club squad and current total valuation from Transfermarkt`
- **L445**: `const logoUrl = 'https://img.a.transfermarkt.technology/wappen/head/${clubId}.png';`
- **L488**: `transfermarktId: playerLink[2],`
- **L515**: `transfermarktId: clubId,`

### tests\pure-functions.test.ts (2 hits)
- **L5**: `import { pureMd5 } from "../src/lib/fotmob/client";`
- **L134**: `const extUrl = "https://img.a.transfermarkt.technology/portrait/header/12345.jpg";`

