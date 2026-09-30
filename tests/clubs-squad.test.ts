import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { isFirstTeamPlayer, getAllClubs } from "../src/lib/data/clubs";

test("isFirstTeamPlayer - accurately classifies squad membership", () => {
  // First team status
  assert.equal(isFirstTeamPlayer({ status: "first_team" }), true);
  assert.equal(isFirstTeamPlayer({ status: "on_loan" }), true);
  assert.equal(isFirstTeamPlayer({ tier: "first_team" }), true);
  assert.equal(isFirstTeamPlayer({ tier: "on_loan" }), true);

  // Non-first team exclusions
  assert.equal(isFirstTeamPlayer({ status: "departed" }), false);
  assert.equal(isFirstTeamPlayer({ status: "academy" }), false);
  assert.equal(isFirstTeamPlayer({ status: "loan_out" }), false);
  assert.equal(isFirstTeamPlayer({ tier: "academy" }), false);
  assert.equal(isFirstTeamPlayer({ tier: "loan_out" }), false);
  assert.equal(isFirstTeamPlayer(null), false);
  assert.equal(isFirstTeamPlayer(undefined), false);
});

test("D1: All displayed clubs on /clubs must have first-team squad sizes within 15–45", async () => {
  const clubs = await getAllClubs();

  // If no DB connection (e.g. offline CI without DATABASE_URL), skip gracefully
  if (clubs.length === 0) {
    console.log("Skipping DB club bounds verification: no clubs returned (likely offline or missing credentials)");
    return;
  }

  assert.ok(clubs.length >= 100, `Expected at least 100 clubs in directory, got ${clubs.length}`);

  for (const club of clubs) {
    assert.ok(
      club.playerCount !== null && club.playerCount >= 15 && club.playerCount <= 45,
      `Club "${club.name}" has invalid squad size: ${club.playerCount}. Expected between 15 and 45.`
    );
  }

  // Specifically verify known outliers that had ~115 or ~52 in raw data
  const inter = clubs.find((c) => c.name.toLowerCase().includes("inter") && !c.name.toLowerCase().includes("miami"));
  if (inter) {
    assert.ok(
      inter.playerCount! >= 15 && inter.playerCount! <= 45,
      `Inter Milan squad size (${inter.playerCount}) must be within 15-45`
    );
  }

  const forest = clubs.find((c) => c.name.toLowerCase().includes("nottingham forest"));
  if (forest) {
    assert.ok(
      forest.playerCount! >= 15 && forest.playerCount! <= 45,
      `Nottingham Forest squad size (${forest.playerCount}) must be within 15-45`
    );
  }
});
