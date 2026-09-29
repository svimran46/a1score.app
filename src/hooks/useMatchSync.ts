"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useMatchSync(matchId: string | number, initialData: any) {
  const [data, setData] = useState(initialData);
  const [isSyncing, setIsSyncing] = useState(false);
  const [goalHighlight, setGoalHighlight] = useState(false);
  const prevScoreRef = useRef<string>(initialData?.status?.scoreStr || "");
  const prevGoalCountRef = useRef<number>(initialData?.scorers?.totalCount || 0);

  const fetchLatest = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;

    try {
      setIsSyncing(true);
      const res = await fetch(`/api/matches/${matchId}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
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
        }
      }
    } catch {
      // Graceful fallback on network glitch
    } finally {
      setIsSyncing(false);
    }
  }, [matchId]);

  useEffect(() => {
    const isLive = data?.status?.isLive;
    if (!isLive) return;

    // 2-second polling interval for live match sync
    const interval = setInterval(fetchLatest, 2000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchLatest();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchLatest, data?.status?.isLive]);

  return {
    data,
    isSyncing,
    goalHighlight,
    refreshNow: fetchLatest,
  };
}
