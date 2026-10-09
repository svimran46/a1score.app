import React from "react";
import Link from "next/link";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  href?: string;
  icon?: React.ReactNode;
}

/**
 * FotMob-style Chip component (filters and tabs):
 * - Height 40px (44px tap target on touch), pill, bg-chip, text-sm, weight 600
 * - Active: accent background with accent-contrast text
 * - Hover: bg-hover
 * - Focus: 2px --focus-ring, 2px offset
 * - Transition: background/opacity only, --dur-fast
 */
export function Chip({
  active = false,
  href,
  icon,
  className = "",
  children,
  ...props
}: ChipProps) {
  const baseClasses = `inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[40px] h-10 px-4 rounded-[var(--chip-radius)] text-sm font-semibold whitespace-nowrap cursor-pointer select-none transition-[background-color,opacity] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)] ${
    active
      ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
      : "bg-[var(--bg-chip)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button type="button" className={baseClasses} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
