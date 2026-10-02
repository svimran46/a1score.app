"use client";

import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * FotMob-style ErrorState component:
 * Short, plain copy ("Couldn't load this right now. Try again."), bg-card, no borders.
 */
export function ErrorState({
  title = "Couldn't load this right now.",
  message = "Please check your network connection and try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] flex flex-col items-center justify-center text-center py-10 sm:py-14 space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--bg-chip)] flex items-center justify-center text-[var(--trend-down)]">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-[var(--text-primary)]">
          {title}
        </h3>
        {message && (
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            {message}
          </p>
        )}
      </div>
      {onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-[40px] px-4 py-2 rounded-[var(--chip-radius)] bg-[var(--accent)] text-[var(--accent-contrast)] text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      )}
    </div>
  );
}
