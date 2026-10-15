"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

function viewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * The viewer's timezone. UTC during server render and hydration (so the HTML
 * matches), then the real zone before the browser paints.
 */
export function useViewerTimeZone(): string {
  return useSyncExternalStore(noop, viewerTimeZone, () => "UTC");
}
