# Data Pipeline Architecture & Roster Invariants

## 1. System Overview

**a1score.app** delivers real-time football intelligence, squad rosters, market valuations, and financial parity analytics across Europe's top leagues.

### Sources & Data Tiering
- **PostgreSQL Database (Supabase)**: The single authoritative source of truth for active 2026/27 rosters, club allocations, player valuations, and loan links.
- **`data/raw/`**: Historical, static Kaggle Transfermarkt snapshot files (`players.csv`, `clubs.csv`, `transfers.csv`, etc.). **Immutable and stale**; never imported as current truth.
- **`data/export/`**: Generated CSV exports (`npm run export:data`) of the audited database state for reproducible consumption and analysis.

---

## 2. Read-Only Invariants Suite (`tests/integrity.test.ts`)

To guard against roster drift, corrupted transfers, and reconciliation regressions, the test suite enforces six read-only database invariants:

### Invariant 1: Zero Duplicate Player Transfermarkt IDs
- **Rule**: Every `transfermarktId` on the `Player` table must belong to at most one record.
- **Rationale**: Prevents identity splitting and ambiguous reconciliations.

### Invariant 2: Departed Players Must Not Have Active Club Links
- **Rule**: `status = 'departed'` requires `currentClubId IS NULL`.
- **Rationale**: Players who have retired, left tracked leagues, or been released cannot remain on active rosters.

### Invariant 3: Active Players Require Valid Club Assignments
- **Rule**: `status IN ('first_team', 'academy', 'on_loan')` expects an associated `currentClubId`.
- **Rationale**: Active players must belong to a squad. *Note:* Loaned players whose destination club is outside the database currently reflect `currentClubId = NULL` while preserving `parentClubId`.

### Invariant 4: Valid Loan Topology
- **Rule**: `status = 'on_loan'` requires `parentClubId IS NOT NULL` and `parentClubId != currentClubId`.
- **Rationale**: A player on loan must have a distinct parent club that owns their registration, while `currentClubId` represents the borrowing club where they play.

### Invariant 5: Tracked Top-Flight Squad Size Bounds (16–40 Players)
- **Rule**: For all 114 tracked top-flight clubs in the 6 major European leagues (`GB1`, `ES1`, `IT1`, `L1`, `FR1`, `PO1`), active squad sizes must be between 16 and 40 players.
- **Rationale**: Flags abnormal deflation (accidental mass detachments) or extreme roster inflation.

### Invariant 6: Club Stored Aggregates Match Live Player Computations
- **Rule**: `Club.squadSize` and `Club.totalMarketValue` must match the live sum and count of active players (`status != 'departed' AND currentClubId = club.id`).
- **Rationale**: Ensures cached denormalized aggregates on the `Club` record remain synchronized with underlying player rosters.

---

## 3. Pipeline Safeguards

1. **Dry-Run by Default**:
   - `scripts/sync-dataset.ts` defaults to dry-run mode unless explicitly passed `--apply`.
   - `scripts/reconcile-all-transfers.ts` runs dry-run by default unless passed `--apply`.
2. **Immutable Club Assignments on Ingestion**:
   - The sync pipeline (`scripts/sync-dataset.ts`) never overwrites `currentClubId`, `status`, or `lastSeason` for existing players. It only updates valuations, bios, and creates genuinely new players.
3. **Automated Pre-Run Backups**:
   - Every mutation script creates timestamped JSON dumps in `backups/` capturing state prior to execution.
4. **Strict Identity Resolution**:
   - Reconciliations match strictly on verified Transfermarkt IDs, with name matching restricted to manual verification logs.

---

## 4. Continuous Integration & Testing

- **Local Execution**:
  ```bash
  npm test                 # Runs unit tests followed by integrity invariants
  npm run test:integrity   # Runs read-only database invariants against DATABASE_URL
  ```
- **CI Graceful Skip**:
  When `DATABASE_URL` is not provided in environment variables, the integrity test suite cleanly skips without failing CI builds.
- **GitHub Actions**:
  The `.github/workflows/daily-squad-sync.yml` workflow executes `npm test` with `DATABASE_URL` injected from repository secrets, configured with `continue-on-error: true`.
