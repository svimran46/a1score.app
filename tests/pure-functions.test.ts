process.env.SITE_URL = process.env.SITE_URL || "https://a1score.app";

import test from "node:test";
import assert from "node:assert/strict";
import { isYouthMove, formatTransferFee } from "../src/lib/transfers";
import { calculateAge, formatCompactEur, formatEur, formatDate } from "../src/lib/utils";
import { pureMd5 } from "../src/lib/fotmob/client";
import { rateLimit, getClientIP } from "../src/lib/rate-limit";
import cloudflareImageLoader from "../src/lib/image-loader";

test("isYouthMove - detects youth and academy moves correctly", () => {
  // Positive matches (should be true)
  assert.equal(isYouthMove("Real Madrid Castilla", "Getafe"), true);
  assert.equal(isYouthMove("FC Barcelona U19", "Barça Atlètic"), true);
  assert.equal(isYouthMove("Arsenal FC", "Arsenal FC Academy"), true);
  assert.equal(isYouthMove("Man City U21", "Man City"), true);
  assert.equal(isYouthMove("Bayern Munich II", "Bayern Munich"), true);
  assert.equal(isYouthMove("SL Benfica B-Team", "Benfica"), true);
  assert.equal(isYouthMove("Juventus Primavera", "Sassuolo"), true);

  // Negative matches (commercial first team moves should be false)
  assert.equal(isYouthMove("Real Madrid", "Paris Saint-Germain"), false);
  assert.equal(isYouthMove("Manchester City", "FC Barcelona"), false);
  assert.equal(isYouthMove("Liverpool FC", "Bayern Munich"), false);
  assert.equal(isYouthMove(null, "Arsenal"), false);
  assert.equal(isYouthMove(undefined, undefined), false);
});

test("formatTransferFee - formats fees, loans, and free transfers accurately", () => {
  // Monetary fees (> 0)
  assert.deepEqual(formatTransferFee(100_000_000, "Transfer"), {
    label: "€100M",
    isAmount: true,
  });
  assert.deepEqual(formatTransferFee(12_500_000, "Buy"), {
    label: "€12.5M",
    isAmount: true,
  });
  assert.deepEqual(formatTransferFee(850_000, "Transfer"), {
    label: "€850k",
    isAmount: true,
  });

  // Free transfers
  assert.deepEqual(formatTransferFee(0, "Free transfer"), {
    label: "Free Transfer",
    isAmount: false,
  });
  assert.deepEqual(formatTransferFee(0, "Transfer"), {
    label: "Free Transfer",
    isAmount: false,
  });
  assert.deepEqual(formatTransferFee(null, "Free transfer"), {
    label: "Free Transfer",
    isAmount: false,
  });

  // Loans
  assert.deepEqual(formatTransferFee(null, "Loan fee"), {
    label: "Loan",
    isAmount: false,
  });
  assert.deepEqual(formatTransferFee(0, "End of loan"), {
    label: "Loan",
    isAmount: false,
  });

  // Undisclosed / Unknown
  assert.deepEqual(formatTransferFee(null, "Unknown"), {
    label: "Undisclosed",
    isAmount: false,
  });
  assert.deepEqual(formatTransferFee(undefined, undefined), {
    label: "Undisclosed",
    isAmount: false,
  });
});

test("calculateAge - calculates accurate player ages from birth dates", () => {
  const today = new Date();
  const birth20YearsAgo = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate() - 1);
  assert.equal(calculateAge(birth20YearsAgo.toISOString()), 20);

  const birth30YearsAgo = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate() - 1);
  assert.equal(calculateAge(birth30YearsAgo.toISOString()), 30);

  assert.equal(calculateAge(null), null);
  assert.equal(calculateAge(undefined), null);
  assert.equal(calculateAge("invalid-date"), null);
});

test("formatCompactEur & formatEur - formats currency without jitter", () => {
  assert.equal(formatCompactEur(180_000_000), "€180M");
  assert.equal(formatCompactEur(12_500_000), "€12.5M");
  assert.equal(formatCompactEur(50_000), "€50k");
  assert.equal(formatCompactEur(500), "€500");
  assert.equal(formatCompactEur(0), "Free");

  // D6: Boundary valuations & Transfermarkt integer benchmark tiers
  assert.equal(formatCompactEur(999_999), "€1M");
  assert.equal(formatCompactEur(1_000_000), "€1M");
  assert.equal(formatCompactEur(999_500_000), "€999.5M");
  assert.equal(formatCompactEur(1_000_000_000), "€1B");
  assert.equal(formatCompactEur(1_200_000_000), "€1.2B");
  assert.equal(formatCompactEur(140_000_000), "€140M");
  assert.equal(formatCompactEur(120_000_000), "€120M");
  assert.equal(formatCompactEur(100_000_000), "€100M");

  assert.equal(formatEur(1500000), "€1,500,000");
  assert.equal(formatEur(0), "Free");
});

