"use client";

import React, { useRef, useId } from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * FotMob-style Chip Tabs component (for player/club detail):
 * Chip-style tabs: Overview, Squad, Transfers, Value history.
 * Keyboard accessible (arrow keys, Home, End), role="tablist", role="tab".
 */
export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  ariaLabel = "Navigation Tabs",
}: TabsProps) {
  const tabsListRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;

    switch (e.key) {
      case "ArrowRight":
        targetIndex = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        targetIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        targetIndex = 0;
        break;
      case "End":
        targetIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    if (targetIndex >= 0) {
      e.preventDefault();
      const nextTab = tabs[targetIndex];
      onChange(nextTab.id);

      // Focus the target tab button
      const buttons = tabsListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      if (buttons && buttons[targetIndex]) {
        buttons[targetIndex].focus();
      }
    }
  };

  return (
    <div
      ref={tabsListRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 select-none ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isSelected = activeTab === tab.id;
        const tabId = `${baseId}-tab-${tab.id}`;
        const panelId = `${baseId}-panel-${tab.id}`;

        return (
          <button
            key={tab.id}
            id={tabId}
            role="tab"
            type="button"
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[40px] h-10 px-4 rounded-[var(--chip-radius)] text-sm font-semibold whitespace-nowrap cursor-pointer transition-[background-color,opacity] duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)] ${
              isSelected
                ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
                : "bg-[var(--bg-chip)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                  isSelected
                    ? "bg-[var(--accent-contrast)]/20 text-[var(--accent-contrast)]"
                    : "bg-[var(--bg-card)] text-[var(--text-muted)]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
