"use client";

import React, { useRef } from "react";

export interface UnderlineTab {
  id: string;
  label: string;
  count?: number;
}

/**
 * Text tabs with an underline indicator (FotMob "Teams | Players" style),
 * used for top-level page sections. Arrow keys / Home / End move between tabs.
 */
export function UnderlineTabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
  idPrefix,
}: {
  tabs: UnderlineTab[];
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  /** Prefix for tab/panel ids so panels can reference `${idPrefix}-panel-${id}`. */
  idPrefix: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-end gap-6 overflow-x-auto no-scrollbar border-b border-[var(--divider)]"
    >
      {tabs.map((tab, i) => {
        const selected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative shrink-0 min-h-[44px] pb-2.5 pt-2 text-[15px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-t-md ${
              selected
                ? "text-[var(--text-primary)] font-bold"
                : "text-[var(--text-muted)] font-semibold hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 text-xs font-semibold text-[var(--text-muted)] tabular-nums">{tab.count}</span>
            )}
            <span
              aria-hidden="true"
              className={`absolute left-0 right-0 bottom-0 h-[3px] rounded-t-full ${selected ? "bg-[var(--text-primary)]" : "bg-transparent"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
