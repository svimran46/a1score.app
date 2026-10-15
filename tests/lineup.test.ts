import test from "node:test";
import assert from "node:assert/strict";
import { FORMATIONS, FormationKey, calculateLineupMetrics, LineupSlot } from "../src/lib/lineup/types";

test("every supported formation defines exactly 11 slots with valid coordinates", () => {
  const keys = Object.keys(FORMATIONS) as FormationKey[];
  assert.equal(keys.length, 5);

  for (const key of keys) {
    const formation = FORMATIONS[key];
    assert.equal(formation.slots.length, 11, `${key} must have exactly 11 slots`);

    const gks = formation.slots.filter((s) => s.position === "GK");
    assert.equal(gks.length, 1, `${key} must have exactly 1 GK`);

    for (const slot of formation.slots) {
      assert.ok(slot.x >= 0 && slot.x <= 100, `Slot ${slot.id} x is out of bounds in ${key}`);
      assert.ok(slot.y >= 0 && slot.y <= 100, `Slot ${slot.id} y is out of bounds in ${key}`);
      assert.ok(["GK", "DEF", "MID", "ATT"].includes(slot.role), `Unknown role for ${slot.id}`);
    }
  }
});

test("calculateLineupMetrics correctly aggregates total market value and average age", () => {
  const slots: LineupSlot[] = [
    { id: "1", position: "GK", role: "GK", x: 50, y: 88, marketValueEur: 45_000_000, age: 29 },
    { id: "2", position: "CB", role: "DEF", x: 38, y: 72, marketValueEur: 80_000_000, age: 25 },
    { id: "3", position: "ST", role: "ATT", x: 50, y: 16, marketValueEur: 180_000_000, age: 24 },
    { id: "4", position: "CM", role: "MID", x: 50, y: 52 }, // empty
  ];

  const metrics = calculateLineupMetrics(slots);
  assert.equal(metrics.totalValueEur, 305_000_000);
  assert.equal(metrics.filledCount, 3);
  assert.equal(metrics.averageAge, 26); // (29 + 25 + 24) / 3 = 26
});
