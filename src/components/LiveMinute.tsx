"use client";

import { useEffect, useState, useRef } from "react";
import { evaluateLiveMatchFreshness } from "@/lib/date-utils";

export interface LiveMinuteProps {
  shortTime?: string | null;
  longTime?: string | null;
  isLive?: boolean;
  isHT?: boolean;
  isFinished?: boolean;
  showPulsingDot?: boolean;
  lastUpdatedMs?: number | null;
  reason?: string | null;
  className?: string;
}

export function LiveMinute({
  shortTime,
  longTime,
  isLive = true,
  isHT = false,
  isFinished = false,
  showPulsingDot = true,
  lastUpdatedMs = null,
  reason = null,
  className = "",
}: LiveMinuteProps) {
  // Parse initial seconds from "MM:SS" (e.g. "47:07" -> 2827 seconds)
  const parseSeconds = (longStr?: string | null): number => {
    if (!longStr || !longStr.includes(":")) return 0;
    const [mStr, sStr] = longStr.split(":");
    const mins = parseInt(mStr, 10) || 0;
    const secs = parseInt(sStr, 10) || 0;
    return mins * 60 + secs;
  };

  const initialSecs = parseSeconds(longTime);
  const [seconds, setSeconds] = useState<number>(initialSecs);
  const [cleanShort, setCleanShort] = useState<string>(() => {
    if (shortTime) return shortTime.replace(/[^\d+’']/g, "");
    return "";
  });

  // Re-sync with server updates from polling
  useEffect(() => {
    if (longTime) {
      setSeconds(parseSeconds(longTime));
    }
    if (shortTime) {
      setCleanShort(shortTime.replace(/[^\d+’']/g, ""));
    }
  }, [longTime, shortTime]);

  // Tick locally every second between polls (unless HT, FT, or hidden)
  useEffect(() => {
    if (!isLive || isHT || isFinished) return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, isHT, isFinished]);

  // Determine formatted minute string
  const getFormattedMinute = (): string => {
    if (isFinished) return "FT";
    if (isHT) return "HT";

    if (seconds > 0) {
      const currentMin = Math.floor(seconds / 60) + 1;
      // Stoppage time handling
      if (currentMin > 90) {
        return `Live 90+${currentMin - 90}'`;
      }
      if (currentMin > 45 && seconds < 3600) {
        return `Live 45+${currentMin - 45}'`;
      }
      return `Live ${currentMin}'`;
    }

    if (cleanShort) {
      const min = cleanShort.endsWith("'") ? cleanShort : `${cleanShort}'`;
      if (min.toUpperCase() === "HT" || min.toLowerCase() === "half time") return "HT";
      if (min.toUpperCase() === "FT" || min.toLowerCase() === "full time") return "FT";
      return `Live ${min}`;
    }

    return "Live";
  };

  // Check freshness and stoppage sanity
  const freshness = evaluateLiveMatchFreshness({
    isLive,
    liveMinuteStr: cleanShort || shortTime,
    liveTimeLong: longTime,
    lastUpdatedMs,
    reason,
  });

  const displayText = freshness.isUnconfirmed ? "Status unconfirmed" : getFormattedMinute();

  if (freshness.isUnconfirmed) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold text-amber-400/90 text-xs tracking-tight ${className}`}
        title="Live event feed delayed or minute unconfirmed"
      >
        <span>Status unconfirmed</span>
      </span>
    );
  }

  if (isFinished) {
    return <span className={`text-slate-400 font-semibold ${className}`}>FT</span>;
  }

  if (isHT) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold text-amber-400 ${className}`}>
        {showPulsingDot && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        )}
        <span>HT</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold text-emerald-400 tabular-nums ${className}`}
    >
      {showPulsingDot && isLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      <span>{displayText}</span>
    </span>
  );
}
