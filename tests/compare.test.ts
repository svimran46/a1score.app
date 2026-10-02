import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  parseCompareSlugs,
  calculate12MonthChange,
  calculatePeakValuation,
  mergeValuationTimelines,
} from "../src/lib/compare";
import { CompareFactsTable } from "../src/components/compare/CompareFactsTable";
import { ClubValueTrendChart } from "../src/components/clubs/ClubValueTrendChart";

test("parseCompareSlugs - correctly cleans, deduplicates, and clamps URLs", () => {
  // 1. Empty / null / whitespace cases
  assert.deepEqual(parseCompareSlugs(null), []);
  assert.deepEqual(parseCompareSlugs(undefined), []);
  assert.deepEqual(parseCompareSlugs(""), []);
  assert.deepEqual(parseCompareSlugs("   "), []);
  assert.deepEqual(parseCompareSlugs(",,,"), []);

  // 2. Whitespace trimming and empty item discard
  assert.deepEqual(
    parseCompareSlugs("erling-haaland,   , kylian-mbappe  "),
    ["erling-haaland", "kylian-mbappe"]
  );

  // 3. Deduplication preserving original order
  assert.deepEqual(
    parseCompareSlugs("jude-bellingham, erling-haaland, jude-bellingham"),
    ["jude-bellingham", "erling-haaland"]
  );

  // 4. Clamping to maximum 3 players
  assert.deepEqual(
    parseCompareSlugs("p1,p2,p3,p4,p5"),
    ["p1", "p2", "p3"]
  );

  // 5. Array input handling (from Next.js searchParams)
  assert.deepEqual(
    parseCompareSlugs(["saka", "foden,palmer", "musiala"]),
    ["saka", "foden", "palmer"]
  );

  // 6. Special character / XSS sanitization (only accepts [a-z0-9_-])
  assert.deepEqual(
    parseCompareSlugs("<script>alert(1)</script>,haaland-999,invalid%20slug"),
    ["haaland-999"]
  );
});

