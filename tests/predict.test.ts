import test from "node:test";
import assert from "node:assert/strict";
import { calculatePredictionPoints } from "../src/lib/predict/scoring";

test("exact score yields 3 points with exact outcome label", () => {
  const result = calculatePredictionPoints(2, 1, 2, 1);
  assert.equal(result.points, 3);
  assert.equal(result.outcome, "exact");
  assert.match(result.label, /3 pts/);

  // Exact 0-0 draw
  const draw = calculatePredictionPoints(0, 0, 0, 0);
  assert.equal(draw.points, 3);
  assert.equal(draw.outcome, "exact");
});

test("correct match outcome with different scoreline yields 2 points", () => {
  // Home win
  const homeWin = calculatePredictionPoints(3, 0, 2, 1);
  assert.equal(homeWin.points, 2);
  assert.equal(homeWin.outcome, "outcome");

  // Away win
  const awayWin = calculatePredictionPoints(0, 2, 1, 3);
  assert.equal(awayWin.points, 2);
  assert.equal(awayWin.outcome, "outcome");

  // Draw with different goals
  const scoreDraw = calculatePredictionPoints(1, 1, 2, 2);
  assert.equal(scoreDraw.points, 2);
  assert.equal(scoreDraw.outcome, "outcome");
});

test("incorrect outcome yields 0 points with wrong label", () => {
  // Predicted home win, but away won
  const wrongLoss = calculatePredictionPoints(2, 1, 0, 2);
  assert.equal(wrongLoss.points, 0);
  assert.equal(wrongLoss.outcome, "wrong");

  // Predicted draw, but home won
  const wrongDraw = calculatePredictionPoints(1, 1, 2, 0);
  assert.equal(wrongDraw.points, 0);
  assert.equal(wrongDraw.outcome, "wrong");

  // Predicted away win, but ended draw
  const missedDraw = calculatePredictionPoints(0, 1, 1, 1);
  assert.equal(missedDraw.points, 0);
  assert.equal(missedDraw.outcome, "wrong");
});
