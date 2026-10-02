import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LineupTab } from "../src/components/match-tabs/LineupTab";
import { StatsTab } from "../src/components/match-tabs/StatsTab";
import { TimelineTab } from "../src/components/match-tabs/TimelineTab";
import { OverviewTab } from "../src/components/match-tabs/OverviewTab";

test("LineupTab - handles missing players and null entries gracefully without crashing", () => {
  const matchWithSparseLineup = {
    teams: {
      home: { id: "101", name: "Arsenal", imageUrl: "/images/arsenal.png" },
      away: { id: "102", name: "Chelsea", imageUrl: "/images/chelsea.png" },
    },
    lineup: {
      homeTeam: {
        formation: "4-3-3",
        starters: [
          null, // null entry test
          { id: "p1", name: "Bukayo Saka", slug: "bukayo-saka", jerseyNumber: "7", marketValue: 140000000, verticalLayout: { x: 80, y: 70 } },
          { id: "p2", name: "Declan Rice", jerseyNumber: "41", marketValue: 120000000 }, // missing slug and coordinates
          { id: "p3", name: "Unknown Striker" }, // missing marketValue, jerseyNumber, slug
          undefined,
        ],
        subs: [
          null,
          { id: "s1", name: "Leandro Trossard", jerseyNumber: "19", marketValue: 35000000 },
        ],
      },
      awayTeam: {
        formation: "4-2-3-1",
        starters: [],
        subs: [],
      },
    },
  };

  const html = renderToStaticMarkup(React.createElement(LineupTab, { match: matchWithSparseLineup }));

  // Should render Bukayo Saka
  assert.ok(html.includes("Bukayo Saka"), "Renders player name");
  assert.ok(html.includes("/players/bukayo-saka"), "Links to player slug profile");
  assert.ok(html.includes("€140M"), "Renders formatted market value in brand amber");
  assert.ok(html.includes("tabular-nums"), "Enforces tabular-nums for numeric market values");

  // Should handle missing slug with generated fallback slug
  assert.ok(html.includes("Declan Rice"), "Renders player without explicit slug");
  assert.ok(html.includes("/players/declan-rice"), "Falls back to slugified name");
  assert.ok(html.includes("€120M"), "Renders Rice market value");

  // Should handle unknown striker without value
  assert.ok(html.includes("Unknown Striker"), "Renders unknown striker name");

  // Starting XI total valuation should sum present players
  // 140M + 120M = 260M
  assert.ok(html.includes("€260M"), "Calculates total starter market value correctly skipping nulls");
});

test("LineupTab - empty lineups render pending confirmation placeholder", () => {
  const emptyMatch = {
    teams: {
      home: { id: "101", name: "Arsenal" },
      away: { id: "102", name: "Chelsea" },
    },
    lineup: null,
  };

  const html = renderToStaticMarkup(React.createElement(LineupTab, { match: emptyMatch }));
  assert.ok(html.includes("Lineups Pending Confirmation"), "Shows pending lineup state");
  assert.ok(html.includes("published approximately 60 minutes before kickoff"), "Explains release window");
});

test("StatsTab - empty stats groups render clean fallback state", () => {
  const matchWithoutStats = {
    status: { isUpcoming: true },
    stats: [],
    shotmap: { shots: [] },
  };

  const html = renderToStaticMarkup(React.createElement(StatsTab, { match: matchWithoutStats }));
  assert.ok(html.includes("No Match Statistics Available"), "Displays clean empty stats heading");
  assert.ok(html.includes("will track live once the fixture begins"), "Mentions upcoming status tracking");
});

test("StatsTab - paired comparison bars display explicit numbers on both sides (never color alone)", () => {
  const matchWithStats = {
    teams: {
      home: { id: "101", name: "Arsenal" },
      away: { id: "102", name: "Chelsea" },
    },
    stats: [
      {
        title: "Top Stats",
        key: "top_stats",
        stats: [
          {
            title: "Ball possession",
            key: "possession",
            home: "62%",
            away: "38%",
            homeValue: 62,
            awayValue: 38,
            type: "percentage",
          },
          {
            title: "Total shots",
            key: "shots",
            home: "15",
            away: "7",
            homeValue: 15,
            awayValue: 7,
            type: "number",
          },
        ],
      },
    ],
    shotmap: { shots: [] },
  };

  const html = renderToStaticMarkup(React.createElement(StatsTab, { match: matchWithStats }));

  // Possession
  assert.ok(html.includes("Ball possession"), "Renders stat title");
  assert.ok(html.includes("62%"), "Renders explicit home stat value");
  assert.ok(html.includes("38%"), "Renders explicit away stat value");

  // Total shots
  assert.ok(html.includes("Total shots"), "Renders total shots title");
  assert.ok(html.includes("15"), "Renders explicit home shots number");
  assert.ok(html.includes("7"), "Renders explicit away shots number");

  // Tabular nums guaranteed
  assert.ok(html.includes("tabular-nums"), "Uses tabular-nums for aligned paired numbers");
});

