import test from "node:test";
import assert from "node:assert/strict";
import { isYouthMove, formatTransferFee } from "../src/lib/transfers";
import { calculateAge, formatCompactEur, formatEur, formatDate } from "../src/lib/utils";
import { pureMd5 } from "../src/lib/fotmob/client";
import { rateLimit } from "../src/lib/rate-limit";
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

  // Standard external URL returns direct URL when no custom domain resizing/R2 is configured
  const extUrl = "https://img.a.transfermarkt.technology/portrait/header/12345.jpg";
  const res = cloudflareImageLoader({ src: extUrl, width: 128, quality: 80 });
  assert.equal(res, extUrl);
});
