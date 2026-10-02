import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * FotMob-style EmptyState component:
 * Short, plain copy ("No results yet."), bg-card, no borders.
 */
export function EmptyState({
  title = "No results yet.",
  message,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] flex flex-col items-center justify-center text-center py-10 sm:py-14 space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--bg-chip)] flex items-center justify-center text-[var(--text-muted)]">
        {icon || <Inbox className="w-6 h-6" />}
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
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
