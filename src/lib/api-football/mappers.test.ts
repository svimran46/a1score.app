import { describe, expect, it } from "vitest";

import { mapFixtures, mapStanding, mapTopPlayers } from "./mappers";
import type { RawFixture, RawPlayer, RawStandingResponse } from "./raw";

function rawFixture(overrides: {
  id?: number;
  referee?: string | null;
  venue?: { id: number | null; name: string | null; city: string | null } | null;
  status?: { long: string | null; short: string | null; elapsed: number | null; extra: number | null } | null;
  goals?: { home: number | null; away: number | null } | null;
  homeWinner?: boolean | null;
} = {}): RawFixture {
  return {
    fixture: {
      id: overrides.id ?? 123,
      referee: overrides.referee ?? "M. Oliver",
      timezone: "UTC",
      date: "2026-09-23T20:00:00+00:00",
      timestamp: 1785000000,
      venue: overrides.venue !== undefined ? overrides.venue : { id: null, name: "Anfield", city: "Liverpool" },
      status: overrides.status ?? { long: "Second Half", short: "2H", elapsed: 67, extra: null },
    },
    league: {
      id: 39,
      name: "Premier League",
      country: "England",
      season: 2026,
      round: "Regular Season - 6",
      logo: "https://media.api-sports.io/football/leagues/39.png",
      flag: null,
    },
    teams: {
      home: { id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png", winner: overrides.homeWinner !== undefined ? overrides.homeWinner : true },
      away: { id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png", winner: false },
    },
    goals: overrides.goals !== undefined ? overrides.goals : { home: 2, away: 1 },
    score: {
      halftime: { home: 1, away: 0 },
      fulltime: { home: 2, away: 1 },
    },
  };
}

describe("mapFixtures", () => {
  it("maps a raw nested fixture into the flat schema shape", () => {
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
        status: { long: "Not Started", short: "NS", elapsed: null, extra: null },
        homeWinner: null,
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

  it("fails with a validation error when the fixture id is absent", () => {
    const broken = rawFixture();
    (broken as unknown as Record<string, unknown>).fixture = { ...broken.fixture, id: undefined };
    const result = mapFixtures([broken]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation");
  });
});

describe("mapStanding", () => {
  const rawStanding: RawStandingResponse = {
    league: {
      id: 39,
      name: "Premier League",
      country: "England",
      logo: null,
      flag: null,
      season: 2026,
      standings: [
        [
          {
            rank: 1,
            team: { id: 40, name: "Liverpool", logo: "logo.png" },
            points: 15,
            goalsDiff: 9,
            group: null,
            form: "WWWDW",
            status: null,
            description: "Promotion - Champions League",
            all: { played: 6, win: 5, draw: 0, lose: 1, goals: { "for": 14, against: 5 } },
            update: "2026-09-20",
          },
        ],
      ],
    },
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
    player: {
      id: 306,
      name: "M. Salah",
      firstname: "Mohamed",
      lastname: "Salah",
      age: 34,
      birth: { date: "1992-06-15" },
      nationality: "Egypt",
      height: null,
      weight: null,
      photo: "p.png",
      injured: false,
    },
    statistics: [
      {
        team: { id: 40, name: "Liverpool", logo: "t.png" },
        league: { id: 39, name: "Premier League", season: 2026, logo: null },
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