test("calculate12MonthChange - calculates exact delta and percentage math without zero-division", () => {
  const now = new Date();
  const eighteenMonthsAgo = new Date(now.getTime() - 540 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // 1. Positive growth: Baseline 100M -> Current 150M (+50M, +50%)
  const positiveHistory = [
    { date: eighteenMonthsAgo, valueEur: 80_000_000 },
    { date: oneYearAgo, valueEur: 100_000_000 },
    { date: sixMonthsAgo, valueEur: 130_000_000 },
  ];
  const posRes = calculate12MonthChange(positiveHistory, 150_000_000);
  assert.equal(posRes.diff, 50_000_000);
  assert.equal(posRes.pct, 50);
  assert.equal(posRes.isPositive, true);
  assert.equal(posRes.isNegative, false);
  assert.equal(posRes.baselineValue, 100_000_000);

  // 2. Negative drop: Baseline 120M -> Current 90M (-30M, -25%)
  const negativeHistory = [
    { date: oneYearAgo, valueEur: 120_000_000 },
  ];
  const negRes = calculate12MonthChange(negativeHistory, 90_000_000);
  assert.equal(negRes.diff, -30_000_000);
  assert.equal(negRes.pct, -25);
  assert.equal(negRes.isPositive, false);
  assert.equal(negRes.isNegative, true);

  // 3. Flat valuation: Baseline 80M -> Current 80M (0M, 0%)
  const flatRes = calculate12MonthChange(
    [{ date: oneYearAgo, valueEur: 80_000_000 }],
    80_000_000
  );
  assert.equal(flatRes.diff, 0);
  assert.equal(flatRes.pct, 0);
  assert.equal(flatRes.isPositive, false);
  assert.equal(flatRes.isNegative, false);

  // 4. Edge cases: Empty history or 0 current value
  const emptyRes = calculate12MonthChange([], 100_000_000);
  assert.equal(emptyRes.diff, 0);
  assert.equal(emptyRes.pct, 0);
  assert.equal(emptyRes.baselineValue, 0);

  const zeroCurrentRes = calculate12MonthChange(positiveHistory, 0);
  assert.equal(zeroCurrentRes.pct, 0);
  assert.equal(zeroCurrentRes.diff, 0);
});

test("calculatePeakValuation - correctly identifies historical peak value and peak date", () => {
  const peakDate = new Date("2024-06-15");
  const history = [
    { date: new Date("2023-01-01"), valueEur: 90_000_000 },
    { date: peakDate, valueEur: 180_000_000 },
    { date: new Date("2024-12-01"), valueEur: 160_000_000 },
  ];

  const res = calculatePeakValuation(history, 160_000_000);
  assert.equal(res.peakValue, 180_000_000);
  assert.equal(res.peakDate?.getTime(), peakDate.getTime());

  // Current valuation is higher than any historical point
  const currentPeakRes = calculatePeakValuation(history, 200_000_000);
  assert.equal(currentPeakRes.peakValue, 200_000_000);
});

test("mergeValuationTimelines - produces clean sorted chronological points without fabricating data", () => {
  const players = [
    {
      slug: "player-a",
      name: "Player A",
      marketValues: [
        { date: "2023-01-15T00:00:00Z", valueEur: 50_000_000 },
        { date: "2024-01-15T00:00:00Z", valueEur: 80_000_000 },
      ],
    },
    {
      slug: "player-b",
      name: "Player B",
      marketValues: [
        { date: "2023-06-15T00:00:00Z", valueEur: 60_000_000 },
        { date: "2024-01-15T00:00:00Z", valueEur: 90_000_000 },
      ],
    },
  ];

  const merged = mergeValuationTimelines(players);

  // Exactly 3 unique dates: Jan 2023, Jun 2023, Jan 2024
  assert.equal(merged.length, 3);
  assert.ok(merged[0].timestamp < merged[1].timestamp);
  assert.ok(merged[1].timestamp < merged[2].timestamp);

  // On Jan 2023: only player-a has a value
  assert.equal(merged[0]["player-a"], 50_000_000);
  assert.equal(merged[0]["player-b"], undefined);

  // On Jun 2023: only player-b has a value
  assert.equal(merged[1]["player-b"], 60_000_000);
  assert.equal(merged[1]["player-a"], undefined);

  // On Jan 2024: both players have real values
  assert.equal(merged[2]["player-a"], 80_000_000);
  assert.equal(merged[2]["player-b"], 90_000_000);
});

test("CompareFactsTable - renders 1, 2, and 3 players side-by-side with brand tokens and fact details", () => {
  const p1 = {
    id: "p1",
    slug: "erling-haaland",
    fullName: "Erling Haaland",
    position: "Centre-Forward",
    latestMarketValue: 200_000_000,
    marketValues: [
      { date: "2023-01-01", valueEur: 170_000_000 },
      { date: "2024-01-01", valueEur: 180_000_000 },
      { date: "2024-10-01", valueEur: 200_000_000 },
    ],
    currentClub: { id: "c1", name: "Manchester City", shortName: "Man City" },
    dateOfBirth: "2000-07-21",
    nationality: ["Norway"],
  };

  const p2 = {
    id: "p2",
    slug: "kylian-mbappe",
    fullName: "Kylian Mbappé",
    position: "Left Winger",
    latestMarketValue: 180_000_000,
    marketValues: [
      { date: "2023-01-01", valueEur: 180_000_000 },
      { date: "2024-10-01", valueEur: 180_000_000 },
    ],
    currentClub: { id: "c2", name: "Real Madrid" },
    dateOfBirth: "1998-12-20",
    nationality: "France",
  };

  const p3 = {
    id: "p3",
    slug: "jude-bellingham",
    fullName: "Jude Bellingham",
    position: "Attacking Midfield",
    latestMarketValue: 180_000_000,
    marketValues: [], // Empty history test
    currentClub: { id: "c2", name: "Real Madrid" },
    dateOfBirth: "2003-06-29",
    nationality: ["England"],
  };

  // 1. Single player render
  const html1 = renderToStaticMarkup(
    React.createElement(CompareFactsTable, { players: [p1], onRemovePlayer: () => {} })
  );
  assert.ok(html1.includes("Erling Haaland"), "Renders Haaland name");
  assert.ok(html1.includes("€200M"), "Renders Haaland value");
  assert.ok(html1.includes("Man City"), "Renders Haaland club");

  // 2. Two players render
  const html2 = renderToStaticMarkup(
    React.createElement(CompareFactsTable, { players: [p1, p2], onRemovePlayer: () => {} })
  );
  assert.ok(html2.includes("Erling Haaland") && html2.includes("Kylian Mbappé"), "Renders both players");
  assert.ok(html2.includes("€200M") && html2.includes("€180M"), "Renders both market values");

  // 3. Three players render (with empty history for p3)
  const html3 = renderToStaticMarkup(
    React.createElement(CompareFactsTable, { players: [p1, p2, p3], onRemovePlayer: () => {} })
  );
  assert.ok(html3.includes("Jude Bellingham"), "Renders third player");
  assert.ok(html3.includes("Attacking Midfield"), "Renders position");
  assert.ok(!html3.includes("NaN"), "Zero NaN values rendered even with empty history");
});

test("ClubValueTrendChart - renders chart when snapshots exist; otherwise returns null", () => {
  // 1. Zero or 1 snapshot returns null / empty string ("otherwise show nothing")
  const emptyHtml = renderToStaticMarkup(
    React.createElement(ClubValueTrendChart, { snapshots: [], clubName: "Arsenal" })
  );
  assert.equal(emptyHtml, "", "Empty snapshots must return null / empty markup");

  const singleHtml = renderToStaticMarkup(
    React.createElement(ClubValueTrendChart, {
      snapshots: [{ date: "2024-01-01", totalMarketValue: 900_000_000 }],
      clubName: "Arsenal",
    })
  );
  assert.equal(singleHtml, "", "Single snapshot must return null / empty markup");

  // 2. Multiple snapshots render chart and trend delta
  const multiSnapshots = [
    { date: "2024-01-01", totalMarketValue: 800_000_000, squadSize: 24 },
    { date: "2024-06-01", totalMarketValue: 950_000_000, squadSize: 25 },
  ];

  const html = renderToStaticMarkup(
    React.createElement(ClubValueTrendChart, {
      snapshots: multiSnapshots,
      clubName: "Arsenal",
    })
  );

  assert.ok(html.includes("Squad Value Trend"), "Renders squad value trend section");
  assert.ok(html.includes("€150M"), "Renders +€150M squad value growth");
  assert.ok(html.includes("18.8%"), "Renders +18.8% delta percentage");
  assert.ok(html.includes("role=\"region\""), "Includes accessible region role");
});
