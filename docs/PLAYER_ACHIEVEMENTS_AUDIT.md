# Player Achievements (Honours and Awards) Audit

**Date:** October 2026  
**Scope:** Phase 19 — Player Achievements Architecture & Ingestion  
**Status:** Complete  

---

## 1. Current State of Player Profile Pages

- **Current Honours/Awards Data:** Currently, player profiles display biographical facts (Age, Nationality, Height, Foot, Contract), market value charts, transfer history, season stats (goals/assists/minutes), injuries, and related news. There is **no achievements or honours data** displayed on player profiles or stored in the database.
- **Header Elements:** `PageHeader` variant `player` displays avatar, full name, position, current market value, value trend, and key metadata line (nationality, club, league, age). The header must strictly observe the **~220px mobile height budget** established in Phase 12.
- **Tabs Architecture:** `PlayerTabsContainer` renders a multi-tab system (`Overview`, `Transfers`, `Value History`). There is ample space for an **Achievements** tab (`Trophy` icon) and an achievements summary block on the profile overview.

---

## 2. Transfermarkt Player "Erfolge" Page Audit

### Endpoint Structure
- URL pattern: `https://www.transfermarkt.com/{slug}/erfolge/spieler/{transfermarktId}`
- Example: `https://www.transfermarkt.com/erling-haaland/erfolge/spieler/418560`
- Example: `https://www.transfermarkt.com/lionel-messi/erfolge/spieler/28003`

### Robots.txt & Terms Compliance
- Transfermarkt `robots.txt` specifies:
  ```txt
  User-agent: *
  Allow: /
  ```
- Polite crawler policy:
  - Custom, transparent `User-Agent`: `Mozilla/5.0 ... a1score/1.0 (Player Achievements Ingestion Pipeline; polite rate-limited)`
  - Polite rate limit: 1 request per 1.0 – 2.0s with randomized jitter.
  - Exponential backoff on HTTP 429.
  - Skip players fetched within the last 30 days to avoid redundant requests.

### DOM Structure Consistency
Across veterans (e.g., Lionel Messi), prime stars (e.g., Erling Haaland, Kylian Mbappé), emerging young talents (e.g., Kobbie Mainoo, Lamine Yamal), and players with zero trophies:
1. **Headline Block:**
   ```html
   <div class="box">
     <h2 class="content-box-headline">
       {count}x {Trophy Name}
     </h2>
   ```
2. **Table Listing (`table.auflistung`):**
   ```html
   <tr>
     <td class="erfolg_table_saison">{season e.g. 23/24}</td>
     <td class="erfolg_table_wappen"><a title="{Club Name}" href="/.../verein/{clubId}"><img ... /></a></td>
     <td><a title="{Club Name}">...</a></td>
   </tr>
   ```
