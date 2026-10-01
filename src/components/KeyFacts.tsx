import React from "react";

export interface KeyFactItem {
  label: string;
  value: React.ReactNode | string | number | null | undefined;
}

interface KeyFactsProps {
  items: KeyFactItem[];
  className?: string;
}

/**
 * a1score KeyFacts Component:
 * - A definition list inside a single card container.
 * - Each row 48px: label left (13/400 secondary), value right (15/500 text).
 * - No tiles, no icons on labels.
 * - Missing data: HIDE the field. If more than half is missing, hide the whole block.
 * - Never show "N/A", "Unknown", "No data yet", "pending", "-", or "TBD".
 */
export function KeyFacts({ items, className = "" }: KeyFactsProps) {
  // Filter out items with missing/empty/placeholder values
  const validItems = items.filter((item) => {
    if (item.value === null || item.value === undefined) return false;
    if (typeof item.value === "string") {
      const trimmed = item.value.trim().toLowerCase();
      if (!trimmed) return false;
      if (
        trimmed === "n/a" ||
        trimmed === "unknown" ||
        trimmed === "no data yet" ||
        trimmed === "pending" ||
        trimmed === "-" ||
        trimmed === "--" ||
        trimmed === "tbd"
      ) {
        return false;
      }
    }
    return true;
  });

  // If more than half of items are missing, or no valid items, hide the whole block
  if (validItems.length === 0 || validItems.length < items.length / 2) {
    return null;
  }

  return (
    <dl
      className={`rounded-[12px] divide-y overflow-hidden ${className}`}
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        borderWidth: "1px",
      }}
    >
      {validItems.map((item, idx) => (
        <div
          key={item.label || idx}
          className="h-12 min-h-[48px] px-4 flex items-center justify-between gap-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <dt
            className="text-[13px] font-normal shrink-0"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {item.label}
          </dt>
          <dd
            className="text-[15px] font-medium text-right min-w-0"
            style={{ color: "var(--color-text)" }}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
