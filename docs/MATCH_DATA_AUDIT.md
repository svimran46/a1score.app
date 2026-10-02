# Match Data & Architecture Audit

**Date:** October 3, 2026  
**Auditor:** Antigravity AI Engineering Team  
**Scope:** `/matches/[id]` Match Center, FotMob API payload, Transfermarkt valuation bridge, and mobile responsiveness.

---

## 1. Executive Summary

The match experience on `a1score.app` connects live football match intelligence (from the FotMob match engine) with proprietary market valuations (from Transfermarkt). Previously, match tabs were fragmented: timeline events and match facts were combined into a generic "Facts" tab, valuations on the tactical pitch were styled in green rather than brand amber with tabular numerals, player nodes lacked direct links to player profiles, and polling refreshed every 2 seconds without displaying an explicit "Last updated" time or pausing cleanly with bounded timeouts.

This audit details the raw FotMob data availability, identifies data gaps, and outlines the Phase 14 architecture to deliver a high-performance, mobile-first match center.

---

## 2. FotMob Match Details API Payload Inventory

An audit of the FotMob match endpoint (`/api/data/matchDetails?matchId={id}`) reveals the following data structures:

### A. General & Header Context
* **Available:**
  - `general.matchId`: Unique match identifier.
  - `general.leagueId` & `general.leagueName`: Domestic competition or tournament name.
  - `general.matchRound`: Round number or stage (e.g. "Round 3", "Quarter-finals").
  - `general.matchTimeUTCDate`: ISO 8601 kickoff timestamp.
  - `header.teams[0]` & `header.teams[1]`: Team names, scores, crest URLs, FIFA rankings.
  - `header.status.started`, `header.status.finished`, `header.status.cancelled`: Match lifecycle flags.
  - `header.status.liveTime`: Live match minute, stoppage time (e.g. "45+2'"), and period ("HT", "FT").
* **Gaps / Formatting Needed:**
  - Must not claim "real-time" or "live updates" if polling on 30–60s intervals. Must show explicit "Updated HH:MM:SS".

### B. Match Events & Timeline
* **Available:**
  - `content.matchFacts.events.events`: Array of match events.
  - Event properties: `type` ("Goal", "Card", "Substitution", "VAR"), `time` (minute), `overloadTime` (stoppage minute), `isHome` (boolean), `name`/`player.name` (primary player), `assistStr` (assist provider), `swapPlayer` (substituted off), `card` ("Yellow", "Red", "YellowRed"), `isPenalty`, `ownGoal`.
* **Gaps / Needs:**
  - Events need minute-ordered presentation (1' to 90'+) with explicit text labels alongside icons (e.g. "⚽ Goal", "🟨 Yellow Card", "🔄 Substitution").

### C. Lineups & Formations
* **Available:**
  - `content.lineup.homeTeam` & `content.lineup.awayTeam`:
    - `formation`: Tactical shape string (e.g. "4-3-3", "4-2-3-1", "3-5-2").
    - `starters`: Array of starting XI players with `id`, `name`, `shirtNumber`, `positionId`, `verticalLayout` (`x`, `y` coordinates on pitch 0.0–1.0), `performance.rating`.
    - `subs`: Array of bench players with `id`, `name`, `shirtNumber`.
    - `coach`: Head coach object with name and ID.
* **Gaps / Valuation Integration:**
  - Market values: Must be displayed in brand amber (`--value-text`) with tabular numerals (`tabular-nums`).
  - Total Starting XI valuation: Sum of market values for starting XI must be displayed per team.
  - Player links: Tapping a player must link directly to their player profile (`/players/[slug]` or `/players/[id]`) rather than opening an isolated modal.

### D. Match Statistics & Shot Map
* **Available:**
  - `content.stats.Periods.All.stats`: Grouped categories ("Top stats", "Shots", "Expected Goals", "Passes", "Defense", "Duels").
  - Each item: `title`, `key`, `stats: [homeValue, awayValue]`, `type` ("graph", "title").
  - `content.shotmap.shots`: Individual shot records with coordinates (`x`, `y`), `expectedGoals` (xG), `eventType` ("Goal", "Miss", "AttemptSaved"), `playerName`.
* **Gaps / Formatting Needed:**
  - Paired comparison bars must never rely on color alone; exact numbers must always be clearly visible on both sides.
  - If xG or shotmap is empty (e.g. lower leagues), graceful fallbacks must render without breaking the stats tab.

### E. Head-to-Head (H2H) & Recent Form
* **Available:**
  - `content.h2h.summary`: 3-tuple `[homeWins, draws, awayWins]`.
  - `content.h2h.matches`: Historical fixture list with past scores, dates, and competition.
  - `content.matchFacts.teamForm`: Last 5 fixtures for both clubs (`resultString` "W", "D", "L", scores, opponents).
* **Gaps:**
  - Form badges must have clear accessibility titles and contrast compliant styling in both dark and light modes.

### F. InfoBox / Stadium & Officials
* **Available:**
  - `content.matchFacts.infoBox.Stadium`: Name, city, country, capacity, surface.
  - `content.matchFacts.infoBox.Referee`: Name, nationality, country code.
  - `content.matchFacts.infoBox.Attendance`: Turnstile attendance figure.
  - `content.matchFacts.infoBox.Tournament`: Competition and round name.

---

## 3. Tab Structure Requirement Matrix

| Tab | Purpose | Key Elements |
|---|---|---|
| **Overview** | Primary match summary & context | Scoreboard recap, match status, competition & round, venue, referee, attendance, key event highlights (goals & red cards). |
| **Lineups** | Tactical pitch & squad values | Interactive pitch formation view (Home/Away toggle), total starting XI value in brand amber (`tabular-nums`), bench list, player links to `/players/[slug]`. |
| **Stats** | Match metrics & shot intelligence | Paired comparison bars with explicit numbers for Possession, Total Shots, Shots on Target, xG, Passes, Tackles; shot map when available. |
| **Timeline** | Chronological narrative | All match events in minute order with distinct icon + text badge, player name, assist/sub detail, and team crest. |
| **H2H** | Historical context & momentum | 5-game recent form ribbons for both teams, all-time head-to-head win/draw/loss counter, previous meetings list. |

---

## 4. Polling & Freshness Architecture

- **Frequency:** 30–60 seconds for in-progress matches (`status.isLive`).
- **Visibility Awareness:** Pauses automatically when `document.hidden` is true (e.g. background tab or phone locked) and resumes immediately upon focus.
- **Resilience:** Bounded 8-second network timeout with `AbortController` and stale cache fallback.
- **Transparency:** Never displays misleading "live" claims; displays a visible badge: `"Updated " + HH:MM:SS`.
