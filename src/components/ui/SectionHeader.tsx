import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface SectionHeaderProps {
  title: string;
  href?: string;
  actionLabel?: string;
  action?: React.ReactNode;
  className?: string;
  count?: number;
}

/**
 * FotMob-style Section Header component:
 * Title (text-lg, 700) on the left, optional "See all" link or custom action on the right.
 */
export function SectionHeader({
  title,
  href,
  actionLabel = "See all",
  action,
  className = "",
  count,
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-3 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight truncate">
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-[var(--chip-radius)] bg-[var(--bg-chip)] text-[var(--text-muted)] tabular-nums shrink-0">
            {count}
          </span>
        )}
      </div>

      {action ? (
        <div className="shrink-0">{action}</div>
      ) : href ? (
        <Link
          href={href}
          className="text-sm font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded px-1 -mx-1 shrink-0 transition-colors"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
