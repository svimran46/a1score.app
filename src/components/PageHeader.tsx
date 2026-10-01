import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard compact mobile-first page header.
 * - One line title (clamp 22-28px, font-bold/font-black, truncate).
 * - Optional one-line subtitle (max 1 line, truncate).
 * - No icon, no paragraph.
 * - Total height <= 72px.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`h-[64px] sm:h-[72px] max-h-[72px] flex items-center justify-between gap-3 px-4 w-full border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-xs ${className}`}
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <h1 className="text-[22px] sm:text-[26px] md:text-[28px] font-black tracking-tight text-white leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-400 truncate leading-snug max-w-full">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="shrink-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
