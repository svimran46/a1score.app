# Premier League Roster Audit Summary (Reference Date: 30 Sept 2026)

## 1. Overview & Scope

- **Audit Target**: The 94 flagged player records in `detaches_to_verify.csv` across Premier League clubs.
- **Reference Date**: 30 September 2026 (Summer transfer window closed 1 September 2026).
- **Integrity**: Exactly 94 rows maintained, preserving original row order, player IDs, and structure.

---

## 2. Key Audit Classifications

| Status Category | Player Count | Summary / Key Movements |
| :--- | :---: | :--- |
| **`on_loan_out`** | **39** | Player remains under contract with parent club but is out on loan (e.g. Robert Sánchez to Como, Marc Guiu to RB Leipzig, Mamadou Sarr to Real Sociedad, Tommy Setford to Stevenage, Wilfried Gnonto to Fiorentina, Harvey Elliott to Valencia, Sverre Nypan to Lommel SK). |
| **`left_league`** | **28** | Transferred permanently or released to clubs outside the file/league (e.g. Gabriel Martinelli to Al-Hilal, Leandro Trossard to Beşiktaş, Ollie Watkins to Al-Hilal, Leon Bailey to Olympiacos, Nathan Aké to Fenerbahçe, Tijjani Reijnders to Al-Qadsiah, Cristian Romero to Atlético Madrid, Curtis Jones to Inter Milan). |
| **`confirmed_same_club`** | **22** | Confirmed still under contract and active at parent club (first-team or U21/development squad, e.g. Yegor Yarmolyuk, Emmanuel Emegha, Carlos Alcaraz, Joe Willock, Tino Livramento, Iliman Ndiaye, Christos Mouzakitis). |
| **`transferred_within_file`** | **3** | Transferred to another club within the 20 EPL clubs in our file: **Maxence Lacroix** (Palace -> Chelsea), **Dwight McNeil** (Everton -> Palace), **Savinho** (Man City -> Tottenham). |
| **`released`** | **2** | Out of contract / without a club as of summer 2026: **Zach Marsh** (ex-Crystal Palace) and **Jack Thompson** (ex-Nottingham Forest). |
| **`unverified`** | **0** | All 94 players were verified using authoritative sources (Transfermarkt, club announcements, and news outlets). |

---

## 3. Transfers Within File (Recorded in `changes.csv`)

Per audit rules, three players transferred permanently to another club included in the audit file. Their `clubId` and `clubName` have been updated to the destination club's existing values:

1. **Maxence Lacroix** (`cmuihw0iu0868sexppt652rcy`):
   - **From**: Crystal Palace (`cmuihqfqr00cqh29e2077zt3y`)
   - **To**: Chelsea FC (`cmuihqcpo00b1h29edf8q9ksb`)
   - **Date**: July 2026 (Fee: ~€61m, contract to 2031)
2. **Dwight McNeil** (`cmuihw1em09k5sexpvvvnin7w`):
   - **From**: Everton FC (`cmuihq4bo006fh29ef9sfod5p`)
   - **To**: Crystal Palace (`cmuihqfqr00cqh29e2077zt3y`)
   - **Date**: 11 August 2026
3. **Savinho** (`cmuihw2q00avtsexppurxa90p`):
   - **From**: Manchester City (`cmuihq3vs0069h29ebm5xqhye`)
   - **To**: Tottenham Hotspur (`cmuihpzs8003vh29eyrxt8nk5`)
   - **Date**: 25 August 2026 (Fee: ~£85m package)

---

## 4. Unverified Leads Investigation Results

- **Arsenal FC**:
  - `Leandro Trossard`: **`left_league`** (transferred to Beşiktaş JK, July 2026, €18m).
  - `Gabriel Martinelli`: **`left_league`** (transferred to Al-Hilal SFC, September 2026, €70m).
  - `Alexéi Rojas`: **`left_league`** (free transfer to FC Penafiel, Portugal).
  - `Tommy Setford`: **`on_loan_out`** (loan to Stevenage FC for senior minutes; parent Arsenal).
- **Aston Villa**:
  - `Ollie Watkins`: **`left_league`** (transferred to Al-Hilal SFC, August 2026, €25m).
  - `Kosta Nedeljkovic`: **`on_loan_out`** (loan to Rangers FC; contracted to Villa until 2029).
- **Crystal Palace**:
  - `Maxence Lacroix`: **`transferred_within_file`** (transferred to Chelsea FC for €61m).
- **Everton FC**:
  - `Nathan Patterson`: **`left_league`** (transferred to Torino FC, 1 Sept 2026).
  - `Beto`: **`left_league`** (transferred to ACF Fiorentina, 1 Sept 2026, €18m).
  - `Dwight McNeil`: **`transferred_within_file`** (transferred to Crystal Palace, 11 August 2026).
