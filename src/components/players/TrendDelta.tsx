import React from "react";
import { describeDelta } from "@/lib/format-value";
import type { ValueDelta } from "@/lib/data/playerProfile.types";

export interface TrendDeltaProps {
  delta: ValueDelta;
  size?: "hero" | "md" | "compact";
  /** Defaults to "since" for the hero and "none" for md / compact. */
  basis?: "since" | "none";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<TrendDeltaProps["size"]>, string> = {
  hero: "text-sm leading-[18px]",
  md: "text-sm leading-5",
  compact: "text-xs leading-4",
};

/**
 * A value change with arrow, sign, percentage and basis, so direction never
 * relies on colour. All strings come from describeDelta; the visual line is
 * aria-hidden and a full sentence is read instead.
 *
 *   hero     ▲ +€20M (+12.5%) since Jun 2025
 *   md       ▲ +€20M +12.5%
 *   compact  ▲ +12.5%
 */
export function TrendDelta({ delta, size = "md", basis, className = "" }: TrendDeltaProps) {
  const d = describeDelta(delta);
  const showBasis = (basis ?? (size === "hero" ? "since" : "none")) === "since";
  const sizeClass = SIZE_CLASS[size];

  if (d.direction === "flat") {
    return (
      <span className={`${sizeClass} text-text-secondary ${className}`}>
        <span aria-hidden="true" data-delta-text="">{showBasis ? `Unchanged since ${d.basisMonth}` : "Unchanged"}</span>
        <span className="sr-only">{d.spoken}</span>
      </span>
    );
  }

  const main =
    size === "hero"
      ? `${d.amount}${d.pct ? ` (${d.pct})` : ""}`
      : size === "md"
        ? `${d.amount}${d.pct ? ` ${d.pct}` : ""}`
        : (d.pct ?? d.amount);

  return (
    <span className={`${sizeClass} ${className}`}>
      <span aria-hidden="true" data-delta-text="">
        <span className={`figure font-bold ${d.direction === "up" ? "text-trend-up" : "text-trend-down"}`}>
          {`${d.arrow} ${main}`}
        </span>
        {showBasis && <span className="font-normal text-text-muted">{` since ${d.basisMonth}`}</span>}
      </span>
      <span className="sr-only">{d.spoken}</span>
    </span>
  );
}
