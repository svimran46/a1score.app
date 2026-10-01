"use client";

import React, { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export interface FilterButtonAndSheetProps {
  activeFilterCount?: number;
  onResetFilters?: () => void;
  children: React.ReactNode;
  className?: string;
  buttonLabel?: string;
}

/**
 * FilterButtonAndSheet component.
 * Compact "Filters" trigger button that opens an accessible bottom sheet modal.
 * Uses dvh, backdrop blur, handles ESC/outside click, and includes a sticky Apply button.
 */
export function FilterButtonAndSheet({
  activeFilterCount = 0,
  onResetFilters,
  children,
  className = "",
  buttonLabel = "Filters",
}: FilterButtonAndSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key and freeze scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`min-h-[44px] px-3.5 py-1.5 flex items-center justify-center gap-1.5 rounded-lg border text-[13px] font-medium transition-all shrink-0 active:scale-95 ${
          activeFilterCount > 0
            ? "bg-[var(--color-surface-2)] border-[var(--color-accent)] text-[var(--color-accent)]"
            : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        } ${className}`}
        aria-label={`Open filters. ${activeFilterCount} active filters.`}
        aria-expanded={isOpen}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
        <span>{buttonLabel}</span>
        {activeFilterCount > 0 && (
          <span className="ml-0.5 inline-flex items-center justify-center px-1.5 py-0.2 text-[12px] font-semibold rounded-full bg-[var(--color-accent)] text-[#0B0F17]">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Bottom Sheet Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter Options"
            className="relative z-10 w-full max-w-xl mx-auto rounded-t-2xl bg-[var(--color-surface)] border-t border-[var(--color-border)] flex flex-col max-h-[85dvh] animate-in slide-in-from-bottom duration-200"
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-[var(--color-surface-2)] rounded-full mx-auto mt-3 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold bg-[var(--color-accent)] text-[#0B0F17]">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onResetFilters && activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onResetFilters();
                    }}
                    className="min-h-[44px] px-2 text-[13px] font-medium text-[var(--color-accent)] hover:underline transition-colors"
                  >
                    Reset All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] flex items-center justify-center transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Filters Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 overscroll-contain">
              {children}
            </div>

            {/* Apply Button Footer */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full h-11 rounded-lg bg-[var(--color-accent)] text-[#0B0F17] font-semibold text-[15px] flex items-center justify-center transition-colors active:scale-[0.99]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const FilterBar = FilterButtonAndSheet;
