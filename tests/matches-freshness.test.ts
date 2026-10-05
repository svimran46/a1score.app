import test from "node:test";
import assert from "node:assert/strict";
import {
  formatToYyyyMmDd,
  getDefaultMatchDate,
  isTodayUtc,
  isPastDateUtc,
  isFutureDateUtc,
  getMatchCacheTtl,
  evaluateLiveMatchFreshness,
} from "../src/lib/date-utils";

test("Task 2 & 7: Default date selection across clocks and timezones", () => {
  // Test with explicit param
  assert.equal(getDefaultMatchDate("20261005"), "20261005");
  assert.equal(getDefaultMatchDate("invalid"), formatToYyyyMmDd(new Date()));

  // Test with mocked clocks around midnight
  const midnightUtc = new Date("2026-10-04T00:00:05.000Z");
  assert.equal(formatToYyyyMmDd(midnightUtc), "20261004");

  const lateNightUtc = new Date("2026-10-03T23:59:55.000Z");
  assert.equal(formatToYyyyMmDd(lateNightUtc), "20261003");

  // UTC+8 vs UTC-5 representation
  // 2026-10-04 03:00:00 UTC is:
  // - 11:00 AM Oct 4 in UTC+8
  // - 10:00 PM Oct 3 in UTC-5
  const baseTime = new Date("2026-10-04T03:00:00.000Z");
  assert.equal(formatToYyyyMmDd(baseTime), "20261004");
  assert.equal(isTodayUtc("20261004", baseTime), true);
  assert.equal(isPastDateUtc("20261003", baseTime), true);
  assert.equal(isFutureDateUtc("20261005", baseTime), true);
});

test("Task 3 & 7: TTL selection by match state and date", () => {
  const now = new Date("2026-10-03T12:00:00.000Z");

  // Live match present on today: 30s TTL
  assert.equal(getMatchCacheTtl("20261003", true, now), 30);

  // Today with no active live matches: 60s TTL
  assert.equal(getMatchCacheTtl("20261003", false, now), 60);

  // Past finished matchday: 86400s (24h) TTL
  assert.equal(getMatchCacheTtl("20260930", false, now), 86400);

  // Upcoming fixture matchday: 300s (5m) TTL
  assert.equal(getMatchCacheTtl("20261005", false, now), 300);
});

test("Task 4 & 7: Stale-status guard for live matches", () => {
  const baseNow = 1791000000000; // Reference timestamp

  // 1. Plausible live match within 3 minutes
  const normalLive = evaluateLiveMatchFreshness({
    isLive: true,
    liveMinuteStr: "34'",
    lastUpdatedMs: baseNow - 60000, // 1 min ago
    nowMs: baseNow,
  });
  assert.equal(normalLive.isUnconfirmed, false);
  assert.equal(normalLive.statusLabel, "34'");

  // 2. Stale update (> 3 minutes without refresh)
  const staleLive = evaluateLiveMatchFreshness({
    isLive: true,
    liveMinuteStr: "42'",
    lastUpdatedMs: baseNow - 200000, // 3m20s ago (> 3 min)
    nowMs: baseNow,
  });
  assert.equal(staleLive.isUnconfirmed, true);
  assert.equal(staleLive.statusLabel, "Status unconfirmed");

  // 3. Implausible first-half stoppage minute (> 45+10') e.g. "45+13'"
  const implausible1stHalf = evaluateLiveMatchFreshness({
    isLive: true,
    liveMinuteStr: "45+13'",
    lastUpdatedMs: baseNow - 30000,
    nowMs: baseNow,
  });
  assert.equal(implausible1stHalf.isUnconfirmed, true);
  assert.equal(implausible1stHalf.statusLabel, "Status unconfirmed");

  // 4. Plausible first-half stoppage minute (45+4')
  const plausible1stHalf = evaluateLiveMatchFreshness({
    isLive: true,
    liveMinuteStr: "45+4'",
    lastUpdatedMs: baseNow - 30000,
    nowMs: baseNow,
  });
  assert.equal(plausible1stHalf.isUnconfirmed, false);
  assert.equal(plausible1stHalf.statusLabel, "45+4'");

  // 5. Implausible second-half minute (> 90+15' without extra time)
  const implausible2ndHalf = evaluateLiveMatchFreshness({
    isLive: true,
    liveMinuteStr: "90+18'",
    lastUpdatedMs: baseNow - 30000,
    nowMs: baseNow,
    reason: null,
  });
  assert.equal(implausible2ndHalf.isUnconfirmed, true);
  assert.equal(implausible2ndHalf.statusLabel, "Status unconfirmed");

  // 6. Plausible Extra Time with explicit reason
  const extraTimeMatch = evaluateLiveMatchFreshness({
    isLive: true,
    liveMinuteStr: "110'",
    lastUpdatedMs: baseNow - 30000,
    nowMs: baseNow,
    reason: "Extra Time",
  });
  assert.equal(extraTimeMatch.isUnconfirmed, false);
  assert.equal(extraTimeMatch.statusLabel, "110'");

  // 7. Non-live matches remain unaffected
  const finishedMatch = evaluateLiveMatchFreshness({
    isLive: false,
    liveMinuteStr: "FT",
  });
  assert.equal(finishedMatch.isUnconfirmed, false);
});
