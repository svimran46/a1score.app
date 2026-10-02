/**
 * src/lib/analytics/index.ts
 *
 * Privacy-friendly, zero-PII analytics and field performance monitoring for a1score.
 * - Cookie-free, no cross-site tracking, no fingerprinting.
 * - Defers loading until after user interaction or idle to guarantee zero impact on LCP.
 * - Restricted custom aggregate events: follow, share, compare, search used, push opt-in.
 */

export type PermittedAnalyticsEvent =
  | "follow"
  | "share"
  | "compare"
  | "search used"
  | "push opt-in";

export interface AnalyticsEventPayload {
  event: PermittedAnalyticsEvent;
  category?: string;
  value?: number;
  timestamp?: string;
}

const PERMITTED_EVENTS: ReadonlySet<string> = new Set([
  "follow",
  "share",
  "compare",
  "search used",
  "push opt-in",
]);

// Strip any potentially identifying attributes to guarantee zero PII
const PII_KEY_REGEX = /^(name|email|ip|user|userId|id|uuid|address|phone|token|sub|geo)$/i;

export function sanitizeEventPayload(
  eventName: string,
  meta?: Record<string, string | number | boolean>
): AnalyticsEventPayload | null {
  if (!PERMITTED_EVENTS.has(eventName)) {
    console.warn(`[Analytics] Ignored non-permitted event: "${eventName}"`);
    return null;
  }

  const payload: AnalyticsEventPayload = {
    event: eventName as PermittedAnalyticsEvent,
    timestamp: new Date().toISOString(),
  };

  if (meta && typeof meta === "object") {
    for (const [key, val] of Object.entries(meta)) {
      if (PII_KEY_REGEX.test(key)) {
        continue; // Discard prohibited PII fields
      }
      if (key === "category" && typeof val === "string") {
        payload.category = val.slice(0, 50);
      } else if (key === "value" && typeof val === "number" && !isNaN(val)) {
        payload.value = val;
      }
    }
  }

  return payload;
}

/**
 * Dispatch aggregate custom event without PII or tracking cookies.
 */
export function trackEvent(
  eventName: PermittedAnalyticsEvent,
  meta?: Record<string, string | number | boolean>
): boolean {
  if (typeof window === "undefined") return false;

  const payload = sanitizeEventPayload(eventName, meta);
  if (!payload) return false;

  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const success = navigator.sendBeacon("/api/analytics/event", body);
    if (success) return true;
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Fail silently without disrupting UX
  });

  return true;
}

let analyticsLoaded = false;

/**
 * Defers loading of analytics script until after first user interaction or idle callback.
 * Ensures zero blocking time and zero degradation of Largest Contentful Paint (LCP).
 */
export function initDeferredAnalytics(cfToken?: string): void {
  if (typeof window === "undefined" || analyticsLoaded) return;

  const loadScript = () => {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    if (typeof window !== "undefined") {
      window.removeEventListener("scroll", onInteraction);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);

      const token = cfToken || process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
      if (token && typeof document !== "undefined" && document.head) {
        const script = document.createElement("script");
        script.defer = true;
        script.src = "https://static.cloudflareinsights.com/beacon.min.js";
        script.setAttribute("data-cf-beacon", JSON.stringify({ token }));
        document.head.appendChild(script);
      }
    }
  };

  const passiveOpts = { passive: true, once: true };

  const onInteraction = () => {
    loadScript();
  };

  window.addEventListener("scroll", onInteraction, passiveOpts);
  window.addEventListener("pointerdown", onInteraction, passiveOpts);
  window.addEventListener("keydown", onInteraction, passiveOpts);

  // Fallback: load during idle period if no interaction occurs after 3 seconds
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(loadScript, { timeout: 4000 });
  } else {
    setTimeout(loadScript, 3500);
  }
}