test("pureMd5 - produces correct cryptographic hashes without Node crypto", () => {
  // Known MD5 test vectors
  assert.equal(pureMd5("hello world"), "5eb63bbbe01eeed093cb22bb8f5acdc3");
  assert.equal(pureMd5(""), "d41d8cd98f00b204e9800998ecf8427e");
  assert.equal(pureMd5("a1score.app"), "95b0e8f5ba08346fa55b12f8ac2421e8");
});

test("rateLimit - enforces sliding window rate limits", () => {
  const testKey = "test-ip-rate-limit-123";
  // 5 requests allowed per window
  for (let i = 0; i < 5; i++) {
    const res = rateLimit(testKey, 5, 10_000);
    assert.equal(res.success, true);
  }

  // 6th request must be blocked
  const blocked = rateLimit(testKey, 5, 10_000);
  assert.equal(blocked.success, false);
  assert.equal(blocked.remaining, 0);
});

test("rateLimit - enforces stricter limits on unknown callers", () => {
  const unknownKey = "unknown_test_client_abc";
  // Requests with limit=60 are capped at 10 for unknown keys
  for (let i = 0; i < 10; i++) {
    const res = rateLimit(unknownKey, 60, 10_000);
    assert.equal(res.success, true);
    assert.equal(res.limit, 10);
  }

  // 11th request must be blocked under stricter limit
  const blocked = rateLimit(unknownKey, 60, 10_000);
  assert.equal(blocked.success, false);
});

test("getClientIP - extracts client IP or generates partitioned fingerprint without single anonymous bucket", () => {
  // 1. CF-Connecting-IP
  const req1 = new Request("http://localhost", {
    headers: { "cf-connecting-ip": "203.0.113.195" },
  });
  assert.equal(getClientIP(req1), "203.0.113.195");

  // 2. X-Forwarded-For
  const req2 = new Request("http://localhost", {
    headers: { "x-forwarded-for": "198.51.100.1, 10.0.0.1" },
  });
  assert.equal(getClientIP(req2), "198.51.100.1");

  // 3. Fallback without IP headers creates partitioned unknown key, NOT generic "anonymous"
  const req3 = new Request("http://localhost", {
    headers: { "user-agent": "Mozilla/5.0 TestBot", "accept-language": "en-US" },
  });
  const ip3 = getClientIP(req3);
  assert.equal(ip3.startsWith("unknown_"), true);
  assert.notEqual(ip3, "anonymous");
});

test("cloudflareImageLoader - respects resizing and CDN mirrors", () => {
  // Direct SVG or data URLs bypass transformation
  assert.equal(
    cloudflareImageLoader({ src: "/logo.svg", width: 64 }),
    "/logo.svg"
  );
  assert.equal(
    cloudflareImageLoader({ src: "data:image/png;base64,...", width: 64 }),
    "data:image/png;base64,..."
  );

  // Standard external URL returns internal edge proxy URL to avoid exposing upstream domains
  const extUrl = "https://example.com/portrait/header/12345.jpg";
  const res = cloudflareImageLoader({ src: extUrl, width: 128, quality: 80 });
  assert.equal(res.startsWith("/img/asset/"), true);
});

test("formatTitle - formats titles cleanly without duplicate suffixes", async () => {
  const { formatTitle } = await import("../src/lib/metadata");
  assert.equal(formatTitle("Premier League"), "Premier League | a1score.app");
  assert.equal(formatTitle("Premier League | a1score.app"), "Premier League | a1score.app");
  assert.equal(formatTitle("Real Madrid | a1score.app "), "Real Madrid | a1score.app");
});

test("constructMetadata - enforces canonical and og:url consistency", async () => {
  process.env.SITE_URL = "https://a1score.app";
  const { constructMetadata } = await import("../src/lib/metadata");
  const meta = constructMetadata({
    title: "Manchester City",
    description: "Squad analytics",
    path: "/clubs/manchester-city",
  });
  assert.equal(meta.title, "Manchester City | a1score.app");
  assert.equal(meta.alternates?.canonical, "https://a1score.app/clubs/manchester-city");
  assert.equal((meta.openGraph as any)?.url, "https://a1score.app/clubs/manchester-city");
});

test("formatKickoff - formats kickoff with explicit timezone label", async () => {
  const { formatKickoff } = await import("../src/lib/utils");
  const iso = "2026-10-01T20:00:00Z";

  // UTC timezone
  const utc = formatKickoff(iso, { tz: "UTC" });
  assert.match(utc, /20:00\s*(UTC|GMT)/);

  // Custom timezone (e.g. America/New_York)
  const ny = formatKickoff(iso, { tz: "America/New_York" });
  assert.match(ny, /16:00\s*(EDT|GMT-4)/);

  // Full date with timezone
  const fullUtc = formatKickoff(iso, { tz: "UTC", includeDate: true });
  assert.match(fullUtc, /Oct.*20:00\s*(UTC|GMT)/);

  // Missing or null date
  assert.equal(formatKickoff(null), "TBD");
  assert.equal(formatKickoff(undefined), "TBD");
});
