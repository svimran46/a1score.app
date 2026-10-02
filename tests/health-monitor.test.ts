(process.env as any).NODE_ENV = "test";

import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  validateFotmobMatches,
  validateFotmobLeague,
  validateFotmobMatchDetails,
  validateTmMarketValueGraph,
  validateTmTransferHistory,
  recordSchemaDrift,
  getSchemaDriftStatus,
  clearSchemaDrift,
} from "../src/lib/validation/upstream-shapes";
import { aggregateHealthStatus } from "../src/lib/health/checks";
import { getFreshnessDetails } from "../src/components/ui/ValuationFreshness";
import { GET as getHealthDetail } from "../src/app/api/health/detail/route";

test("upstream validator: validateFotmobMatches accepts conforming shape and rejects drifted shape", () => {
  clearSchemaDrift();

  // 1. Valid conforming shape
  const validData = {
    leagues: [
      {
        id: 47,
        name: "Premier League",
        matches: [
          {
            id: 12345,
            home: { id: 1, name: "Arsenal", score: 2 },
            away: { id: 2, name: "Chelsea", score: 1 },
            status: { started: true, finished: true, scoreStr: "2 - 1" },
          },
        ],
      },
    ],
  };

  const validRes = validateFotmobMatches(validData, "/api/data/matches");
  assert.equal(validRes.success, true);
  assert.equal(validRes.error, null);

  // 2. Drifted shape: leagues is not an array or match items have wrong types
  const driftedData = {
    leagues: "invalid_not_array",
  };

  const driftedRes = validateFotmobMatches(driftedData, "/api/data/matches");
  assert.equal(driftedRes.success, false);
  assert.ok(driftedRes.error && driftedRes.error.length > 0);

  // Drift must be recorded in drift tracker
  const drift = getSchemaDriftStatus("fotmob");
  assert.ok(drift);
  assert.equal(drift?.source, "fotmob");
  assert.equal(drift?.hasDrift, true);
});

test("upstream validator: validateFotmobLeague validates league details structure", () => {
  clearSchemaDrift();

  const validLeague = {
    details: { id: 47, name: "Premier League" },
    table: [{ data: { table: { all: [] } } }],
  };
  const val = validateFotmobLeague(validLeague);
  assert.equal(val.success, true);

  const invalidLeague = "not-an-object";
  const invalidVal = validateFotmobLeague(invalidLeague);
  assert.equal(invalidVal.success, false);
});

test("upstream validator: validateFotmobMatchDetails validates match header and content", () => {
  clearSchemaDrift();

  const validDetails = {
    general: { matchId: 1001, leagueName: "Premier League" },
    header: { teams: [{ name: "Arsenal" }, { name: "Chelsea" }] },
  };
  const val = validateFotmobMatchDetails(validDetails);
  assert.equal(val.success, true);

  const invalidDetails = {
    general: "not-an-object-must-be-object",
  };
  const invalidVal = validateFotmobMatchDetails(invalidDetails);
  assert.equal(invalidVal.success, false);
});

test("upstream validator: validateTmMarketValueGraph validates curve points and catches schema drift", () => {
  clearSchemaDrift();

  // Valid market value curve
  const validMv = {
    list: [
      { y: 180000000, x: 1704067200000, datum_mw: "Jan 1, 2024", verein: "Real Madrid" },
      { y: 200000000, x: 1719792000000, datum_mw: "Jul 1, 2024", verein: "Real Madrid" },
    ],
  };
  const validRes = validateTmMarketValueGraph(validMv);
  assert.equal(validRes.success, true);

  // Malformed curve: missing 'list' or y is not number/string
  const malformedMv = {
    list: [
      { datum_mw: "Jan 1, 2024" }, // missing required 'y' market value
    ],
  };
  const malformedRes = validateTmMarketValueGraph(malformedMv);
  assert.equal(malformedRes.success, false);
  assert.ok(malformedRes.error);

  const tmDrift = getSchemaDriftStatus("transfermarkt");
  assert.ok(tmDrift);
  assert.equal(tmDrift?.source, "transfermarkt");
});

test("upstream validator: validateTmTransferHistory validates transfer records", () => {
  clearSchemaDrift();

  const validTransfers = {
    transfers: [
      {
        season: "23/24",
        date: "Jul 1, 2023",
        from: { clubName: "Dortmund" },
        to: { clubName: "Real Madrid" },
        fee: "€103.00m",
      },
    ],
  };
  assert.equal(validateTmTransferHistory(validTransfers).success, true);

  const invalidTransfers = {
    transfers: "invalid-not-an-array",
  };
  assert.equal(validateTmTransferHistory(invalidTransfers).success, false);
});

