# a1score.app — Automated Squad Reconciliation Diff Report

**Execution Date:** 2026-09-30T08:18:11.460Z
**Run Mode:** LIVE APPLY
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
| **Manchester City** | 35 | 31 | -4 | 0 | 3 | 1 | ✅ SAFE |
| **Paris Saint-Germain** | 26 | 24 | -2 | 0 | 2 | 0 | ✅ SAFE |
| **Arsenal FC** | 29 | 27 | -2 | 0 | 2 | 0 | ✅ SAFE |
| **FC Barcelona** | 32 | 30 | -2 | 0 | 2 | 0 | ✅ SAFE |
| **Real Madrid** | 33 | 33 | 0 | 0 | 0 | 0 | ✅ SAFE |

## Detailed Departures & Academy Reclassifications
### Manchester City
- **Arrivals:** None
- **Departures:** Jack Grealish, Claudio Echeverri, Juma Bah
- **Explicit Academy:** Jaden Heskey
### Paris Saint-Germain
- **Arrivals:** None
- **Departures:** Randal Kolo Muani, Gabriel Moscardo
### Arsenal FC
- **Arrivals:** None
- **Departures:** Reiss Nelson, Fábio Vieira
### FC Barcelona
- **Arrivals:** None
- **Departures:** Héctor Fort, Ansu Fati