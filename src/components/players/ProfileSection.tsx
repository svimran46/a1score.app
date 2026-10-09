import React from "react";
import { ChevronRight } from "lucide-react";

export interface ProfileSectionProps {
  /** Anchor id: value, transfers, season, injuries, honours, profile, news. */
  id: string;
  /** Chip label read by ProfileSectionNav from data-nav-label. */
  navLabel: string;
  /** Visible h2 text; defaults to navLabel. */
  title?: React.ReactNode;
  /** Right-hand meta in the heading row (a key number or a link). */
  meta?: React.ReactNode;
  /** "card" puts the section on bg-card (Season); "page" sits on bg-page with a top hairline. */
  surface?: "page" | "card";
  /** Top hairline for page sections; off for the first section under the sticky bar. */
  divider?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const SURFACE = {
  card: "bg-bg-card rounded-[var(--card-radius)] p-4 @[560px]/profile:p-5",
  page: "",
} as const;

/** Shared focus ring for controls on bg-page; the offset matches the surface. */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)]";
/** The same ring for controls on bg-card. */
export const focusRingCard =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]";

/**
 * One profile section: <section id aria-labelledby data-nav-label> with a
 * single h2 that the section bar focuses after a jump. Renders nothing
 * without children, so an empty section never leaves a heading behind.
 */
export function ProfileSection({
  id,
  navLabel,
  title,
  meta,
  surface = "page",
  divider = true,
  className = "",
  children,
}: ProfileSectionProps) {
  if (React.Children.toArray(children).length === 0) return null;
  const headingId = `${id}-heading`;
  const rule = surface === "page" && divider ? "border-t border-divider/60 pt-5" : "";

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      data-nav-label={navLabel}
      className={`scroll-mt-[calc(var(--nav-height)+56px)] ${SURFACE[surface]} ${rule} ${className}`}
    >
      <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
        <h2
          id={headingId}
          tabIndex={-1}
          className="min-w-0 text-base font-bold leading-[22px] text-text-primary rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          {title ?? navLabel}
        </h2>
        {meta != null && meta !== false ? (
          <div className="min-w-0 shrink-0 text-right text-sm text-text-secondary">{meta}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Native <details> disclosure: zero JS, content is in the static HTML.
 * The chevron rotates by transform; height is never animated.
 */
export function ProfileDisclosure({
  id,
  summary,
  surface = "page",
  className = "",
  children,
}: {
  id?: string;
  summary: React.ReactNode;
  surface?: "page" | "card";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <details id={id} className={className}>
      <summary
        className={`flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-semibold text-text-secondary hover:text-text-primary [&::-webkit-details-marker]:hidden ${surface === "card" ? focusRingCard : focusRing}`}
      >
        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-[120ms] ease-[var(--ease-out)] [details[open]>summary>&]:rotate-90"
        />
        <span>{summary}</span>
      </summary>
      <div className="pt-1">{children}</div>
    </details>
  );
}

/** Visible "—" for a missing value, with words for screen readers. */
export function NotRecorded({ sr = "not recorded", mark = "—" }: { sr?: string; mark?: string }) {
  return (
    <>
      <span aria-hidden="true">{mark}</span>
      <span className="sr-only">{sr}</span>
    </>
  );
}
