# a1score.app — Promoted & Newly Ingested Clubs Roster Audit

**Audit Date:** 2026-09-30T08:50:04.703Z

## 1. Executive Summary & Root Cause Analysis
Clubs recently promoted or newly ingested from historical Transfermarkt datasets suffer from two distinct structural issues:

1. **Historical Roster Bloat (e.g. Hull City, FC Schalke 04):**
   - In the initial ingestion (`scripts/sync-dataset.ts`), players were attached to clubs based on historical appearance records.
   - Departed, retired, and released players were never purged from `Player.currentClubId`.
   - As a result, Hull City has **45 players** (actual current squad: 33) and FC Schalke 04 has **41 players** (actual current squad: 34).

2. **Truncated or Missing Ingestion (e.g. Racing Santander, Venezia, Como, Parma, Ipswich, Coventry):**
   - Clubs promoted to the top tier (or ingested from second divisions) were missing from the original top-flight snapshot.
   - **Racing Santander** has **0 players** in DB (actual current squad: 28).
   - **Venezia FC** has **6 players** in DB (actual current squad: 36).
   - **Como 1907** has **13 players** in DB (actual current squad: 29).
   - **Parma Calcio 1913** has **15 players** in DB (actual current squad: 29).
   - **Ipswich Town** has **23 players** in DB (actual current squad: 29).
   - **Coventry City** has **24 players** in DB (actual current squad: 29).

## 2. Club-by-Club Audit Table

| Club | League | Current DB Count | FotMob Current Squad | Primary Failure Mode | Rebuild Action Plan |
|---|---|---|---|---|---|
| **Hull City** | Championship | 45 players | 33 players | Bloated by 12 historical players | Detach 12 departed players; align to 33-player current squad |
| **FC Schalke 04** | 2. Bundesliga | 41 players | 34 players | Bloated by 7 historical players | Detach 7 departed players; align to 34-player current squad |
| **Coventry City** | Championship | 24 players | 29 players | Missing 5 new arrivals | Ingest 5 missing arrivals from FotMob squad |
| **Ipswich Town** | Premier League | 23 players | 29 players | Missing 6 senior signings | Reconcile 6 arrivals from FotMob squad |
| **Racing Santander** | LaLiga 2 | 0 players | 28 players | Completely empty roster in DB | Ingest entire 28-player squad from FotMob |
| **Como 1907** | Serie A | 13 players | 29 players | Truncated roster (16 missing signings) | Ingest 16 new arrivals into senior squad |
| **Parma Calcio 1913** | Serie A | 15 players | 29 players | Truncated roster (14 missing signings) | Ingest 14 new arrivals into senior squad |
| **Venezia FC** | Serie A | 6 players | 36 players | Severely truncated (30 missing players) | Rebuild entire 36-player roster from FotMob |

## 3. Dry-Run Safety Policy (Rule 8)
> [!IMPORTANT]
> Per Rule 8, **no changes have been applied to live database tables**.
> All proposed changes remain staged as a dry run pending review of the audit diff.