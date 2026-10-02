# a1score.app — Automated Squad Reconciliation Diff Report

**Execution Date:** 2026-10-02T13:29:30.206Z
**Run Mode:** DRY RUN
**Clubs Audited:** 5
**Safety Violations Encountered:** 0

## Safety Guardrails (Part B Rule 5)
- Max arrivals per club: 8
- Max departures per club: 8
- Strict Squad Bounds: 18 <= Squad Size <= 36
- Single Atomic PostgreSQL Transaction (`BEGIN ... COMMIT / ROLLBACK`)

## Club-by-Club Reconciliation Summary

| Club | Previous Size | Reconciled Size | Net Change | Arrivals (+count) | Departures (-count) | Academy Explicit | Status |
|---|---|---|---|---|---|---|---|
| **Real Madrid** | 27 | 27 | 0 | 0 | 0 | 0 | ✅ SAFE |
| **Manchester City** | 24 | 24 | 0 | 0 | 0 | 0 | ✅ SAFE |
| **Paris Saint-Germain** | 24 | 24 | 0 | 0 | 0 | 0 | ✅ SAFE |
| **Arsenal FC** | 24 | 24 | 0 | 0 | 0 | 0 | ✅ SAFE |
| **FC Barcelona** | 27 | 27 | 0 | 0 | 0 | 0 | ✅ SAFE |

## Detailed Departures & Academy Reclassifications