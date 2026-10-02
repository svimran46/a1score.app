/**
 * src/lib/analytics/web-vitals.ts
 *
 * Real User Monitoring (RUM) for Core Web Vitals (LCP, INP, CLS).
 * Collects field metrics in aggregate without user identifiers or cross-site tracking.
 */

import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from "web-vitals";

export interface WebVitalPayload {
  name: "LCP" | "INP" | "CLS" | "FCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  navigationType?: string;
  path?: string;
}

export function sendVitalMetric(metric: Metric): void {
  if (typeof window === "undefined") return;

  const payload: WebVitalPayload = {
    name: metric.name as any,
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    rating: metric.rating,
    delta: Math.round(metric.name === "CLS" ? metric.delta * 1000 : metric.delta),
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
  };

  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon("/api/analytics/vitals", body);
    return;
  }

  fetch("/api/analytics/vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Attaches Core Web Vitals observers.
 * Runs non-blockingly after initial paint.
 */
export function initWebVitalsReporting(): void {
  if (typeof window === "undefined") return;

  try {
    onLCP(sendVitalMetric);
    onINP(sendVitalMetric);
    onCLS(sendVitalMetric);
    onFCP(sendVitalMetric);
    onTTFB(sendVitalMetric);
  } catch (err) {
    console.warn("[Web Vitals] Failed to initialize listeners:", err);
  }
}
