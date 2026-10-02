"use client";

import { useState, useEffect, useRef, useCallback } from "react";

function formatTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function useMatchSync(matchId: string | number, initialData: any) {
  const [data, setData] = useState(initialData);
  const [isSyncing, setIsSyncing] = useState(false);
  const [goalHighlight, setGoalHighlight] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const prevScoreRef = useRef<string>(initialData?.status?.scoreStr || "");
  const prevGoalCountRef = useRef<number>(initialData?.scorers?.totalCount || 0);

  const fetchLatest = useCallback(async () => {
    // Visibility guard: never fetch if document is hidden in background
    if (typeof document !== "undefined" && document.hidden) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s bounded timeout

    try {
      setIsSyncing(true);
      const res = await fetch(`/api/matches/${matchId}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const fresh = json.data;

          // Detect new goal event or score change for celebration animation
          const newScore = fresh.status?.scoreStr || "";
          const newGoalCount = fresh.scorers?.totalCount || 0;

          if (
            (prevScoreRef.current && prevScoreRef.current !== newScore) ||
            newGoalCount > prevGoalCountRef.current
          ) {
            setGoalHighlight(true);
            setTimeout(() => setGoalHighlight(false), 4000);
          }

          prevScoreRef.current = newScore;
          prevGoalCountRef.current = newGoalCount;
          setData(fresh);
          setLastUpdated(formatTimeString(new Date()));
        }
      }
    } catch {
      // Graceful fallback on network glitch or abort - keep stale data
    } finally {
      clearTimeout(timeoutId);
      setIsSyncing(false);
    }
  }, [matchId]);

  useEffect(() => {
    const isLive = data?.status?.isLive;
    if (!isLive) return;

    // 45-second visibility-aware interval for in-progress matches (30-60s range)
    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (!intervalId && typeof document !== "undefined" && !document.hidden) {
        intervalId = setInterval(fetchLatest, 45000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    startPolling();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Tab brought to foreground: immediate refresh and restart interval
        fetchLatest();
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchLatest, data?.status?.isLive]);

  return {
    data,
    isSyncing,
    goalHighlight,
    lastUpdatedTime: lastUpdated ? `Updated ${lastUpdated}` : null,
    refreshNow: fetchLatest,
  };
}

