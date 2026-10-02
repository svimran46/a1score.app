import React from "react";
import { Clock } from "lucide-react";

export interface ValuationFreshnessProps {
  timestamp: string | Date | null | undefined;
  thresholdDays?: number;
  className?: string;
  showIcon?: boolean;
}

/**
 * Calculates human-readable relative time and checks freshness against threshold.
 */
function getFreshnessDetails(timestamp: string | Date | null | undefined, thresholdDays = 14) {
  if (!timestamp) return null;

  try {
    const d = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    if (!d || isNaN(d.getTime())) return null;

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const isOutOfDate = diffDays > thresholdDays;

    let relativeStr = "";
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      relativeStr = diffHours < 1 ? "just now" : `${diffHours} hr. ago`;
    } else if (diffDays === 1) {
      relativeStr = "1 day ago";
    } else if (diffDays < 7) {
      relativeStr = `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      relativeStr = `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30.44);
      relativeStr = `${months} ${months === 1 ? "month" : "months"} ago`;
    } else {
      const years = Math.floor(diffDays / 365.25);
      relativeStr = `${years} ${years === 1 ? "year" : "years"} ago`;
    }

    const fullDate = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);

    return {
      relativeStr,
      fullDate,
      isOutOfDate,
    };
  } catch {
    return null;
  }
}

/**
 * Standardized data freshness indicator for valuation data:
 * - "Values updated 3 days ago"
 * - If older than threshold (default 14 days), subtle "May be out of date" note
 * - Full date on hover/title
 * - Consistent text-xs, var(--text-muted) style
 */
export function ValuationFreshness({
  timestamp,
  thresholdDays = 14,
  className = "",
  showIcon = false,
}: ValuationFreshnessProps) {
  const details = getFreshnessDetails(timestamp, thresholdDays);
  if (!details) return null;

  return (
    <div
      title={`Valuation recorded on ${details.fullDate}`}
      className={`inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-help select-none ${className}`}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />}
      <span>Values updated {details.relativeStr}</span>
      {details.isOutOfDate && (
        <span className="opacity-80">
          • <span className="underline decoration-dotted underline-offset-2">May be out of date</span>
        </span>
      )}
    </div>
  );
}