- **Chelsea FC**:
  - `Mamadou Sarr`: **`on_loan_out`** (loan to Real Sociedad; parent Chelsea).
  - `Marc Guiu`: **`on_loan_out`** (loan to RB Leipzig; parent Chelsea).
  - `Robert Sánchez`: **`on_loan_out`** (loan to Como 1907 under Cesc Fàbregas; parent Chelsea).
- **Sunderland AFC**:
  - `Eliezer Mayenda`: **`left_league`** (transferred to Stade Rennais FC, July 2026, £21.5m).
  - `Harrison Jones`: **`left_league`** (transferred to Peterborough United, June 2026).
- **Manchester City**:
  - `Savinho`: **`transferred_within_file`** (sources reconciled: permanently transferred to Tottenham Hotspur on 25 August 2026 for £85m).

---

## 5. Low Row Count Analysis (Clubs with <= 3 Rows)

The following clubs had 3 or fewer rows in `detaches_to_verify.csv`. Analysis confirms this is a **correct result of the pipeline filter**, not missing data. The file specifically targets players in the database who were **omitted from FotMob's declared senior squad** and met the threshold criteria (Market Value ≥ €10M or Age ≤ 21).

### 1. Manchester United (3 rows: Fredricson, Obi, León)
- **Filter Explanation**: 21 of Manchester United's 25 database players matched the FotMob declared squad directly. Only 4 players were absent from the FotMob squad feed, of which 3 met the youth/value threshold.
- **Current Squad Players Meeting Thresholds (Absent from this file because they matched directly)**:
  - Kobbie Mainoo (Age 21, MV €55M)
  - Leny Yoro (Age 20, MV €55M)
  - Alejandro Garnacho (Age 22, MV €50M)
  - Rasmus Højlund (Age 23, MV €65M)
  - Bruno Fernandes (MV €65M)

### 2. Brighton & Hove Albion (2 rows: Howell, Tasker)
- **Filter Explanation**: Brighton had 11 direct matches and 13 incoming transfers. Only 6 database players were absent from FotMob, of which only 2 youth players (both on loan) met the threshold.
- **Current Squad Players Meeting Thresholds (Absent from this file because they matched directly)**:
  - Evan Ferguson (Age 21, MV €45M)
  - Jack Hinshelwood (Age 21, MV €30M)
  - Carlos Baleba (Age 22, MV €40M)
  - Yankuba Minteh (Age 22, MV €40M)
  - João Pedro (MV €50M)

### 3. Fulham FC (2 rows: McNally, Harris)
- **Filter Explanation**: 21 out of 24 DB players matched FotMob senior squad directly. Of the 3 unmatched players, only McNally and Harris (both out on loan) were aged ≤ 21.
- **Current Squad Players Meeting Thresholds (Absent from this file because they matched directly)**:
  - Emile Smith Rowe (MV €35M)
  - Alex Iwobi (MV €25M)
  - Joachim Andersen (MV €35M)
  - Rodrigo Muniz (MV €25M)

### 4. Leeds United (2 rows: Gnonto, Piroe)
- **Filter Explanation**: Leeds had 9 direct matches and 15 incoming attaches/reassigns. Only 5 DB players were absent from FotMob, and exactly 2 met the MV ≥ €10M threshold (both on loan).
- **Current Squad Players Meeting Thresholds (Absent from this file because they matched directly)**:
  - Mateo Joseph (Age 22, MV €12M)
  - Ethan Ampadu (MV €15M)
  - Pascal Struijk (MV €15M)

### 5. Hull City (2 rows: Mouzakitis, Morton)
- **Filter Explanation**: 26 out of 45 DB players matched FotMob directly. Among candidates absent from FotMob, only Mouzakitis (Age 19, MV €25M) and Morton (MV €30M) met the thresholds.
- **Current Squad Players Meeting Thresholds (Absent from this file because they matched directly)**:
  - Charlie Hughes (MV ~€10M)

---

## 6. Generated Output Files

1. [`players_audited.csv`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/players_audited.csv): Complete 94-row dataset with recomputed age, verify reason, and new columns (`status`, `newClub`, `loanClub`, `transferDate`, `stillFlagged`, `sourceUrl`, `confidence`, `notes`).
2. [`changes.csv`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/changes.csv): Log of clubId and clubName updates for intra-file transfers (Lacroix, McNeil, Savinho).
3. [`market_value_review.csv`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/market_value_review.csv): 30 players whose file market value differs by > 30% from current Transfermarkt valuations.
4. [`audit_summary.md`](file:///c:/Users/User/Documents/antigravity/epic-brahmagupta/audit_summary.md): This report.
