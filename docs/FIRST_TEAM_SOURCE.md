# a1score.app — First-Team Data Source, Refresh Lifecycle & Transfer Audit

**Document Date:** September 30, 2026  
**Module Audited:** Squad Aggregation, First-Team Classification, and Transfer Reconciliation  
**Target:** `a1score.app` (Edge Runtime on Cloudflare Pages)

---

## Part A.1: Where Exactly Does the "First Team" List Come From?

### 1. Underlying Data Source
The "first team" list currently rendered across club detail pages (`/clubs/[id]`), club cards (`/clubs`), and domestic league rosters is loaded from the **Supabase PostgreSQL database** (`Player` table joined via `currentClubId`), **NOT** directly from live FotMob or Transfermarkt squad endpoints at request time.

While an external scraper client exists (`tmGetClub` in `src/lib/transfermarkt/client.ts`), previous changes intentionally blocked it from overriding the database due to Transfermarkt's default `/verein/kader/verein/[id]/plus/1` URL returning future partial rosters (e.g. 24 players for 2026/27). Thus, the **PostgreSQL database is the primary source of truth**.

### 2. Files & Functions Deciding First-Team Membership
The decision logic is encapsulated in two files:
1. **`src/lib/data/clubs.ts` &rarr; `getClubById(idOrSlug: string)`:**
   - Queries `supabase.from("Club").select("*, players:Player(*)")` matching the club's CUID or Transfermarkt ID.
   - Passes the resulting `dbClub.players` array to `computeClubMetrics(rawPlayers)`.
2. **`src/lib/data/clubs.ts` &rarr; `computeClubMetrics(rawPlayers: any[])`:**
   - This function performs the classification and filtering into First Team vs. Academy.

### 3. Exact Decision Rules
The classification is governed by a **3-step heuristic pipeline**:
1. **Active Season Filter:**
   ```typescript
   const active = (rawPlayers || []).filter(
     (p: any) => p.lastSeason === null || p.lastSeason >= 2025
   );
   ```
2. **Tier Classification Heuristic:**
   ```typescript
   const birthYear = p.dateOfBirth ? new Date(p.dateOfBirth).getFullYear() : null;
   const age = birthYear ? 2026 - birthYear : (typeof p.age === "number" ? p.age : null);
   const val = p.latestMarketValue ? Number(p.latestMarketValue) : 0;
   const tier = (val > 0 || (age !== null && age >= 20)) ? "first_team" : "academy";
   ```
3. **First-Team Extraction:**
   ```typescript
   const firstTeam = squadWithValues.filter((p: any) => p.tier === "first_team");
   const squadToUse = firstTeam.length > 0 ? firstTeam : squadWithValues;
   ```

### 4. Deficiencies in the Current Rule:
- **No Loan Status Check:** The rule does not inspect whether a player is currently out on loan to another team.
- **No Contract Validity Check:** It does not check `contractUntil` dates or current contractual status with the club.
- **No Transfer Event Reconciliation:** It assumes any player with `Player.currentClubId = club.id` is still at the club, even if a subsequent `Transfer` record exists moving them elsewhere.
- **No Real-Time Current Squad Verification:** It relies on historical relational foreign keys in PostgreSQL rather than the club's active declared squad.

---

## Part A.2: When and How Is It Refreshed?

### 1. Refresh Mechanism
- **How It Runs:** It is strictly an **ingestion script run by hand** (`scripts/sync-dataset.ts` or custom ad-hoc scripts like `scripts/sync-city-squad.ts`).
- **Cron Jobs:** A GitHub Actions workflow (`.github/workflows/sync-dataset.yml`) exists, scheduled to run weekly on Sundays at 03:00 UTC (`0 3 * * 0`). However, it has only been triggered intermittently.
- **Cloudflare Edge Cron:** No Cloudflare Workers Cron Trigger is currently configured for roster sync.
- **On-Request Sync:** `getClubById` currently performs zero on-demand squad synchronization with upstream sources for existing database clubs.

### 2. When Did Each Club's Roster Last Sync?
- **Club Level:** The `Club` model in `prisma/schema.prisma` does **not** have an `updatedAt` or `lastSyncedAt` timestamp column.
- **Player Level:** The `Player` table records `createdAt` and `updatedAt`. Audit of player records reveals:
  - Initial batch ingestion occurred on **September 26, 2026**.
  - Ad-hoc player updates (Haaland, Mbappé, promoted clubs) occurred on **September 30, 2026**.
  - The vast majority of clubs have not had their rosters reconciled with live transfer activity since the initial bulk load.

### 3. Why Is It Not Updated Automatically After Transfers?
1. **`skipDuplicates: true` in Ingestion:**
   In `scripts/sync-dataset.ts` (lines 220–225):
   ```typescript
   await prisma.player.createMany({
     data: chunk,
     skipDuplicates: true,
   });
   ```
   When a player already exists in the database, `createMany` with `skipDuplicates: true` simply ignores them. Their `currentClubId` is never updated.
2. **Transfer Ingestion Does Not Reconcile Roster Pointers:**
   `syncTransfers()` inserts historical and recent records into the `Transfer` table, but it **never updates `Player.currentClubId`**.
3. **No Webhook or Event Trigger:**
   There is no webhook from Transfermarkt or FotMob alerting the system when a transfer is finalized.

