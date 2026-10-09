import React from "react";
import { spokenEur, valueEurParts } from "@/lib/format-value";

export interface ValueFigureProps {
  eur: number | null;
  size: "hero" | "lg" | "md" | "sm";
  className?: string;
  /** Screen-reader prefix read before the amount, e.g. "Market value". Hero defaults to "Market value". */
  srLabel?: string;
}

const SIZE_CLASS: Record<ValueFigureProps["size"], string> = {
  hero: "text-[48px] leading-[48px] @[560px]/profile:text-[64px] @[560px]/profile:leading-[60px]",
  lg: "text-[18px] leading-6",
  md: "text-base leading-5",
  sm: "text-sm leading-5",
};

/**
 * A euro market value in the money voice: .figure, amber, never animated.
 * The visual string is aria-hidden and an expanded amount is read instead
 * ("180 million euros"), so "€180M" is never spelled out letter by letter.
 */
export function ValueFigure({ eur, size, className = "", srLabel }: ValueFigureProps) {
  const parts = valueEurParts(eur);
  const Tag = size === "hero" ? "p" : "span";
  const prefix = srLabel ?? (size === "hero" ? "Market value" : null);

  if (!parts || eur == null) {
    return (
      <Tag data-value-figure="missing" className={`${SIZE_CLASS[size]} font-bold text-text-muted ${className}`}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Market value unavailable</span>
      </Tag>
    );
  }

  // Only the hero splits out the currency and magnitude so the digits carry the weight.
  const unit = size === "hero" ? "text-[0.62em] font-bold" : "";

  return (
    <Tag
      data-value-figure=""
      className={`figure whitespace-nowrap font-extrabold text-value-text ${SIZE_CLASS[size]} ${className}`}
    >
      {prefix && <span className="sr-only">{`${prefix} `}</span>}
      <span aria-hidden="true">
        <span className={unit}>{parts.currency}</span>
        {parts.number}
        {parts.suffix && <span className={unit}>{parts.suffix}</span>}
      </span>
      <span className="sr-only">{spokenEur(eur)}</span>
    </Tag>
  );
}
