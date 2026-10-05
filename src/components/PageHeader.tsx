import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * a1score PageHeader Component:
 * - Title: 20/600 (Inter), sentence case, never truncate (wraps up to 2 lines).
 * - Optional caption: 13/400 secondary text, one line, never ellipsis.
 * - Max header + title + controls = 120px on mobile.
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
        <h1
          className="text-[20px] font-semibold leading-snug line-clamp-2"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-[13px] font-normal leading-snug hidden min-[400px]:block mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
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
