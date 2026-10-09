import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { layoutAnnotations, timeTicks, valueAxis } from "../src/components/MarketValueChart";
import {
  ChartSkeleton,
  availableRanges,
  chartCardHeight,
  chartSlots,
} from "../src/components/players/ChartSkeleton";

// tsx compiles JSX with the classic runtime; components rely on Next's automatic one.
(globalThis as { React?: typeof React }).React = React;

const D = (s: string) => Date.parse(`${s}T00:00:00Z`);
type P = [number, number, number];

test("Y domain starts at 0 and tops out within 1.25x of the visible max", () => {
  for (const max of [50_000, 300_000, 1_000_000, 1_500_000, 7_300_000, 9_990_000, 93_000_000, 101_000_000, 200_000_000]) {
    for (const n of [3, 4]) {
      const { top, ticks } = valueAxis(max, n);
      assert.ok(top >= max * 1.08, `top ${top} covers ${max}`);
      assert.ok(top <= max * 1.25, `top ${top} within 1.25x of ${max}`);
      assert.equal(ticks[0], 0);
      assert.ok(ticks.length >= 2 && ticks.length <= n, `${ticks.length} ticks for n=${n}`);
      assert.ok(ticks[ticks.length - 1] <= top);
    }
  }
  // A EUR1.5M player's line reaches the upper half of the plot.
  assert.ok(1_500_000 / valueAxis(1_500_000, 3).top > 0.5);
});

test("year ticks are 1 January, thinned to 44px, quarters for 1Y", () => {
  const { ticks, unit } = timeTicks(D("2015-03-01"), D("2026-03-12"), 300, false);
  assert.equal(unit, "year");
  for (const t of ticks) assert.equal(new Date(t).toISOString().slice(5, 10), "01-01");
  const pxPerYear = 300 / ((D("2026-03-12") - D("2015-03-01")) / (365.25 * 86_400_000));
  for (let i = 1; i < ticks.length; i++) {
    assert.ok(((ticks[i] - ticks[i - 1]) / (365.25 * 86_400_000)) * pxPerYear >= 43.9);
  }
  const q = timeTicks(D("2025-03-12"), D("2026-03-12"), 600, true);
  assert.equal(q.unit, "quarter");
  for (const t of q.ticks) assert.ok([0, 3, 6, 9].includes(new Date(t).getUTCMonth()));
});

test("range chips are honest", () => {
  const pts = (dates: string[]): P[] => dates.map((d, i) => [D(d), (i + 1) * 1e6, 0]);
  // 2-3 points: no chips
  assert.deepEqual(availableRanges(pts(["2022-01-01", "2023-01-01", "2024-01-01"])), []);
  // All points inside 1Y: every window has the same count, so no chip row
  assert.deepEqual(availableRanges(pts(["2025-04-01", "2025-07-01", "2025-10-01", "2026-01-01"])), []);
  // Distinct windows
  const r = availableRanges(
    pts(["2014-01-01", "2018-01-01", "2020-01-01", "2022-06-01", "2023-06-01", "2025-06-01", "2026-03-01"])
  );
  assert.deepEqual(r, ["all", "5y", "3y", "1y"]);
  // 5Y equal to All is dropped
  assert.deepEqual(
    availableRanges(pts(["2022-01-01", "2023-01-01", "2024-06-01", "2025-06-01", "2026-03-01"])),
    ["all", "3y", "1y"]
  );
});

test("skeleton and chart share one height budget", () => {
  assert.equal(chartCardHeight({ chips: true, legend: true }, false), 380);
  assert.equal(chartCardHeight({ chips: true, legend: true }, true), 428);
  assert.equal(chartCardHeight({ chips: false, legend: false }, false), 304);
  const props = {
    points: [[D("2020-01-01"), 1e6, 0], [D("2021-01-01"), 2e6, 0]] as P[],
    markers: [[D("2020-06-01"), 5e6, "X"]] as [number, number, string | null][],
  };
  assert.deepEqual(chartSlots(props), { chips: false, legend: true });
  const html = renderToStaticMarkup(ChartSkeleton({ chips: false, legend: true }));
  assert.match(html, /h-\[220px\] @\[560px\]\/profile:h-\[260px\]/);
  assert.match(html, /motion-safe:animate-pulse/);
  // readout only, no chip row
  assert.equal(html.match(/h-11 shrink-0/g)?.length, 1);
});

test("annotation labels never overlap the peak label", () => {
  const out = layoutAnnotations({
    plotLeft: 8,
    plotRight: 632,
    plotTop: 16,
    peak: { x: 500, y: 40, label: "Peak €200M" },
    ticks: [{ value: 200e6, y: 36, label: "€200M" }],
    markers: [
      { t: 1, x: 470, label: "→ Manchester City €60M" },
      { t: 2, x: 300, label: "→ Dortmund €20M" },
    ],
  });
  assert.equal(out.markers.size, 2);
  assert.notEqual(out.markers.get(1)?.anchor, "start");
});
