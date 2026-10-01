import React from "react";

export interface StatStripItem {
  value: React.ReactNode | string | number;
  label: string;
}

interface StatStripProps {
  items: StatStripItem[];
  className?: string;
}

/**
 * a1score StatStrip Component:
 * - Up to 3 numbers in ONE card, side by side, separated by thin vertical dividers.
 * - Value 20/600 above a 13px secondary label.
 * - Not tiles, no nested cards.
 */
export function StatStrip({ items, className = "" }: StatStripProps) {
  const displayItems = items.slice(0, 3);
  if (displayItems.length === 0) return null;

  return (
    <div
      className={`rounded-[12px] flex items-center divide-x overflow-hidden ${className}`}
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        borderWidth: "1px",
      }}
    >
      {displayItems.map((item, idx) => (
        <div
          key={item.label || idx}
          className="flex-1 py-3 px-2 text-center flex flex-col items-center justify-center min-w-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div
            className="text-[20px] font-semibold tabular-nums leading-tight"
            style={{ color: "var(--color-text)" }}
          >
            {item.value}
          </div>
          <div
            className="text-[13px] font-normal leading-tight mt-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
