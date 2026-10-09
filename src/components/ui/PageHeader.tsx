"use client";

import React from "react";
import { EntityImage } from "@/components/EntityImage";
import { Card } from "./Card";
import { ValuationFreshness } from "./ValuationFreshness";
import { ShareButton } from "./ShareButton";
import { Trophy } from "lucide-react";

export interface PageHeaderProps {
  variant?: "player" | "club" | "league" | "directory";

  // Visual Anchor / Image
  imageUrl?: string | null;
  imageAlt?: string;
  entityType?: "player" | "club" | "league";
  imageShape?: "circle" | "rounded";
  fallbackIcon?: React.ReactNode;

  // Typography & Labels
  categoryLabel?: string;
  title: string;
  subtitle?: React.ReactNode;

  // Primary Valuation & Trends
  value?: string | null;
  valueLabel?: string;
  valueTrend?: React.ReactNode;
  freshnessTimestamp?: string | Date | null;
  valueUpdatedAt?: string | Date | null;
  checkedAt?: string | Date | null;

  // Metadata items line (e.g. Club • League • Position • Age)
  metaItems?: React.ReactNode[];

  // Extra content block (e.g. Club Honours badges)
  extraContent?: React.ReactNode;

  // Action Bar
  actions?: React.ReactNode;
  shareTitle?: string;
  shareUrl?: string;
  showShare?: boolean;

  className?: string;
}

export function PageHeader({
  variant = "directory",
  imageUrl,
  imageAlt,
  entityType = "player",
  imageShape,
  fallbackIcon,
  categoryLabel,
  title,
  subtitle,
  value,
  valueLabel,
  valueTrend,
  freshnessTimestamp,
  valueUpdatedAt,
  checkedAt,
  metaItems,
  extraContent,
  actions,
  shareTitle,
  shareUrl,
  showShare = true,
  className = "",
}: PageHeaderProps) {
  // Directory layout
  if (variant === "directory") {
    return (
      <div className={`w-full py-1 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {categoryLabel && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                {categoryLabel}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    );
  }

  // Determine shape: players default to circle, clubs and leagues default to rounded
  const shape = imageShape || (variant === "player" ? "circle" : "rounded");
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-2xl";

  const resolvedImageAlt = imageAlt || title;

  return (
    <Card className={`p-3.5 sm:p-5 max-w-full overflow-hidden ${className}`}>
      <div className="flex flex-col gap-3">
        {/* Top Section: Visual Anchor (max 56px on mobile) + Title & Valuation */}
        <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Visual Anchor: Strict 56px mobile (w-14 h-14) / 64px desktop (sm:w-16 sm:h-16) for Zero CLS */}
            <div
              className={`relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 overflow-hidden bg-[var(--bg-chip)] border border-[var(--border-subtle)] flex items-center justify-center ${shapeClass}`}
            >
              {imageUrl ? (
                <EntityImage
                  src={imageUrl}
                  alt={resolvedImageAlt}
                  fill
                  sizes="64px"
                  entityType={entityType}
                  priority
                  className={shape === "circle" ? "object-cover" : "object-contain p-1.5"}
                />
              ) : fallbackIcon ? (
                fallbackIcon
              ) : (
                <Trophy className="w-6 h-6 text-[var(--text-muted)]" />
              )}
            </div>

            {/* Title & Headline Value */}
            <div className="min-w-0 flex-1">
              {categoryLabel && (
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block leading-none mb-1">
                  {categoryLabel}
                </span>
              )}

              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <h1 className="text-lg sm:text-2xl font-black text-[var(--text-primary)] tracking-tight line-clamp-2 leading-tight">
                  {title}
                </h1>

                {/* Primary Valuation (e.g. Squad Value or Player Value) inline on mobile */}
                {value && (
                  <div className="flex items-center gap-1.5 tabular-nums shrink-0">
                    <span className="text-base sm:text-xl font-black text-[var(--value-text)] figure tracking-tight">
                      {value}
                    </span>
                    {valueTrend}
                    {(freshnessTimestamp || valueUpdatedAt || checkedAt) && (
                      <ValuationFreshness
                        timestamp={freshnessTimestamp}
                        valueUpdatedAt={valueUpdatedAt}
                        checkedAt={checkedAt}
                      />
                    )}
                  </div>
                )}
              </div>

              {subtitle && (
                <div className="text-xs text-[var(--text-muted)] font-medium truncate mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Right Side Valuation Box (hidden on mobile to keep under 220px height) */}
          {value && (variant === "player" || variant === "league") && (
            <div className="hidden sm:flex flex-col items-end justify-center shrink-0 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] min-w-[140px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {valueLabel || (variant === "player" ? "Current Market Value" : "Competition Value")}
              </span>
              <span className="text-xl sm:text-2xl font-black text-[var(--value-text)] figure tabular-nums tracking-tight mt-0.5">
                {value}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {valueTrend}
                {(freshnessTimestamp || valueUpdatedAt || checkedAt) && (
                  <ValuationFreshness
                    timestamp={freshnessTimestamp}
                    valueUpdatedAt={valueUpdatedAt}
                    checkedAt={checkedAt}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Middle Line: Key Metadata Ribbon (Single line, bullet-separated, never wrapping excessively) */}
        {metaItems && metaItems.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] flex-wrap overflow-hidden pt-0.5">
            {metaItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[var(--text-muted)] select-none">•</span>}
                <span className="inline-flex items-center gap-1 shrink-0">{item}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Bottom Row: Honours / Extra Content (Left) + Actions in Single Row (Right) */}
        <div className="flex items-center justify-between gap-2.5 pt-1 border-t border-border-subtle/50 flex-wrap sm:flex-nowrap">
          {/* Left Area: Honours (Club) or Status / Extra content */}
          <div className="min-w-0 flex-1">{extraContent}</div>

          {/* Right Area: Single-Row Actions Bar (Follow + Share) - 44px min tap targets */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {actions}
            {showShare && (
              <ShareButton title={shareTitle || title} url={shareUrl} />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
