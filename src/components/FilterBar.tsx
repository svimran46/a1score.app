"use client";

import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  children?: React.ReactNode;
  quickActions?: React.ReactNode;
  className?: string;
}

/**
 * Compact mobile-first FilterBar.
 * - ONE compact sticky row under the header: search input + "Filters" button with active badge.
 * - Never shows dropdown stacks inline on mobile.
 * - Opens a clean, accessible Bottom Sheet for filters (sort, league, country, position, etc.).
 * - Touch targets >= 44px. Uses dvh for height constraints.
 */
export function FilterBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  placeholder = "Search...",
  activeFilterCount = 0,
  onResetFilters,
  children,
  quickActions,
  className = "",
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(e);
    }
  };

  return (
    <>
      <div
        className={`sticky top-14 z-30 w-full bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md px-4 py-2 flex items-center gap-2 ${className}`}
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        {/* Search Bar Input */}
        <form onSubmit={handleSubmit} className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-9 h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-amber-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] p-2 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Quick Actions (if any) */}
        {quickActions && <div className="shrink-0 flex items-center">{quickActions}</div>}

        {/* Filter Bottom Sheet Trigger */}
        {children && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`min-h-[44px] min-w-[44px] px-3.5 flex items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-all shrink-0 active:scale-95 ${
              activeFilterCount > 0
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
            }`}
            aria-label={`Open filters. ${activeFilterCount} active filters.`}
            aria-expanded={isOpen}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-black rounded-full bg-amber-400 text-slate-950">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Bottom Sheet Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter Options"
            className="relative z-10 w-full max-w-xl mx-auto rounded-t-3xl bg-slate-950 border-t border-slate-800 shadow-2xl flex flex-col max-h-[85dvh] animate-in slide-in-from-bottom duration-200"
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
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
                    className="min-h-[44px] px-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Reset All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-white flex items-center justify-center transition-colors"
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
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center transition-colors shadow-lg shadow-amber-500/10 active:scale-[0.99]"
              >
                Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
