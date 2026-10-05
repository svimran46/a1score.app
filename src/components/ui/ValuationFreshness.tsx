import React from "react";
import { Clock } from "lucide-react";

export interface ValuationFreshnessProps {
  timestamp?: string | Date | null | undefined; // backward compatible / valueUpdatedAt
  valueUpdatedAt?: string | Date | null | undefined;
  checkedAt?: string | Date | null | undefined;
  thresholdDays?: number;
  className?: string;
  showIcon?: boolean;
}

/**
 * Calculates human-readable relative time and checks freshness against threshold.
 */
export function getFreshnessDetails(
  timestamp: string | Date | null | undefined,
  thresholdDays = 14
) {
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
      year: "numeric",
      month: "short",
      day: "numeric",
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
 * - "Value last changed: <date> • Checked: <relative time>"
 * - "Review pending" shown ONLY when checkedAt is older than thresholdDays (pipeline staleness),
 *   never because the value simply has not changed recently at source.
 */
export function ValuationFreshness({
  timestamp,
  valueUpdatedAt,
  checkedAt,
  thresholdDays = 14,
  className = "",
  showIcon = false,
}: ValuationFreshnessProps) {
  const actualValueUpdated = valueUpdatedAt || timestamp;
  const actualChecked = checkedAt || timestamp;

  const valueDetails = getFreshnessDetails(actualValueUpdated, 365);
  const checkedDetails = getFreshnessDetails(actualChecked, thresholdDays);

  if (!valueDetails && !checkedDetails) {
    return (
      <div
        title="Valuation verification pending"
        className={`inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-help select-none ${className}`}
      >
        {showIcon && <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />}
        <span className="text-[var(--value-text)] font-medium">Review pending</span>
      </div>
    );
  }

  // Dual display when checkedAt and valueUpdatedAt are provided
  if (valueUpdatedAt && checkedAt) {
    const isCheckedStale = checkedDetails ? checkedDetails.isOutOfDate : false;

    return (
      <div
        title={`Value source recorded on ${valueDetails?.fullDate || ""}. Pipeline checked on ${checkedDetails?.fullDate || ""}.`}
        className={`inline-flex items-center gap-1 text-xs text-[var(--text-muted)] cursor-help select-none flex-wrap ${className}`}
      >
        {showIcon && <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />}
        {valueDetails && (
          <span>Value last changed: {valueDetails.fullDate}</span>
        )}
        {valueDetails && checkedDetails && <span>•</span>}
        {checkedDetails && (
          <span>Checked: {checkedDetails.relativeStr}</span>
        )}
        {isCheckedStale && (
          <span className="opacity-90">
            • <span className="text-[var(--value-text)] font-semibold underline decoration-dotted underline-offset-2">Review pending</span>
          </span>
        )}
      </div>
    );
  }

  // Single timestamp fallback (shows relative time with review pending if out of date)
  const details = checkedDetails || valueDetails!;
  return (
    <div
      title={`Valuation recorded on ${details.fullDate}`}
      className={`inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-help select-none ${className}`}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />}
      <span>Values updated {details.relativeStr}</span>
      {details.isOutOfDate && (
        <span className="opacity-90">
          • <span className="text-[var(--value-text)] font-semibold underline decoration-dotted underline-offset-2">Review pending</span>
        </span>
      )}
    </div>
  );
}
