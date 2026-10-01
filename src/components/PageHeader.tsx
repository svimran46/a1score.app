import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard compact mobile-first page title.
 * - Continuous page background (transparent, no shaded bands or boxed containers).
 * - Single line title: 22-24px, font-bold, never truncated.
 * - Subtitle: optional, 13px muted, single line, hidden on <400px.
 * - Optional actions slot.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`w-full flex items-center justify-between gap-3 py-1 sm:py-1.5 ${className}`}>
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-white leading-tight whitespace-nowrap">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-slate-400 truncate leading-snug hidden min-[400px]:block mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="shrink-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
