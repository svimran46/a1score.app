"use client";

import { useEffect } from "react";
import { initDeferredAnalytics } from "@/lib/analytics";
import { initWebVitalsReporting } from "@/lib/analytics/web-vitals";

export function AnalyticsProvider() {
  useEffect(() => {
    initDeferredAnalytics();
    initWebVitalsReporting();
  }, []);

  return null;
}
