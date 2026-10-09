"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared live-match counter for the navigation chrome (TopNav, BottomNav, LeftRail).
 *
 * One poller serves every subscriber, so mounting the count in three places
 * still costs a single request every 30s. Polling skips hidden tabs and
 * refreshes immediately when the tab becomes visible again; a request never
 * overlaps one already in flight. Returns null until the first response.
 */

const POLL_MS = 30_000;

let liveCount: number | null = null;
let inFlight = false;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

async function refresh() {
  if (inFlight || document.visibilityState === "hidden") return;
  inFlight = true;
  try {
    const res = await fetch("/api/matches?filter=live", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (typeof data.liveMatchesCount === "number" && data.liveMatchesCount !== liveCount) {
      liveCount = data.liveMatchesCount;
      listeners.forEach((notify) => notify());
    }
  } catch {
    // Keep the last known count on network errors
  } finally {
    inFlight = false;
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") void refresh();
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  if (listeners.size === 1) {
    void refresh();
    timer = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }
  return () => {
    listeners.delete(notify);
    if (listeners.size === 0) {
      if (timer) clearInterval(timer);
      timer = null;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}

export function useLiveMatchCount(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => liveCount,
    () => null
  );
}
