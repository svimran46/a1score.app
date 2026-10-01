import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  href?: string;
  actionLabel?: string;
  className?: string;
}

/**
 * a1score SectionHeader Component:
 * - Section template: section title (left, 16/600 text) + optional link (right, 15/500 gold) -> content.
 * - Gap to content: 8px.
 * - No subtitle, no icon, no badge.
 */
export function SectionHeader({
  title,
  href,
  actionLabel,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <h2
        className="text-[16px] font-semibold leading-tight"
        style={{ color: "var(--color-text)" }}
      >
        {title}
      </h2>
      {href && actionLabel && (
        <Link
          href={href}
          className="text-[15px] font-medium hover:underline transition-colors shrink-0"
          style={{ color: "var(--color-accent)" }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