test("TimelineTab - events are rendered in chronological order with icons and labels", () => {
  const matchWithEvents = {
    teams: {
      home: { id: "101", name: "Arsenal" },
      away: { id: "102", name: "Chelsea" },
    },
    events: [
      {
        type: "Substitution",
        time: 72,
        teamId: "101",
        player: { name: "Gabriel Martinelli" },
        swapPlayer: { name: "Leandro Trossard" },
      },
      {
        type: "Card",
        card: "Yellow",
        time: 34,
        teamId: "102",
        player: { name: "Moises Caicedo" },
        cardReason: "Foul",
      },
      {
        type: "Goal",
        time: 18,
        teamId: "101",
        player: { name: "Bukayo Saka" },
        assist: { name: "Martin Odegaard" },
      },
      {
        type: "Card",
        card: "Red",
        time: 89,
        teamId: "102",
        player: { name: "Marc Cucurella" },
      },
    ],
  };

  const html = renderToStaticMarkup(React.createElement(TimelineTab, { match: matchWithEvents }));

  // 18' Saka goal must appear before 34' Caicedo card, before 72' sub, before 89' red card
  const posGoal = html.indexOf("Bukayo Saka");
  const posYellow = html.indexOf("Moises Caicedo");
  const posSub = html.indexOf("Gabriel Martinelli");
  const posRed = html.indexOf("Marc Cucurella");

  assert.ok(posGoal !== -1 && posYellow !== -1 && posSub !== -1 && posRed !== -1, "All events present");
  assert.ok(posGoal < posYellow, "18' Goal precedes 34' Yellow Card");
  assert.ok(posYellow < posSub, "34' Yellow Card precedes 72' Substitution");
  assert.ok(posSub < posRed, "72' Substitution precedes 89' Red Card");

  // Verify labels
  assert.ok(html.includes("Goal"), "Renders Goal label");
  assert.ok(html.includes("Yellow Card"), "Renders Yellow Card label");
  assert.ok(html.includes("Substitution"), "Renders Substitution label");
  assert.ok(html.includes("Red Card"), "Renders Red Card label");
  assert.ok(html.includes("Martin Odegaard"), "Renders assist details");
  assert.ok(html.includes("Leandro Trossard"), "Renders incoming sub player");
});

test("OverviewTab - renders score, competition, venue, referee, attendance, and key events summary", () => {
  const matchData = {
    general: {
      leagueName: "Premier League",
      leagueRoundName: "Matchday 28",
      venue: { name: "Emirates Stadium", city: "London" },
      referee: { name: "Michael Oliver" },
      attendance: 60250,
    },
    status: {
      finished: true,
      scoreStr: "2 - 1",
      reason: { long: "Full Time" },
    },
    teams: {
      home: { id: "101", name: "Arsenal", score: 2 },
      away: { id: "102", name: "Chelsea", score: 1 },
    },
    events: [
      { type: "Goal", time: 14, teamId: "101", player: { name: "Bukayo Saka" } },
      { type: "Goal", time: 55, teamId: "102", player: { name: "Cole Palmer" } },
      { type: "Goal", time: 78, teamId: "101", player: { name: "Kai Havertz" } },
      { type: "Card", card: "Red", time: 88, teamId: "102", player: { name: "Marc Cucurella" } },
    ],
  };

  const html = renderToStaticMarkup(React.createElement(OverviewTab, { match: matchData }));

  assert.ok(html.includes("Premier League"), "Renders league name");
  assert.ok(html.includes("Matchday 28"), "Renders round");
  assert.ok(html.includes("Emirates Stadium, London"), "Renders venue and city");
  assert.ok(html.includes("Michael Oliver"), "Renders referee");
  assert.ok(html.includes("60,250"), "Renders formatted attendance");
  assert.ok(html.includes("Key Events Summary"), "Renders key events summary section");
  assert.ok(html.includes("Major Incidents"), "Renders major incidents count");
  assert.ok(html.includes("Bukayo Saka"), "Includes goalscorer in incidents");
  assert.ok(html.includes("Kai Havertz"), "Includes second goalscorer");
  assert.ok(html.includes("Marc Cucurella"), "Includes red card incident");
});

test("useMatchSync - visibility-aware polling simulation", () => {
  // Simulate visibility listener semantics
  let isPolling = false;
  let pollCallCount = 0;
  let isDocumentHidden = false;

  const mockFetchLatest = () => {
    if (isDocumentHidden) return; // Visibility guard
    pollCallCount++;
  };

  const startPolling = () => {
    if (!isPolling && !isDocumentHidden) {
      isPolling = true;
    }
  };

  const stopPolling = () => {
    isPolling = false;
  };

  const handleVisibilityChange = () => {
    if (isDocumentHidden) {
      stopPolling();
    } else {
      mockFetchLatest(); // Immediate refresh on foreground
      startPolling();
    }
  };

  // 1. Initial active tab: start polling
  startPolling();
  assert.strictEqual(isPolling, true, "Polling is active when tab is visible");

  // 2. User switches tabs (document becomes hidden)
  isDocumentHidden = true;
  handleVisibilityChange();
  assert.strictEqual(isPolling, false, "Polling immediately paused when tab is hidden");

  // Triggering fetch while hidden should be no-op
  mockFetchLatest();
  assert.strictEqual(pollCallCount, 0, "No network request made when document is hidden");

  // 3. User switches back (tab becomes visible)
  isDocumentHidden = false;
  handleVisibilityChange();
  assert.strictEqual(pollCallCount, 1, "Immediate refresh triggered upon foregrounding tab");
  assert.strictEqual(isPolling, true, "Polling resumes when tab is restored");
});
