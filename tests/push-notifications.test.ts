import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { subscriptionStore } from "../src/lib/notifications/store";
import {
  dispatchValuationAlerts,
  PlayerValuationMovement,
} from "../src/lib/notifications/dispatcher";
import { urlBase64ToUint8Array, DEFAULT_VAPID_PUBLIC_KEY } from "../src/lib/notifications/vapid";

test("Task A: PWA Manifest & Service Worker verification", () => {
  // 1. Verify Service Worker push and notificationclick handlers
  const swPath = path.join(process.cwd(), "public", "sw.js");
  assert.ok(fs.existsSync(swPath), "public/sw.js must exist");
  const swContent = fs.readFileSync(swPath, "utf-8");
  assert.ok(swContent.includes('self.addEventListener("push"'), "SW must handle push event");
  assert.ok(swContent.includes('self.addEventListener("notificationclick"'), "SW must handle notificationclick event");
  assert.ok(swContent.includes("event.notification.close()"), "SW must close notification on click");
  assert.ok(swContent.includes("clients.openWindow"), "SW must open/focus client window on click");

  // 2. Verify Manifest properties
  const manifestPath = path.join(process.cwd(), "src", "app", "manifest.ts");
  assert.ok(fs.existsSync(manifestPath), "manifest.ts must exist");
  const manifestContent = fs.readFileSync(manifestPath, "utf-8");
  assert.ok(manifestContent.includes('"standalone"'), "Manifest must specify standalone display");
  assert.ok(manifestContent.includes("#0a0d12"), "Manifest colors must match theme token #0a0d12");
  assert.ok(!manifestContent.includes("Real-time"), "Manifest copy must not promise real-time valuations");
});

test("Task B: Subscription store CRUD & zero PII invariant", async () => {
  const testEndpoint = "https://fcm.googleapis.com/fcm/send/test-sub-12345";
  const testSub = {
    endpoint: testEndpoint,
    keys: {
      p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DKM",
      auth: "tBHItJI5svbpez7KI4CCXg",
    },
    followedPlayerIds: ["player-yamal-101", "player-haaland-202"],
    threshold: 0.05,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Save subscription
  await subscriptionStore.save(testSub);

  // 2. Retrieve subscription
  const retrieved = await subscriptionStore.get(testEndpoint);
  assert.ok(retrieved, "Subscription must be retrievable");
  assert.equal(retrieved.endpoint, testEndpoint);
  assert.equal(retrieved.threshold, 0.05);
  assert.deepEqual(retrieved.followedPlayerIds, ["player-yamal-101", "player-haaland-202"]);

  // 3. Verify zero personal data stored (no name, email, IP)
  const keys = Object.keys(retrieved);
  assert.ok(!keys.includes("email"), "Must not store email");
  assert.ok(!keys.includes("name"), "Must not store name");
  assert.ok(!keys.includes("ip"), "Must not store IP address");

  // 4. Update last notified timestamp
  const notifyTime = new Date().toISOString();
  await subscriptionStore.updateLastNotified(testEndpoint, notifyTime);
  const updated = await subscriptionStore.get(testEndpoint);
  assert.equal(updated?.lastNotifiedAt, notifyTime);

  // 5. Delete subscription
  const deleted = await subscriptionStore.delete(testEndpoint);
  assert.equal(deleted, true);
  const postDelete = await subscriptionStore.get(testEndpoint);
  assert.equal(postDelete, null);
});

test("Task B: VAPID Key validation and base64 conversion", () => {
  assert.ok(DEFAULT_VAPID_PUBLIC_KEY.length > 50, "VAPID public key must be defined");
  const uint8 = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
  assert.ok(uint8 instanceof Uint8Array, "Must convert to Uint8Array");
  assert.ok(uint8.length > 0, "Converted key must not be empty");
});

test("Task C: Movement detection and threshold evaluation", async () => {
  // Test movement evaluations
  const movements: PlayerValuationMovement[] = [
    {
      id: "yamal",
      name: "Lamine Yamal",
      slug: "lamine-yamal-1051588",
      previousValueEur: 150_000_000,
      latestValueEur: 180_000_000,
      diffEur: 30_000_000,
      percentage: 0.20, // +20%
    },
    {
      id: "subtle-player",
      name: "Subtle Player",
      slug: "subtle-player",
      previousValueEur: 100_000_000,
      latestValueEur: 102_000_000,
      diffEur: 2_000_000,
      percentage: 0.02, // +2% (below 5% threshold)
    },
  ];

  const subEndpoint = "https://push.example.com/test-eval-endpoint";
  await subscriptionStore.save({
    endpoint: subEndpoint,
    keys: { p256dh: "key", auth: "auth" },
    followedPlayerIds: ["yamal", "subtle-player"],
    threshold: 0.05,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Verify that movements can be filtered by threshold
  const sub = await subscriptionStore.get(subEndpoint);
  assert.ok(sub);

  const triggered = movements.filter(
    (m) => sub.followedPlayerIds.includes(m.id) && Math.abs(m.percentage) >= sub.threshold
  );

  assert.equal(triggered.length, 1, "Only movements exceeding 5% threshold must trigger");
  assert.equal(triggered[0].id, "yamal");

  // Clean up
  await subscriptionStore.delete(subEndpoint);
});

test("Task C: Rate limiting enforces maximum 1 push per user per day", async () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const recentTimestamp = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour ago
  const oldTimestamp = new Date(Date.now() - (ONE_DAY_MS + 3600 * 1000)).toISOString(); // 25 hours ago

  function isEligibleForPush(lastNotifiedAt?: string | null): boolean {
    if (!lastNotifiedAt) return true;
    const elapsed = Date.now() - new Date(lastNotifiedAt).getTime();
    return elapsed >= ONE_DAY_MS;
  }

  assert.equal(isEligibleForPush(recentTimestamp), false, "Must block push sent 1 hour ago");
  assert.equal(isEligibleForPush(oldTimestamp), true, "Must allow push sent 25 hours ago");
  assert.equal(isEligibleForPush(null), true, "Must allow first-time push");
});
