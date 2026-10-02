(process.env as any).NODE_ENV = "test";

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  sanitizeEventPayload,
  trackEvent,
  initDeferredAnalytics,
} from "../src/lib/analytics";
import { AD_FORMATS, ADS_ENABLED } from "../src/lib/ads/config";
import { AdSlot } from "../src/components/ads/AdSlot";
import { ConsentBanner } from "../src/components/privacy/ConsentBanner";

test("analytics: sanitizeEventPayload permits only approved aggregate events", () => {
  const allowed = ["follow", "share", "compare", "search used", "push opt-in"] as const;

  for (const eventName of allowed) {
    const res = sanitizeEventPayload(eventName, { category: "player", value: 1 });
    assert.ok(res, `Event ${eventName} should be permitted`);
    assert.equal(res?.event, eventName);
    assert.equal(res?.category, "player");
    assert.equal(res?.value, 1);
    assert.ok(res?.timestamp);
  }

  // Non-permitted events must be rejected
  assert.equal(sanitizeEventPayload("purchase"), null);
  assert.equal(sanitizeEventPayload("user_profile_click"), null);
  assert.equal(sanitizeEventPayload("login"), null);
});

test("analytics: sanitizeEventPayload strictly strips PII keys", () => {
  const metaWithPii = {
    category: "club",
    email: "user@example.com",
    name: "John Doe",
    ip: "192.168.1.1",
    userId: "uuid-12345",
    phone: "+123456789",
    value: 42,
  };

  const payload = sanitizeEventPayload("follow", metaWithPii);
  assert.ok(payload);
  assert.equal(payload?.event, "follow");
  assert.equal(payload?.category, "club");
  assert.equal(payload?.value, 42);

  const payloadRecord = payload as Record<string, any>;
  assert.equal(payloadRecord.email, undefined, "email must be stripped");
  assert.equal(payloadRecord.name, undefined, "name must be stripped");
  assert.equal(payloadRecord.ip, undefined, "ip must be stripped");
  assert.equal(payloadRecord.userId, undefined, "userId must be stripped");
  assert.equal(payloadRecord.phone, undefined, "phone must be stripped");
});

test("analytics: trackEvent rejects undefined window gracefully in SSR", () => {
  // In Node test environment, window is undefined
  const result = trackEvent("share");
  assert.equal(result, false, "trackEvent returns false when window is undefined");
});

test("analytics loader: initDeferredAnalytics defers loading until interaction or idle", () => {
  let listenersAdded = 0;
  const mockWindow: any = {
    addEventListener: (type: string) => {
      if (type === "scroll" || type === "pointerdown" || type === "keydown") {
        listenersAdded++;
      }
    },
    removeEventListener: () => {},
    requestIdleCallback: (cb: () => void) => {
      // Execute synchronously in test
      cb();
    },
  };

  // Mock global window
  (global as any).window = mockWindow;

  try {
    initDeferredAnalytics("test-token");
    // Verify that interaction listeners are registered to defer script execution
    assert.ok(listenersAdded >= 3, "Must attach scroll, pointerdown, and keydown listeners");
  } finally {
    delete (global as any).window;
  }
});

test("ad slots: feature flag off by default and renders no DOM markup", () => {
  assert.equal(ADS_ENABLED, false, "NEXT_PUBLIC_ADS_ENABLED must default to false");

  // When mock is false, AdSlot must return null (empty markup)
  const htmlOff = renderToStaticMarkup(React.createElement(AdSlot, { id: "test-slot-1", mock: false }));
  assert.equal(htmlOff, "", "AdSlot must render nothing when ads are disabled");
});

test("ad slots: mock mode renders reserved zero-CLS container with required label", () => {
  const htmlMock = renderToStaticMarkup(
    React.createElement(AdSlot, { id: "test-slot-rectangle", format: "rectangle", mock: true })
  );

  assert.ok(htmlMock.includes("Advertisement"), "Ad slot must display visible Advertisement label");
  assert.ok(htmlMock.includes("min-height:250px") || htmlMock.includes("min-h-[250px]"), "Must reserve fixed min-height to guarantee zero CLS");
  assert.ok(htmlMock.includes('data-ad-slot="test-slot-rectangle"'));

  const htmlLeaderboard = renderToStaticMarkup(
    React.createElement(AdSlot, { id: "test-slot-lb", format: "leaderboard", mock: true })
  );
  assert.ok(htmlLeaderboard.includes("min-height:90px") || htmlLeaderboard.includes("min-h-[90px]"), "Leaderboard must reserve 90px height");
});

test("ad formats: all formats specify fixed dimensions preventing layout shift", () => {
  assert.equal(AD_FORMATS.rectangle.minHeightPx, 250);
  assert.equal(AD_FORMATS.rectangle.width, 300);

  assert.equal(AD_FORMATS.leaderboard.minHeightPx, 90);
  assert.equal(AD_FORMATS.leaderboard.width, 728);

  assert.equal(AD_FORMATS.banner.minHeightPx, 100);
});

test("consent banner: renders as fixed overlay without displacing document flow (zero CLS)", () => {
  // On SSR render, banner initializes as hidden (returns null) to prevent SSR/hydration mismatch
  const ssrHtml = renderToStaticMarkup(React.createElement(ConsentBanner));
  assert.equal(ssrHtml, "", "ConsentBanner must render empty on SSR to prevent hydration shift");
});
