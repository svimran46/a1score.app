"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Play, Pause } from "lucide-react";

interface LiveAutoRefresherProps {
  intervalMs?: number; // default 45000 (45s sync)
  showControls?: boolean;
  defaultEnabled?: boolean;
  label?: string;
}

export function LiveAutoRefresher({
  intervalMs = 45000,
  showControls = true,
  defaultEnabled = true,
  label = "Live Sync",
}: LiveAutoRefresherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [currentInterval, setCurrentInterval] = useState(intervalMs);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.round(intervalMs / 1000));
  const inFlightRef = useRef(false);

  const triggerRefresh = useCallback(() => {
    // Overlap guard: never stack refreshes if previous one is in flight
    if (inFlightRef.current || isPending) {
      return;
    }

    inFlightRef.current = true;
    startTransition(() => {
      try {
        router.refresh();
        // On success, reset interval back to base
        setCurrentInterval(intervalMs);
        setSecondsRemaining(Math.round(intervalMs / 1000));
      } catch (err) {
        // Exponential backoff up to 60s
        setCurrentInterval((prev) => Math.min(prev * 2, 60000));
        setSecondsRemaining(Math.round(Math.min(currentInterval * 2, 60000) / 1000));
      } finally {
        inFlightRef.current = false;
      }
    });
  }, [router, intervalMs, isPending, currentInterval]);

  useEffect(() => {
    if (!enabled) return;

    // Countdown tick every second
    const secondTimer = setInterval(() => {
      // Pause countdown if user switched tabs (quota & battery guard)
      if (typeof document !== "undefined" && document.hidden) return;

      // Skip tick if previous request is still in flight
      if (inFlightRef.current) return;

      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          triggerRefresh();
          return Math.round(currentInterval / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    // Instantly refresh when user returns to this tab
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden && enabled) {
        triggerRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(secondTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, currentInterval, triggerRefresh]);

  if (!showControls) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-card/90 border border-divider text-xs shadow-sm backdrop-blur-md select-none">
      <span className="relative flex h-2 w-2">
        {enabled && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-trend-down opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            enabled ? "bg-trend-down" : "bg-divider"
          }`}
        />
      </span>

      <span className="text-text-muted font-medium whitespace-nowrap">
        {enabled ? (
          <>
            Next update in <span className="text-trend-down font-bold tabular-nums">{secondsRemaining}s</span>
          </>
        ) : (
          <span className="text-text-muted">Updates paused</span>
        )}
      </span>

      <button
        type="button"
        onClick={() => triggerRefresh()}
        disabled={isPending || inFlightRef.current}
        title="Refresh now"
        className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-chip transition-colors"
      >
        <RefreshCw className={`w-3 h-3 ${isPending ? "animate-spin text-trend-down" : ""}`} />
      </button>

      <button
        type="button"
        onClick={() => setEnabled((prev) => !prev)}
        title={enabled ? "Pause auto-sync" : "Resume auto-sync"}
        className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-chip transition-colors"
      >
        {enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-trend-down" />}
      </button>
    </div>
  );
}

