import React from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

const ROW_CLASS =
  "w-full flex items-center gap-4 min-h-[64px] px-4 py-3 text-left transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]";

export interface MenuRowProps {
  icon: LucideIcon;
  label: string;
  description?: React.ReactNode;
  /** Internal route, external URL or mailto:. Omit and pass onClick for actions. */
  href?: string;
  onClick?: () => void;
  /** Right-hand slot; defaults to a chevron for links. */
  trailing?: React.ReactNode;
  external?: boolean;
  ariaExpanded?: boolean;
}

function RowBody({ icon: Icon, label, description, trailing }: Pick<MenuRowProps, "icon" | "label" | "description" | "trailing">) {
  return (
    <>
      <Icon aria-hidden="true" className="w-[22px] h-[22px] shrink-0 text-[var(--text-primary)]" strokeWidth={1.9} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-[var(--text-primary)] leading-snug">{label}</span>
        {description && (
          <span className="block text-[13px] text-[var(--text-muted)] leading-snug mt-0.5">{description}</span>
        )}
      </span>
      {trailing}
    </>
  );
}

/** One tappable row in a More/Settings menu group, FotMob style. */
export function MenuRow({ href, onClick, external, trailing, ariaExpanded, ...body }: MenuRowProps) {
  if (href) {
    const chevron = trailing ?? (
      <ChevronRight aria-hidden="true" className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
    );
    if (external || /^(https?:|mailto:)/.test(href)) {
      return (
        <a href={href} className={ROW_CLASS} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          <RowBody {...body} trailing={chevron} />
        </a>
      );
    }
    return (
      <Link href={href} className={ROW_CLASS}>
        <RowBody {...body} trailing={chevron} />
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={ROW_CLASS} aria-expanded={ariaExpanded}>
        <RowBody {...body} trailing={trailing} />
      </button>
    );
  }
  return (
    <div className={ROW_CLASS.replace("hover:bg-[var(--bg-hover)]", "")}>
      <RowBody {...body} trailing={trailing} />
    </div>
  );
}

/** A rounded card that stacks MenuRows with hairline dividers. */
export function MenuGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="space-y-2">
      {title && (
        <h2 className="px-1 text-base font-bold text-[var(--text-primary)]">{title}</h2>
      )}
      <div className="bg-[var(--bg-card)] rounded-[var(--card-radius)] overflow-hidden divide-y divide-[var(--divider)]">
        {children}
      </div>
    </section>
  );
}
