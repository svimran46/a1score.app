import test from "node:test";
import assert from "node:assert/strict";
import { TOP_LEAGUE_IDS, formatMatchStatus } from "../src/lib/fotmob/client";

test("D4: TOP_LEAGUE_IDS contains expected European competitions", () => {
  assert.ok(Array.isArray(TOP_LEAGUE_IDS));
  assert.ok(TOP_LEAGUE_IDS.includes(47)); // Premier League
  assert.ok(TOP_LEAGUE_IDS.includes(87)); // LaLiga
  assert.ok(TOP_LEAGUE_IDS.includes(54)); // Bundesliga
  assert.ok(TOP_LEAGUE_IDS.includes(55)); // Serie A
  assert.ok(TOP_LEAGUE_IDS.includes(53)); // Ligue 1
  assert.ok(TOP_LEAGUE_IDS.includes(42)); // Champions League
  assert.ok(TOP_LEAGUE_IDS.includes(73)); // Europa League
  assert.ok(TOP_LEAGUE_IDS.includes(10216)); // Conference League
  assert.ok(TOP_LEAGUE_IDS.length >= 8);
});

test("D4: formatMatchStatus formats match state accurately", () => {
  // 1. Finished matches
  assert.equal(formatMatchStatus({ isFinished: true }), "FT");
  assert.equal(
    formatMatchStatus({
      isFinished: true,
      status: { liveTime: { short: "90'" } },
    }),
    "FT"
  );

  // 2. Half time
  assert.equal(
    formatMatchStatus({
      isLive: true,
      status: { liveTime: { short: "HT" } },
    }),
    "HT"
  );
  assert.equal(
    formatMatchStatus({
      isLive: true,
      status: { liveTime: { short: "Half Time" } },
    }),
    "HT"
  );
  assert.equal(
    formatMatchStatus({
      isLive: true,
      status: { reason: { short: "HT" } },
    }),
    "HT"
  );

  // 3. Live in progress
  assert.equal(
    formatMatchStatus({
      isLive: true,
      status: { liveTime: { short: "67'" } },
    }),
    "Live 67'"
  );
  assert.equal(
    formatMatchStatus({
      isLive: true,
      status: { liveTime: { short: "67" } },
    }),
    "Live 67'"
  );
  assert.equal(
    formatMatchStatus({
      isLive: true,
      status: { liveTime: { short: "90+4'" } },
    }),
    "Live 90+4'"
  );
  assert.equal(
    formatMatchStatus({
      isLive: true,
      status: null,
    }),
    "Live"
  );

  // 4. Upcoming fixtures
  const kickoffUtc = formatMatchStatus({
    isUpcoming: true,
    timeTS: 1770000000000,
  });
  assert.ok(kickoffUtc.includes("UTC"), `Expected UTC timezone label in '${kickoffUtc}'`);

  const kickoffTimeFallback = formatMatchStatus({
    isUpcoming: true,
    time: "20:00",
  });
  assert.equal(kickoffTimeFallback, "20:00 UTC");
});

test("D4: Badge count strictly synchronizes with rendered matches when live filter active", () => {
  const mockLeagues = [
    {
      id: 47, // Premier League (Top)
      name: "Premier League",
      matches: [
        { id: 1, isLive: true, isFinished: false, isUpcoming: false },
        { id: 2, isLive: false, isFinished: true, isUpcoming: false },
      ],
    },
    {
      id: 87, // La Liga (Top)
      name: "LaLiga",
      matches: [
        { id: 3, isLive: true, isFinished: false, isUpcoming: false },
        { id: 4, isLive: false, isFinished: false, isUpcoming: true },
      ],
    },
    {
      id: 9999, // Lower tier league (Non-Top)
      name: "Non-Top League",
      matches: [
        { id: 5, isLive: true, isFinished: false, isUpcoming: false },
        { id: 6, isLive: false, isFinished: true, isUpcoming: false },
      ],
    },
  ];

  for (const activeScope of ["top", "all"] as const) {
    const scopedLeagues =
      activeScope === "all"
        ? mockLeagues
        : mockLeagues.filter((l) => TOP_LEAGUE_IDS.includes(l.id));

    const totalScopedMatches = scopedLeagues.reduce(
      (sum, l) => sum + l.matches.length,
      0
    );
    const liveScopedMatchesCount = scopedLeagues.reduce(
      (sum, l) => sum + l.matches.filter((m) => m.isLive).length,
      0
    );

    if (activeScope === "top") {
      assert.equal(scopedLeagues.length, 2);
      assert.equal(totalScopedMatches, 4);
      assert.equal(liveScopedMatchesCount, 2);
    } else {
      assert.equal(scopedLeagues.length, 3);
      assert.equal(totalScopedMatches, 6);
      assert.equal(liveScopedMatchesCount, 3);
    }

    // When filter is "live"
    const liveLeagues = scopedLeagues
      .map((l) => ({
        ...l,
        matches: l.matches.filter((m) => m.isLive),
      }))
      .filter((l) => l.matches.length > 0);

    const renderedLiveCount = liveLeagues.reduce(
      (sum, l) => sum + l.matches.length,
      0
    );

    // CRITICAL: Badge count must strictly equal rendered matches in live view
    assert.equal(
      liveScopedMatchesCount,
      renderedLiveCount,
      `Badge count (${liveScopedMatchesCount}) must match rendered count (${renderedLiveCount}) for scope ${activeScope}`
    );
  }
});
