"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Users,
  BarChart2,
  Clock,
  History,
} from "lucide-react";
import { OverviewTab } from "@/components/match-tabs/OverviewTab";
import { LineupTab } from "@/components/match-tabs/LineupTab";
import { StatsTab } from "@/components/match-tabs/StatsTab";
import { TimelineTab } from "@/components/match-tabs/TimelineTab";
import { H2HTab } from "@/components/match-tabs/H2HTab";
import {
  OverviewSkeleton,
  LineupsSkeleton,
  StatsSkeleton,
  TimelineSkeleton,
  H2HSkeleton,
} from "@/components/match-tabs/TabSkeletons";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { StickyMatchBar } from "@/components/StickyMatchBar";

interface MatchTabsProps {
  match: any;
  isScorecardOutOfView?: boolean;
}

interface TabDef {
  id: "overview" | "lineup" | "stats" | "timeline" | "h2h";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "lineup", label: "Lineups", icon: Users },
  { id: "stats", label: "Stats", icon: BarChart2 },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "h2h", label: "H2H", icon: History },
];

export function MatchTabs({ match, isScorecardOutOfView = false }: MatchTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<TabDef["id"]>(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      return tabParam as TabDef["id"];
    }
    // Backward compatibility for old "facts" param
    if (tabParam === "facts") return "overview";
    return "overview";
  });

  const tabListRef = useRef<HTMLDivElement>(null);

  // Sync state if URL query param changes externally
  useEffect(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam as TabDef["id"]);
    } else if (tabParam === "facts" && activeTab !== "overview") {
      setActiveTab("overview");
    }
  }, [tabParam, activeTab]);

  // Tab switch without scroll jump
  const handleSelectTab = useCallback(
    (tabId: TabDef["id"]) => {
      setActiveTab(tabId);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (tabId === "overview") {
          url.searchParams.delete("tab");
        } else {
          url.searchParams.set("tab", tabId);
        }
        window.history.replaceState({}, "", url.toString());
      }
    },
    []
  );

  // Keyboard navigation across tabs (ArrowRight / ArrowLeft)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % TABS.length;
      handleSelectTab(TABS[nextIndex].id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>("button[role='tab']");
      buttons?.[nextIndex]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + TABS.length) % TABS.length;
      handleSelectTab(TABS[prevIndex].id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>("button[role='tab']");
      buttons?.[prevIndex]?.focus();
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* 
        Sticky Container: Compact bar (when scrolled past scorecard) + Tabs row.
        Remains pinned under the app header (top-14 sm:top-16) at all times.
      */}
      <div className="sticky top-14 sm:top-16 z-30 bg-[var(--bg-page)]/95 backdrop-blur-md border-b border-[var(--divider)] -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 transition-all">
        {/* Compact bar reveals when scorecard scrolls out of view */}
        {isScorecardOutOfView && (
          <div className="border-b border-[var(--divider)] pb-1">
            <StickyMatchBar match={match} isVisible={true} />
          </div>
        )}

        {/* Tab row with guaranteed 44px tap targets and no clipping */}
        <div className="max-w-4xl mx-auto py-1.5 sm:py-2">
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="Match sections"
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {TABS.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleSelectTab(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                    isActive
                      ? "bg-amber-500/15 text-[var(--value-text)] border border-amber-500/40 shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Tab Content Panel with SectionErrorBoundary and Exact Skeletons */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="max-w-4xl mx-auto focus:outline-none"
        tabIndex={0}
      >
        {activeTab === "overview" && (
          <SectionErrorBoundary sectionName="Overview">
            <Suspense fallback={<OverviewSkeleton />}>
              <OverviewTab match={match} />
            </Suspense>
          </SectionErrorBoundary>
        )}

        {activeTab === "lineup" && (
          <SectionErrorBoundary sectionName="Lineups">
            <Suspense fallback={<LineupsSkeleton />}>
              <LineupTab match={match} />
            </Suspense>
          </SectionErrorBoundary>
        )}

        {activeTab === "stats" && (
          <SectionErrorBoundary sectionName="Stats">
            <Suspense fallback={<StatsSkeleton />}>
              <StatsTab match={match} />
            </Suspense>
          </SectionErrorBoundary>
        )}

        {activeTab === "timeline" && (
          <SectionErrorBoundary sectionName="Timeline">
            <Suspense fallback={<TimelineSkeleton />}>
              <TimelineTab match={match} />
            </Suspense>
          </SectionErrorBoundary>
        )}

        {activeTab === "h2h" && (
          <SectionErrorBoundary sectionName="Head to Head">
            <Suspense fallback={<H2HSkeleton />}>
              <H2HTab match={match} />
            </Suspense>
          </SectionErrorBoundary>
        )}
      </div>
    </div>
  );
}
