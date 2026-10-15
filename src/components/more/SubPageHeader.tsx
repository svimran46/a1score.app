import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** "← Title" header for pages reached from the More hub (Settings, Notifications…). */
export function SubPageHeader({
  title,
  backHref,
  backLabel,
  actions,
}: {
  title: string;
  backHref: string;
  backLabel: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={backHref}
        aria-label={backLabel}
        className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        <ArrowLeft aria-hidden="true" className="w-5 h-5" />
      </Link>
      <h1 className="flex-1 min-w-0 truncate text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{title}</h1>
      {actions}
    </div>
  );
}