3. **Youth vs. Veteran:**
   - Players with youth honours (e.g. "English FA Youth Cup winner") list them in identical `table.auflistung` rows.
   - Veterans with dozens of titles (e.g. Messi: 27 distinct honours including Ballon d'Or, World Cup, Copa América) follow the exact same structure.
4. **Zero Honours Behavior:**
   - Players with zero honours return HTTP 200 with an empty content container (zero `h2.content-box-headline` blocks).
   - Invariant: Zero trophies means **no records stored and nothing shown** in UI. Never fabricate fake "0" counts.

---

## 3. Distinction of Achievement Categories

Transfermarkt conflates team honours and individual awards under the same `erfolge` page. We categorize them cleanly:

1. **Team Honours (`kind: "team_honour"`):**
   - **Major Team Honours:**
     - Domestic League Titles (`domestic_league`): e.g. "English Champion", "Spanish Champion", "German Champion", "Italian Champion", "French Champion".
     - UEFA Champions League (`ucl`): "UEFA Champions League winner", "European Champion Clubs' Cup".
     - FIFA World Cup (`world_cup`): "World Cup winner".
     - Continental National Tournaments (`continental_cup`): "European Champion" (Euros), "Copa América winner", "Africa Cup of Nations winner", "Asian Cup winner".
     - Other European/Continental Cups (`continental_trophy`): "Europa League winner", "UEFA Supercup winner", "Copa Libertadores winner", "FIFA Club World Cup winner".
   - **Domestic Cups & Other Trophies (`domestic_cup` / `other_trophy`):**
     - Primary Domestic Cups: "English FA Cup winner", "Copa del Rey winner", "DFB-Pokal winner", "Coppa Italia winner", "Coupe de France winner".
     - Secondary Cups / Super Cups: "English League Cup winner", "English Super Cup winner", "Supercopa de España winner", "DFL-Supercup winner", "Trophée des Champions winner".
2. **Individual Awards (`kind: "individual_award"`):**
   - **Ballon d'Or & FIFA The Best:** "Winner Ballon d'Or", "The Best FIFA Men's Player", "FIFA World Player of the Year".
   - **Golden Boot & Top Scorer:** "Golden Boot winner (Europe)", "Top goal scorer".
   - **Player of the Year & MVP:** "Footballer of the Year", "Player of the Year", "TM-Player of the season", "MLS MVP".
   - **Young Player & Golden Boy:** "Golden Boy", "Kopa Trophy", "Young Player of the Year".
   - **Goalkeeper:** "The Best FIFA Goalkeeper", "Yashin Trophy", "Golden Glove".

---

## 4. Reusable Architecture from Phase 11 (Club Honours)

To prevent code duplication, we leverage the battle-tested design patterns from Phase 11:
1. **Polite Request Throttling:** 1.0 – 2.0s delay per request, exponential backoff on HTTP 429, MaxRetries = 2.
2. **Season String Normalizer:** Reuses `normalizeSeasonString` ("23/24" -> "2023/24", "1998/99" -> "1998/99").
3. **Database Upsert Strategy:** Upserts keyed on `(playerId, kind, competitionKey)` to support seamless re-runs.
4. **Cache Layer Integration:** `getPlayerAchievements` utilizes `withCache` with stale fallback, ensuring zero degradation of player profile render performance if external sources or database connections are slow.

---

## 5. Ingestion & Verification Report

### Ingestion Statistics
- **Total Players Evaluated:** 30
- **Total Team Honours Upserted:** 193
- **Total Individual Awards Upserted:** 41
- **Zero-Fake Invariant:** Fully preserved (e.g. Yan Diomande with 0 trophies has exactly 0 records in `PlayerAchievement` and renders zero empty containers).

### Spot-Check Verification (10 Players)
1. **Erling Haaland:** 15 categories (1x UCL, 2x Premier League, 1x UEFA Super Cup, 1x DFB-Pokal, 2x FA Cup, 1x League Cup, 1x Community Shield, 2x Austrian Bundesliga, 2x Austrian Cup, 1x UEFA Player of the Year, 1x Golden Boy, 1x European Golden Shoe, 8x Footballer of the Year, 10x Top Scorer, 3x Player of the Season).
2. **Kylian Mbappé:** 15 categories (1x World Cup, 1x UEFA Nations League, 6x Ligue 1, 1x UEFA Super Cup, 4x Coupe de France, 2x Coupe de la Ligue, 3x Trophée des Champions, 1x European Golden Shoe, 1x Golden Boy, 10x Player of the Season, 11x Top Scorer).
3. **Lamine Yamal:** 9 categories (1x European Championship, 1x LaLiga, 1x Supercopa de España, 1x Kopa Trophy, 1x Golden Boy, 4x individual accolades).
4. **Jude Bellingham:** 9 categories (1x UCL, 1x LaLiga, 1x DFB-Pokal, 1x UEFA Super Cup, 1x Intercontinental/Club World Cup, 1x Golden Boy, 1x Kopa Trophy, 2x Player of the Season).
5. **Vinicius Junior:** 11 categories (2x UCL, 3x LaLiga, 2x FIFA Club World Cup, 1x Copa del Rey, 2x UEFA Super Cup, 3x Supercopa de España, 3x Player of the Season).
6. **Pedri:** 6 categories (1x European Championship, 1x LaLiga, 1x Copa del Rey, 1x Supercopa de España, 1x Golden Boy, 1x Kopa Trophy).
7. **Julián Alvarez:** 17 categories (1x World Cup, 2x Copa América, 1x UCL, 1x Copa Libertadores, 2x Premier League, 1x FIFA Club World Cup, 1x FA Cup, 1x UEFA Super Cup, 1x Argentine Champion, multiple domestic & individual cups).
8. **Bukayo Saka:** 3 categories (1x FA Cup, 2x FA Community Shield).
9. **Cole Palmer:** 11 categories (1x UCL, 1x Premier League, 1x UEFA Super Cup, 1x FA Cup, 1x Club World Cup, 1x European U21 Champion, 5x individual awards).
10. **Yan Diomande:** 0 trophies (Zero rows in DB, zero layout shift or empty boxes).

