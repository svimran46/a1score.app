import { describe, expect, it } from "vitest";

import { mapFixtures, mapStanding, mapTopPlayers } from "./mappers";
import type { RawFixture, RawPlayer, RawStandingResponse } from "./raw";

function rawFixture(overrides: Partial<RawFixture> = {}): RawFixture {
  return {
    id: 123,
    referee: "M. Oliver",
    date: "2026-09-23T20:00:00+00:00",
    timestamp: 1785000000,
    venue: { name: "Anfield", city: "Liverpool" },
    status: { long: "Second Half", short: "2H", elapsed: 67 },
    league: {
      id: 39,
      name: "Premier League",
      type: "League",
      country: "England",
      season: 2026,
      round: "Regular Season - 6",
      logo: "https://media.api-sports.io/football/leagues/39.png",
    },
    teams: {
      home: { id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png", winner: true },
      away: { id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png", winner: false },
    },
    goals: { home: 2, away: 1 },
    score: {
      halftime: { home: 1, away: 0 },
      fulltime: { home: 2, away: 1 },
    },
    ...overrides,
  };
}

describe("mapFixtures", () => {
  it("maps a raw fixture into the flat schema shape", () => {
    const result = mapFixtures([rawFixture()]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const f = result.data[0];
    expect(f?.id).toBe(123);
    expect(f?.statusShort).toBe("2H");
    expect(f?.elapsed).toBe(67);
    expect(f?.venueName).toBe("Anfield");
    expect(f?.leagueName).toBe("Premier League");
    expect(f?.homeTeamName).toBe("Liverpool");
    expect(f?.goalsHome).toBe(2);
    expect(f?.winnerHome).toBe(true);
    expect(f?.winnerAway).toBe(false);
  });

  it("normalizes null goals and missing venue", () => {
    const result = mapFixtures([
      rawFixture({
        goals: null,
        venue: null,
        status: { long: "Not Started", short: "NS", elapsed: null },
        teams: {
          home: { id: 40, name: "Liverpool", logo: null, winner: null },
          away: { id: 42, name: "Arsenal", logo: null, winner: null },
        },
      }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const f = result.data[0];
    expect(f?.goalsHome).toBeNull();
    expect(f?.goalsAway).toBeNull();
    expect(f?.venueName).toBeNull();
    expect(f?.winnerHome).toBeNull();
  });

  it("trims empty-string text fields to null", () => {
    const result = mapFixtures([rawFixture({ referee: "  " })]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[0]?.referee).toBeNull();
  });

  it("fails with a validation error when required fields are absent", () => {
    const broken = rawFixture();
    (broken as unknown as Record<string, unknown>).id = undefined;
    const result = mapFixtures([broken]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation");
  });
});

describe("mapStanding", () => {
  const rawStanding: RawStandingResponse = {
    league: { id: 39, name: "Premier League", country: "England", season: 2026 },
    standings: [
      [
        {
          rank: 1,
          team: { id: 40, name: "Liverpool", logo: "logo.png" },
          points: 15,
          goalsDiff: 9,
          group: null,
          form: "WWWDW",
          description: "Promotion - Champions League",
          all: { played: 6, win: 5, draw: 0, lose: 1, goals: { "for": 14, against: 5 } },
        },
      ],
    ],
  };

  it("flattens the standings matrix into rows", () => {
    const result = mapStanding([rawStanding]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.leagueId).toBe(39);
    expect(result.data.season).toBe(2026);
    expect(result.data.rows[0]?.teamName).toBe("Liverpool");
    expect(result.data.rows[0]?.description).toBe("Promotion - Champions League");
  });

  it("errors when no standings are available", () => {
    const result = mapStanding([]);
    expect(result.ok).toBe(false);
  });
});

describe("mapTopPlayers", () => {
  const rawPlayer: RawPlayer = {
    player: { id: 306, name: "M. Salah", age: 34, nationality: "Egypt", photo: "p.png" },
    statistics: [
      {
        team: { id: 40, name: "Liverpool", logo: "t.png" },
        league: { id: 39, name: "Premier League", season: 2026 },
        games: { appearences: 6, position: "Attacker", rating: "7.85" },
        goals: { total: 5, assists: 2 },
      },
    ],
  };

  it("extracts goals for the scorers metric", () => {
    const result = mapTopPlayers([rawPlayer], "goals");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[0]?.value).toBe(5);
    expect(result.data[0]?.rating).toBeCloseTo(7.85);
  });

  it("extracts assists for the assists metric", () => {
    const result = mapTopPlayers([rawPlayer], "assists");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[0]?.value).toBe(2);
  });
});
