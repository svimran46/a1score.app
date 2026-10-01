import Link from "next/link";

interface HomeSectionHeaderProps {
  title: string;
  href?: string;
  actionLabel?: string;
}

/**
 * Shared section header for Home page:
 * Title 17/600 left, link 15/500 gold right, 8px gap to content.
 * No icon, no subtitle, no badge.
 */
export function HomeSectionHeader({ title, href, actionLabel }: HomeSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2
        className="text-[17px] font-semibold text-[#F2F4F8] leading-tight"
        style={{ color: "var(--token-text, #F2F4F8)" }}
      >
        {title}
      </h2>
      {href && actionLabel && (
        <Link
          href={href}
          className="text-[15px] font-medium text-[#F5B73B] hover:underline transition-colors shrink-0"
          style={{ color: "var(--token-gold, #F5B73B)" }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
