import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyTransferType,
  shouldHideTransferRow,
  formatTransferDate,
  DOCUMENTED_ALL_TIME_RECORDS,
} from "../src/lib/data/transfers";

// ---- classifyTransferType -------------------------------------------------

test("classifies retirements", () => {
  assert.equal(classifyTransferType(null, null, "Juventus", "Retired").category, "retirement");
  assert.equal(classifyTransferType(null, null, "Juventus", "Career break").category, "retirement");
});

test("classifies releases / unattached", () => {
  assert.equal(classifyTransferType(null, 0, "Chelsea", "Without Club").category, "released");
  assert.equal(classifyTransferType("released", null, "Chelsea", "Unknown").category, "released");
});

test("classifies loans and loans with option", () => {
  assert.equal(classifyTransferType("loan", null, "A", "B").category, "loan");
  assert.equal(classifyTransferType("loan with option to buy", null, "A", "B").category, "loan_with_option");
});

test("classifies free and permanent", () => {
  assert.equal(classifyTransferType(null, 0, "A", "B").category, "free");
  assert.equal(classifyTransferType(null, 50_000_000, "A", "B").category, "permanent");
  assert.equal(classifyTransferType("end of contract", null, "A", "B").category, "contract_expiry");
});

// ---- shouldHideTransferRow ------------------------------------------------

test("never shows unknown club with undisclosed / zero fee", () => {
  assert.equal(shouldHideTransferRow("Unknown", "PSG", null, 200_000_000), true);
  assert.equal(shouldHideTransferRow("Ajax", "", 0, 200_000_000), true);
});

test("hides unknown club for low-value players, keeps for top-tier", () => {
  assert.equal(shouldHideTransferRow("Unknown", "Lyon", 5_000_000, 2_000_000), true);
  assert.equal(shouldHideTransferRow("Unknown", "Lyon", 5_000_000, 40_000_000), false);
});

test("keeps fully known rows", () => {
  assert.equal(shouldHideTransferRow("Ajax", "Arsenal", null, 0), false);
});

// ---- formatTransferDate ---------------------------------------------------

test("drops placeholder dates beyond the current year (e.g. 2030)", () => {
  const nextYear = new Date().getFullYear() + 1;
  assert.equal(formatTransferDate(`${nextYear}-07-01`).isInvalidPlaceholder, true);
  assert.equal(formatTransferDate("2030-06-30").isInvalidPlaceholder, true);
});

test("labels future-dated deals within the current year as agreed", () => {
  const now = new Date();
  // pick a date later this year if one exists
  const future = new Date(now.getTime() + 24 * 3600 * 1000);
  if (future.getFullYear() === now.getFullYear()) {
    const r = formatTransferDate(future.toISOString());
    assert.equal(r.isFuture, true);
    assert.match(r.displayDate, /^Agreed, effective /);
  }
});

test("past dates are plain and missing dates never fabricate a value", () => {
  const r = formatTransferDate("2017-08-03T00:00:00.000Z");
  assert.equal(r.isFuture, false);
  assert.match(r.displayDate, /2017/);
  assert.equal(formatTransferDate(null).displayDate, "Undisclosed");
});

// ---- all-time records -----------------------------------------------------

test("all-time records: Neymar EUR 222M is #1, Mbappé EUR 180M is #2", () => {
  const sorted = [...DOCUMENTED_ALL_TIME_RECORDS].sort((a, b) => (b.feeEur || 0) - (a.feeEur || 0));
  assert.equal(sorted[0].player?.commonName, "Neymar");
  assert.equal(sorted[0].feeEur, 222_000_000);
  assert.equal(sorted[1].feeEur, 180_000_000);
});

test("all-time records contain no duplicates and no synthetic Rodri row", () => {
  const ids = DOCUMENTED_ALL_TIME_RECORDS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(!ids.includes("trans-rodri-1790753937374"));
  assert.ok(DOCUMENTED_ALL_TIME_RECORDS.length <= 20);
});