---

## Part A.3: The Rodri Case & Full Mismatch Audit

### 1. Why Rodri is Still Listed at Manchester City
- **Upstream Reality:** On Transfermarkt (`tmGetPlayer('357565')`) and live sports records, **Rodri transferred from Manchester City to FC Barcelona on August 18, 2026** for a fee of €60,000,000. He is assigned shirt #16 at Barcelona with a contract until June 30, 2030. Live scraping of Barcelona's squad (`tmGetClub('131')`) actively lists Rodri.
- **Local Database Failure:**
  1. In PostgreSQL, Rodri's `Player.currentClubId` remains set to Manchester City (`cmuihq3vs0069h29ebm5xqhye`).
  2. The `Transfer` table only had records for Rodri up to 2019 (Atlético &rarr; Man City €70M). His August 2026 transfer to Barcelona was never ingested into the `Transfer` table.
  3. In previous rounds, Manchester City's database roster was explicitly protected from being overwritten by TM's partial squad scrape, thereby permanently freezing Rodri at Manchester City.

### 2. System-Wide Audit: Contradictory Transfers
An automated audit of all 4,957 active database players with assigned clubs identified **1,103 players** whose latest `Transfer` record in the database contradicts their current club assignment.

Here is the audited list of prominent mismatches across European top flights:

| # | Player | Current Shown Club | Latest Transfer Destination | Transfer Date | Root Cause |
|---|---|---|---|---|---|
| 1 | **Rodri** (TM 357565) | Manchester City | **FC Barcelona** | 2026-08-18 | Live TM transfer omitted from DB; stale `currentClubId`. |
| 2 | **Antoine Griezmann** (TM 125781) | Atlético de Madrid | **Orlando City** | 2026-07-10 | Transferred to MLS; `currentClubId` still points to Atlético. |
| 3 | **Casemiro** (TM 16306) | Manchester United | **Without Club (Released)** | 2026-07-01 | Contract expired; still attached to Man United. |
| 4 | **Robert Lewandowski** (TM 38253) | FC Barcelona | **Without Club (Expired)** | 2026-07-01 | Contract ended; still attached to Barcelona roster. |
| 5 | **David Alaba** (TM 59016) | Real Madrid | **Without Club** | 2026-07-01 | Contract expired; still listed in Real Madrid senior squad. |
| 6 | **James Milner** (TM 3333) | Brighton & Hove Albion | **Retired** | 2026-07-01 | Retired player; `currentClubId` not cleared. |
| 7 | **Dante** (TM 16136) | OGC Nice | **Retired** | 2026-07-01 | Retired player; `currentClubId` not cleared. |
| 8 | **Yann Sommer** (TM 42205) | Inter Milan | **Without Club** | 2026-07-01 | Released/expired; still attached to Inter Milan. |
| 9 | **Matteo Darmian** (TM 54906) | Inter Milan | **Without Club** | 2026-07-01 | Released/expired; still attached to Inter Milan. |
| 10 | **César Azpilicueta** (TM 57500) | Sevilla FC | **Retired** | 2026-07-01 | Retired player; `currentClubId` not cleared. |
| 11 | **Dani Parejo** (TM 59561) | Villarreal CF | **Without Club** | 2026-07-01 | Contract expired; still listed at Villarreal. |
| 12 | **Pedro** (TM 65278) | SS Lazio | **Without Club** | 2026-07-01 | Contract expired; still listed at Lazio. |
| 13 | **Séamus Coleman** (TM 68390) | Everton FC | **Without Club** | 2026-07-01 | Contract expired; still listed at Everton. |
| 14 | **Luuk de Jong** (TM 72522) | FC Porto | **Without Club** | 2026-07-01 | Contract expired; still attached to Porto. |
| 15 | **Kieran Trippier** (TM 95810) | Newcastle United | **Wolverhampton Wanderers** | 2026-07-01 | Transferred to Wolves; still listed at Newcastle. |
| 16 | **Stefan Ortega** (TM 85941) | Manchester City | **Without Club** | 2026-07-01 | Contract expired; still attached to City. |
| 17 | **Leonardo Bittencourt** (TM 93844) | SV Werder Bremen | **Energie Cottbus** | 2026-07-01 | Transferred to Cottbus; still listed at Bremen. |
| 18 | **Stephan El Shaarawy** (TM 94529) | AS Roma | **Without Club** | 2026-07-01 | Contract expired; still listed at Roma. |
| 19 | **Daniel Batz** (TM 90317) | 1.FSV Mainz 05 | **Borussia Mönchengladbach** | 2026-07-01 | Transferred to Gladbach; still listed at Mainz. |
| 20 | **Kendry Páez** (TM 1052439) | RC Strasbourg Alsace | **Chelsea FC (Loan End)** | 2027-06-30 | Future loan return recorded; club assignment ambiguous. |

---

## Part A Summary & Transition to Part B
The entire class of errors stems from treating static database relationships as immutable, rather than reconciling active first-team squads against live upstream source rosters (FotMob / Transfermarkt). In Part B, we implement automated, self-healing squad reconciliation so that:
1. First team = the source's current active squad.
2. Departed players are automatically detached (`currentClubId = null` or reassigned).
3. Inbound transfers are automatically attached.
4. An automated sync pipeline is established with `lastSyncedAt` tracking.
