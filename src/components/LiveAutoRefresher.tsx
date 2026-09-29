"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Play, Pause } from "lucide-react";

interface LiveAutoRefresherProps {
  intervalMs?: number; // default 5000 (5s)
  showControls?: boolean;
  defaultEnabled?: boolean;
  label?: string;
}

export function LiveAutoRefresher({
  intervalMs = 5000,
  showControls = true,
  defaultEnabled = true,
  label = "Live Sync",
}: LiveAutoRefresherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.round(intervalMs / 1000));

  const triggerRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
      setSecondsRemaining(Math.round(intervalMs / 1000));
    });
  }, [router, intervalMs]);

  useEffect(() => {
    if (!enabled) return;

    // Countdown tick every second
    const secondTimer = setInterval(() => {
      // Pause countdown if user switched tabs
      if (typeof document !== "undefined" && document.hidden) return;

      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          triggerRefresh();
          return Math.round(intervalMs / 1000);
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
  }, [enabled, intervalMs, triggerRefresh]);

  if (!showControls) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-sm backdrop-blur-md select-none">
      <span className="relative flex h-2 w-2">
        {enabled && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            enabled ? "bg-emerald-500" : "bg-slate-600"
          }`}
        />
      </span>

      <span className="text-slate-400 font-medium whitespace-nowrap">
        {enabled ? (
          <>
            {label}: <span className="text-emerald-400 font-bold">{secondsRemaining}s</span>
          </>
        ) : (
          <span className="text-slate-500">Live Sync Paused</span>
        )}
      </span>

      <button
        type="button"
        onClick={() => triggerRefresh()}
        disabled={isPending}
        title="Refresh now"
        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <RefreshCw className={`w-3 h-3 ${isPending ? "animate-spin text-emerald-400" : ""}`} />
      </button>

      <button
        type="button"
        onClick={() => setEnabled((prev) => !prev)}
        title={enabled ? "Pause auto-sync" : "Resume auto-sync"}
        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        {enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-400" />}
      </button>
    </div>
  );
}
