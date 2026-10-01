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
      {/* 1. Page Title (22-24px, never truncated, continuous background) */}
      <PageHeader
        title="Matches"
        subtitle="Live match scores, xG disparity & financial rosters"
      />

      {/* 
        2. SINGLE DATE BAR (FotMob mobile pattern):
        "Today ▾" with prev/next arrows; tap opens calendar sheet; swipe left/right changes day.
      */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-1 max-w-sm mx-auto w-full">
        {/* Previous Day Arrow */}
        <button
          type="button"
          onClick={() => navigateTo(addDaysToDateStr(activeDate, -1))}
          className="min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg active:scale-95 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center: "Today ▾" opens calendar sheet */}
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="flex items-center gap-1.5 min-h-[38px] px-3 font-bold text-white text-sm hover:text-amber-400 active:scale-95 transition-colors"
          aria-label="Open calendar"
        >
          <span>{dateLabel}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {/* Next Day Arrow */}
        <button
          type="button"
          onClick={() => navigateTo(addDaysToDateStr(activeDate, 1))}
          className="min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg active:scale-95 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Single timezone caption under the date bar */}
      <div className="text-[11px] text-slate-500 text-center font-medium -mt-1">
        Times in {tzLabel}
      </div>

      {/* 
        3. ONE ROW OF STICKY FILTER PILLS (Sticky under header):
        [Live 2] [Finished 3] [Upcoming 55] [Top leagues / All].
        Toggle behaviour; none selected = all. Counts global.
      */}
      <div className="sticky top-14 z-20 -mx-4 px-4 py-1.5 bg-slate-950/95 backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto scrollbar-none edge-fade-x">
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          {/* Live Pill */}
          <button
            type="button"
            onClick={() => handleFilterClick("live")}
            className={`min-h-[34px] px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
              activeFilter === "live"
                ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:text-rose-400"
            }`}
          >
            <Radio className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Live {liveScopedMatchesCount}</span>
          </button>

          {/* Finished Pill */}
          <button
            type="button"
            onClick={() => handleFilterClick("finished")}
            className={`min-h-[34px] px-3 py-1 rounded-xl font-bold flex items-center gap-1 border transition-all ${
              activeFilter === "finished"
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <span>Finished {finishedScopedMatchesCount}</span>
          </button>

          {/* Upcoming Pill */}
          <button
            type="button"
            onClick={() => handleFilterClick("upcoming")}
            className={`min-h-[34px] px-3 py-1 rounded-xl font-bold flex items-center gap-1 border transition-all ${
              activeFilter === "upcoming"
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-sm"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <span>Upcoming {upcomingScopedMatchesCount}</span>
          </button>
        </div>

        {/* Top leagues / All toggle pill */}
        <button
          type="button"
          onClick={handleScopeToggle}
          className={`min-h-[34px] px-3 py-1 rounded-xl font-bold text-xs border shrink-0 transition-all ${
            activeScope === "all"
              ? "bg-slate-800 text-white border-slate-700"
              : "bg-slate-900 text-amber-400 border-slate-800 hover:border-slate-700"
          }`}
        >
          {activeScope === "top" ? "Top Leagues" : "All Leagues"}
        </button>
      </div>

      {/* 4. Muted caption if auto-switched or no Top-10 fixtures today */}
      {autoSwitched && (
        <p className="text-[12px] text-slate-400 text-center py-0.5">
          No Top-10 fixtures today, showing all leagues
        </p>
      )}

      {/* 
        5. COLLAPSIBLE LEAGUE GROUPS:
        Header 44px, crest/flag 20px, "Country - Competition" 14px semibold, chevron, remembers collapsed state.
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
                className="rounded-2xl glass-panel border border-slate-800/80 overflow-hidden"
              >
                {/* League Group Header (44px tall) */}
                <button
                  type="button"
                  onClick={() => toggleLeagueCollapse(league.id)}
                  className="w-full h-11 flex items-center justify-between px-3 sm:px-4 bg-slate-900/60 hover:bg-slate-900 transition-colors text-left"
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

                    <span className="text-[14px] font-semibold text-white tracking-tight truncate">
                      {headerTitle}
                    </span>

                    {/* Group chip shown once inside the group */}
                    {groupName && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700/60 shrink-0">
                        {groupName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {league.matches.length}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isCollapsed ? "-rotate-90" : "rotate-0"
                      }`}
                    />
                  </div>
                </button>

                {/* Match rows list (1px dividers) */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-800/60 border-t border-slate-800/60">
                    {league.matches.map((match: FotmobMatch) => (
                      <MatchRow key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl glass-panel p-10 border border-slate-800 text-center space-y-3">
            <p className="text-slate-300 text-sm font-semibold">No matches found for this date & filter.</p>
            <p className="text-slate-500 text-xs">Try selecting another date or switching to All Leagues.</p>
            <button
              type="button"
              onClick={() => navigateTo(undefined, "all", "all")}
              className="px-4 py-2 min-h-[40px] rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-colors"
            >
              Show All Matches
            </button>
          </div>
        )}
      </div>

      {/* Calendar Bottom Sheet */}
      {calendarOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setCalendarOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select match date"
            className="relative z-10 w-full max-w-md mx-auto rounded-t-3xl bg-slate-950 border-t border-slate-800 p-5 space-y-4 animate-in slide-in-from-bottom duration-200"
            style={{
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-2 mb-3" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                Select Match Date
              </h3>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white"
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
                    className={`min-h-[44px] rounded-xl text-xs font-bold border transition-colors ${
                      isSelected
                        ? "bg-amber-400 text-slate-950 border-amber-400"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Native Date Input Picker */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor="matches-custom-date" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Choose Specific Date
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
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