test("health aggregation: correctly assesses ok, degraded, and down states", () => {
  // 1. All healthy -> ok
  const allOk = aggregateHealthStatus({
    fotmob: "ok",
    transfermarkt: "ok",
    database: "ok",
    cache: "ok",
  });
  assert.equal(allOk, "ok");

  // 2. Single upstream degraded -> degraded (app continues with cache)
  const oneDegraded = aggregateHealthStatus({
    fotmob: "degraded",
    transfermarkt: "ok",
    database: "ok",
    cache: "ok",
  });
  assert.equal(oneDegraded, "degraded");

  // 3. Database down -> down
  const dbDown = aggregateHealthStatus({
    fotmob: "ok",
    transfermarkt: "ok",
    database: "down",
    cache: "ok",
  });
  assert.equal(dbDown, "down");

  // 4. Multiple services down -> down
  const multiDown = aggregateHealthStatus({
    fotmob: "down",
    transfermarkt: "down",
    database: "ok",
    cache: "ok",
  });
  assert.equal(multiDown, "down");
});

test("staleness rules: getFreshnessDetails calculates relative time and evaluates thresholds", () => {
  // 1. Null or invalid timestamp -> returns null
  assert.equal(getFreshnessDetails(null), null);
  assert.equal(getFreshnessDetails("invalid-date-string"), null);

  const now = Date.now();

  // 2. Fresh timestamp (just now)
  const fresh = getFreshnessDetails(new Date(now - 1000 * 60 * 5).toISOString(), 30);
  assert.ok(fresh);
  assert.equal(fresh?.relativeStr, "just now");
  assert.equal(fresh?.isOutOfDate, false);

  // 3. 5 days ago (within 30 day threshold)
  const fiveDaysAgo = new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString();
  const resFive = getFreshnessDetails(fiveDaysAgo, 30);
  assert.ok(resFive);
  assert.equal(resFive?.relativeStr, "5 days ago");
  assert.equal(resFive?.isOutOfDate, false);

  // 4. 45 days ago (exceeds 30 day threshold -> isOutOfDate: true)
  const fortyFiveDaysAgo = new Date(now - 1000 * 60 * 60 * 24 * 45).toISOString();
  const resStale = getFreshnessDetails(fortyFiveDaysAgo, 30);
  assert.ok(resStale);
  assert.equal(resStale?.isOutOfDate, true);
});

test("detail endpoint: authentication rejects unauthorized requests and authorizes valid secrets", async () => {
  const originalSecret = process.env.HEALTH_SECRET;
  try {
    process.env.HEALTH_SECRET = "super-secret-sentinel-token";

    // 1. Missing secret header -> 401
    const unauthReq = new NextRequest("https://a1score.app/api/health/detail");
    const unauthRes = await getHealthDetail(unauthReq);
    assert.equal(unauthRes.status, 401);
    const unauthJson = await unauthRes.json();
    assert.match(unauthJson.error, /Unauthorized/i);

    // 2. Invalid secret header -> 401
    const wrongSecretReq = new NextRequest("https://a1score.app/api/health/detail", {
      headers: { "x-health-secret": "wrong-secret-value" },
    });
    const wrongSecretRes = await getHealthDetail(wrongSecretReq);
    assert.equal(wrongSecretRes.status, 401);

    // 3. Valid secret via x-health-secret -> 200 (or 503 if real network down in test)
    const validReq = new NextRequest("https://a1score.app/api/health/detail", {
      headers: { "x-health-secret": "super-secret-sentinel-token" },
    });
    const validRes = await getHealthDetail(validReq);
    assert.ok(validRes.status === 200 || validRes.status === 503);
    const detailJson = await validRes.json();
    assert.ok(detailJson.componentsDetail);
    assert.ok(detailJson.timings);

    // 4. Valid secret via Bearer token Authorization header
    const bearerReq = new NextRequest("https://a1score.app/api/health/detail", {
      headers: { authorization: "Bearer super-secret-sentinel-token" },
    });
    const bearerRes = await getHealthDetail(bearerReq);
    assert.ok(bearerRes.status === 200 || bearerRes.status === 503);
  } finally {
    if (originalSecret) process.env.HEALTH_SECRET = originalSecret;
    else delete process.env.HEALTH_SECRET;
  }
});
