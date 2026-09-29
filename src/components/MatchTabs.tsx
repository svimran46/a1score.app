"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Users,
  Trophy,
  BarChart2,
  History,
  TrendingUp,
} from "lucide-react";
import { FactsTab } from "@/components/match-tabs/FactsTab";
import { LineupTab } from "@/components/match-tabs/LineupTab";
import { TableTab } from "@/components/match-tabs/TableTab";
import { StatsTab } from "@/components/match-tabs/StatsTab";
import { H2HTab } from "@/components/match-tabs/H2HTab";
import { ValuesTab } from "@/components/match-tabs/ValuesTab";
import { StickyMatchBar } from "@/components/StickyMatchBar";

interface MatchTabsProps {
  match: any;
  isScorecardOutOfView?: boolean;
}

interface TabDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDef[] = [
  { id: "facts", label: "Facts", icon: FileText },
  { id: "lineup", label: "Lineup", icon: Users },
  { id: "table", label: "Table", icon: Trophy },
  { id: "stats", label: "Stats", icon: BarChart2 },
  { id: "h2h", label: "H2H", icon: History },
  { id: "values", label: "Values", icon: TrendingUp },
];

export function MatchTabs({ match, isScorecardOutOfView = false }: MatchTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      return tabParam;
    }
    return "facts";
  });

  const tabListRef = useRef<HTMLDivElement>(null);

  // Sync state if URL query param changes externally
  useEffect(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  // Tab switch without scroll jump
  const handleSelectTab = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (tabId === "facts") {
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
    <div className="w-full space-y-6">
      {/* 
        Sticky Container: Compact bar (when scrolled past scorecard) + Tabs row.
        Remains pinned under the app header (top-14 sm:top-16) at all times.
      */}
      <div className="sticky top-14 sm:top-16 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 transition-all">
        {/* Compact bar reveals when scorecard scrolls out of view */}
        {isScorecardOutOfView && (
          <div className="border-b border-slate-800/60 pb-1">
            <StickyMatchBar match={match} isVisible={true} />
          </div>
        )}

        {/* Tab row */}
        <div className="max-w-4xl mx-auto py-2">
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="Match Center Sections"
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth"
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
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    isActive
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
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

      {/* Active Tab Content Panel */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="max-w-4xl mx-auto focus:outline-none"
        tabIndex={0}
      >
        {activeTab === "facts" && <FactsTab match={match} />}
        {activeTab === "lineup" && <LineupTab match={match} />}
        {activeTab === "table" && <TableTab match={match} />}
        {activeTab === "stats" && <StatsTab match={match} />}
        {activeTab === "h2h" && <H2HTab match={match} />}
        {activeTab === "values" && <ValuesTab match={match} />}
      </div>
    </div>
  );
}
