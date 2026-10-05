"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MatchRow } from "./MatchRow";
import { PageHeader } from "./PageHeader";
import { EntityImage } from "./EntityImage";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  X,
  Radio,
} from "lucide-react";
import type { FotmobLeagueGroup, FotmobMatch } from "@/lib/fotmob/client";

interface MatchesClientProps {
  activeDate: string;
  activeFilter: "all" | "live" | "finished" | "upcoming";
  activeScope: "top" | "all";
  autoSwitched: boolean;
  leagues: FotmobLeagueGroup[];
  totalScopedMatches: number;
  liveScopedMatchesCount: number;
  finishedScopedMatchesCount: number;
  upcomingScopedMatchesCount: number;
  totalAllMatchesCount: number;
  fetchedAt?: string | null;
}

function formatDateString(dateStr: string): string {
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const target = new Date(Date.UTC(y, m, d));

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffDays = Math.round((target.getTime() - todayUtc.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";

  return target.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function addDaysToDateStr(dateStr: string, deltaDays: number): string {
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const target = new Date(Date.UTC(y, m, d + deltaDays));
  return target.toISOString().slice(0, 10).replace(/-/g, "");
}

function toHyphenatedDate(dateStr: string): string {
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

export function MatchesClient({
  activeDate,
  activeFilter,
  activeScope,
  autoSwitched,
  leagues,
  totalScopedMatches,
  liveScopedMatchesCount,
  finishedScopedMatchesCount,
  upcomingScopedMatchesCount,
  totalAllMatchesCount,
  fetchedAt,
}: MatchesClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Timezone string (e.g. "GMT+8")
  const [tzLabel, setTzLabel] = useState("UTC");
  useEffect(() => {
    try {
      const offsetMinutes = new Date().getTimezoneOffset();
      const offsetHours = -offsetMinutes / 60;
      const sign = offsetHours >= 0 ? "+" : "";
      setTzLabel(`GMT${sign}${offsetHours}`);
    } catch {}
  }, []);

  const [formattedUpdatedTime, setFormattedUpdatedTime] = useState<string | null>(null);
  useEffect(() => {
    if (fetchedAt) {
      try {
        const d = new Date(fetchedAt);
        const pad = (n: number) => String(n).padStart(2, "0");
        setFormattedUpdatedTime(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
      } catch {}
    }
  }, [fetchedAt]);

  // Calendar Sheet state
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Collapsed leagues state (persisted in localStorage)
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("a1_collapsed_leagues");
        return saved ? JSON.parse(saved) : {};
      } catch {}
    }
    return {};
  });

  const toggleLeagueCollapse = (leagueId: string | number) => {
    const key = String(leagueId);
    setCollapsedLeagues((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("a1_collapsed_leagues", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const navigateTo = (newDate?: string, newFilter?: string, newScope?: string) => {
    const d = newDate ?? activeDate;
    const f = newFilter ?? activeFilter;
    const s = newScope ?? activeScope;
    router.push(`${pathname}?date=${d}&filter=${f}&scope=${s}`, { scroll: false });
  };

  // Toggle filter pill: if already selected, deselect to "all"
  const handleFilterClick = (targetFilter: "live" | "finished" | "upcoming") => {
    const nextFilter = activeFilter === targetFilter ? "all" : targetFilter;
    navigateTo(undefined, nextFilter, undefined);
  };

  const handleScopeToggle = () => {
    const nextScope = activeScope === "top" ? "all" : "top";
    navigateTo(undefined, undefined, nextScope);
  };

  // Swipe gesture detection (left/right on main container to change date)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Only trigger if horizontal swipe is significantly greater than vertical scroll
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) {
        // Swipe Right -> Previous day
        navigateTo(addDaysToDateStr(activeDate, -1));
      } else {
        // Swipe Left -> Next day
        navigateTo(addDaysToDateStr(activeDate, 1));
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const dateLabel = formatDateString(activeDate);

  return (
    <div
      className="space-y-2.5 sm:space-y-3"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Page Title (20/600, continuous background) */}
      <PageHeader
        title="Matches"
        subtitle="Scores and fixtures"
      />

      {/* 
        2. SINGLE DATE BAR:
        "Today ▾" with prev/next arrows; tap opens calendar sheet; swipe left/right changes day.
      */}
      <div className="flex items-center justify-between bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-2 py-1 max-w-sm mx-auto w-full">
        {/* Previous Day Arrow */}
        <button
          type="button"
          onClick={() => navigateTo(addDaysToDateStr(activeDate, -1))}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-lg active:scale-95 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center: "Today ▾" opens calendar sheet */}
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="flex items-center gap-1.5 min-h-[44px] px-3 font-semibold text-[var(--color-text)] text-[15px] hover:text-[var(--color-accent)] active:scale-95 transition-colors"
          aria-label="Open calendar"
        >
          <span>{dateLabel}</span>
          <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </button>

        {/* Next Day Arrow */}
        <button
          type="button"
          onClick={() => navigateTo(addDaysToDateStr(activeDate, 1))}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-lg active:scale-95 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Single timezone and updated timestamp caption under the date bar */}
      <div className="flex items-center justify-center gap-2 text-[12px] sm:text-[13px] text-[var(--color-text-secondary)] text-center font-normal -mt-1 tabular-nums">
        <span>Times in {tzLabel}</span>
        {formattedUpdatedTime && (
          <>
            <span className="opacity-40">•</span>
            <span>Updated {formattedUpdatedTime}</span>
          </>
        )}
      </div>

      {/* 
        3. ONE ROW OF STICKY FILTER PILLS (Sticky under header):
        [Live 2] [Finished 3] [Upcoming 55] [Top leagues / All].
        Toggle behaviour; none selected = all. Counts global.
      */}
      <div className="sticky top-14 z-20 -mx-4 px-4 py-2 bg-[var(--color-bg)]/95 backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto scrollbar-none edge-fade-x">
        <div className="flex items-center gap-1.5 shrink-0 text-[13px]">
          {/* Live Pill */}
          <button
            type="button"
            onClick={() => handleFilterClick("live")}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border transition-all ${
              activeFilter === "live"
                ? "bg-[var(--color-surface-2)] text-[var(--color-positive)] border-[var(--color-positive)]"
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[var(--color-positive)] shrink-0" />
            <span>Live {liveScopedMatchesCount}</span>
          </button>

          {/* Finished Pill */}
          <button
            type="button"
            onClick={() => handleFilterClick("finished")}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1 border transition-all ${
              activeFilter === "finished"
                ? "bg-[var(--color-accent)] text-[var(--accent-contrast)] font-semibold border-[var(--color-accent)]"
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            <span>Finished {finishedScopedMatchesCount}</span>
          </button>

          {/* Upcoming Pill */}
          <button
            type="button"
            onClick={() => handleFilterClick("upcoming")}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1 border transition-all ${
              activeFilter === "upcoming"
                ? "bg-[var(--color-accent)] text-[var(--accent-contrast)] font-semibold border-[var(--color-accent)]"
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            <span>Upcoming {upcomingScopedMatchesCount}</span>
          </button>
        </div>

        {/* Top leagues / All toggle pill */}
        <button
          type="button"
          onClick={handleScopeToggle}
          className={`min-h-[44px] px-3.5 py-1.5 rounded-lg font-medium text-[13px] border shrink-0 transition-all ${
            activeScope === "all"
              ? "bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)]"
              : "bg-[var(--color-surface-2)] text-[var(--color-accent)] border-[var(--color-accent)] font-semibold"
          }`}
        >
          {activeScope === "top" ? "Top Leagues" : "All Leagues"}
        </button>
      </div>

      {/* 4. Muted caption if auto-switched or no Top-10 fixtures today */}
      {autoSwitched && (
        <p className="text-[13px] text-[var(--color-text-secondary)] text-center py-0.5">
          No Top-10 fixtures today, showing all leagues
        </p>
      )}

      {/* 
        5. COLLAPSIBLE LEAGUE GROUPS:
        Header 44px, crest/flag 20px, "Country - Competition" 15px font-semibold, chevron, remembers collapsed state.
        Group chip ("Group 2") shown once inside group.
        MatchRow list inside ONE card per league with 1px dividers.
      */}
      <div className="space-y-3">
        {leagues.length > 0 ? (
          leagues.map((league) => {
            const isCollapsed = Boolean(collapsedLeagues[String(league.id)]);
            const headerTitle = league.ccode
              ? `${league.ccode.toUpperCase()} - ${league.name}`
              : league.name;

            // Extract group label from first match if available (e.g. "Group 2" or "Round 1")
            const groupName = league.matches[0]?.round || null;

            return (
              <div
                key={league.id}
                className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden"
              >
                {/* League Group Header (44px tall) */}
                <button
                  type="button"
                  onClick={() => toggleLeagueCollapse(league.id)}
                  className="w-full h-11 flex items-center justify-between px-3 sm:px-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition-colors text-left"
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Crest/Flag 20px */}
                    <div className="relative w-5 h-5 shrink-0 flex items-center justify-center overflow-hidden">
                      {league.matches[0]?.home?.imageUrl ? (
                        <EntityImage
                          src={league.matches[0].home.imageUrl}
                          alt=""
                          width={20}
                          height={20}
                          entityType="league"
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-xs">🏆</span>
                      )}
                    </div>

                    <span className="text-[15px] font-semibold text-[var(--color-text)] tracking-tight truncate">
                      {headerTitle}
                    </span>

                    {/* Group chip shown once inside the group */}
                    {groupName && (
                      <span className="text-[12px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded border border-[var(--color-border)] shrink-0">
                        {groupName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[13px] font-normal text-[var(--color-text-secondary)] tabular-nums">
                      {league.matches.length}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-200 ${
                        isCollapsed ? "-rotate-90" : "rotate-0"
                      }`}
                    />
                  </div>
                </button>

                {/* Match rows list (1px dividers) */}
                {!isCollapsed && (
                  <div className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                    {league.matches.map((match: FotmobMatch) => (
                      <MatchRow key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl bg-[var(--color-surface)] p-8 border border-[var(--color-border)] text-center space-y-3">
            <p className="text-[var(--color-text-secondary)] text-[15px]">No matches found for this date & filter.</p>
            <button
              type="button"
              onClick={() => navigateTo(undefined, "all", "all")}
              className="px-4 py-2 min-h-[44px] rounded-lg bg-[var(--color-accent)] text-[var(--accent-contrast)] text-[13px] font-semibold transition-colors"
            >
              Show all matches
            </button>
          </div>
        )}
      </div>

      {/* Calendar Bottom Sheet */}
      {calendarOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setCalendarOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select match date"
            className="relative z-10 w-full max-w-md mx-auto rounded-t-2xl bg-[var(--color-surface)] border-t border-[var(--color-border)] p-4 space-y-4 animate-in slide-in-from-bottom duration-200"
            style={{
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
            <div className="w-12 h-1 bg-[var(--color-surface-2)] rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-[16px] font-semibold text-[var(--color-text)] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[var(--color-accent)]" />
                Select match date
              </h3>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick shortcuts: Yesterday, Today, Tomorrow */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Yesterday", delta: -1 },
                { label: "Today", delta: 0, date: new Date().toISOString().slice(0, 10).replace(/-/g, "") },
                { label: "Tomorrow", delta: 1 },
              ].map((item) => {
                const targetDate = item.date ?? addDaysToDateStr(new Date().toISOString().slice(0, 10).replace(/-/g, ""), item.delta);
                const isSelected = activeDate === targetDate;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      navigateTo(targetDate);
                      setCalendarOpen(false);
                    }}
                    className={`min-h-[44px] rounded-lg text-[13px] font-medium border transition-colors ${
                      isSelected
                        ? "bg-[var(--color-accent)] text-[var(--accent-contrast)] font-semibold border-[var(--color-accent)]"
                        : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Native Date Input Picker */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor="matches-custom-date" className="block text-[13px] font-normal text-[var(--color-text-secondary)]">
                Choose specific date
              </label>
              <input
                id="matches-custom-date"
                type="date"
                defaultValue={toHyphenatedDate(activeDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    const formatted = e.target.value.replace(/-/g, "");
                    navigateTo(formatted);
                    setCalendarOpen(false);
                  }
                }}
                className="w-full min-h-[44px] px-3.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-[15px] font-normal focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
