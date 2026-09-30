# Data Architecture & Directory Conventions

This directory manages datasets for **a1score.app**.

## Directory Structure

### `data/raw/` (Immutable Source Snapshot)
- Contains the static, historical snapshot downloaded from Kaggle / Transfermarkt (`competitions.csv`, `clubs.csv`, `players.csv`, `player_valuations.csv`, `transfers.csv`).
- **CRITICAL**: This snapshot is **immutable** and **stale**. It reflects un-audited historical data (e.g. legacy transfers, outdated club assignments such as Savinho at Man City, and clubs missing from competitions).
- **DO NOT** import `data/raw/` directly as "current truth". Doing so would overwrite audited 2026/27 rosters, loans, and manual verifications.

### `data/export/` (Audited State Export)
- Generated exports from the production/staging PostgreSQL database.
- Files:
  - `data/export/clubs.csv`: Contains active clubs, current squad size, total market value, and sync metadata.
  - `data/export/players.csv`: Contains active players (`status != 'departed'`), current club assignment (accounting for loans at the loan club), parent club, loan end dates, and latest valuations.
- Can be regenerated at any time using:
  ```bash
  npm run export:data
  ```

## Source of Truth
The **PostgreSQL Database** (managed via Prisma and audited against official 2026/27 squad registrations and FotMob benchmarks) is the **sole source of truth** for all rosters, player statuses, and loan assignments.
