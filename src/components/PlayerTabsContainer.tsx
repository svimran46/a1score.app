"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { KeyFacts, type KeyFactItem } from "@/components/KeyFacts";
import { MarketValueChart } from "@/components/MarketValueChart";
import { TransfersTable } from "@/components/TransfersTable";
import { StatsTable } from "@/components/StatsTable";
import { InjuriesTable } from "@/components/InjuriesTable";
import { SectionHeader } from "@/components/SectionHeader";
import { User, ArrowRightLeft, TrendingUp } from "lucide-react";

interface PlayerTabsContainerProps {
  keyFactsItems: KeyFactItem[];
  mvs: any[];
  playerName: string;
  dateOfBirth?: Date | null;
  seasonStats?: any[];
  transfers?: any[];
  injuries?: any[];
}

export function PlayerTabsContainer({
  keyFactsItems,
  mvs,
  playerName,
  dateOfBirth,
  seasonStats = [],
  transfers = [],
  injuries = [],
}: PlayerTabsContainerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "transfers" | "value">("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
    {
      id: "transfers",
      label: "Transfers",
      count: transfers.length > 0 ? transfers.length : undefined,
      icon: <ArrowRightLeft className="w-4 h-4" />,
    },
    {
      id: "value",
      label: "Value History",
      count: mvs.length > 0 ? mvs.length : undefined,
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
        ariaLabel="Player Profile Sections"
      />

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <section className="space-y-2">
            <SectionHeader title="Key facts" />
            <KeyFacts items={keyFactsItems} />
          </section>

          {seasonStats.length > 0 && (
            <section className="space-y-2">
              <SectionHeader title="Season stats" />
              <StatsTable stats={seasonStats} />
            </section>
          )}

          {injuries.length > 0 && (
            <section className="space-y-2">
              <SectionHeader title="Injuries" />
              <InjuriesTable injuries={injuries} />
            </section>
          )}
        </div>
      )}

      {/* Tab 2: Transfers */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <section className="space-y-2">
            <SectionHeader title="Transfers" />
            <TransfersTable transfers={transfers} />
          </section>
        </div>
      )}

      {/* Tab 3: Value History */}
      {activeTab === "value" && (
        <div className="space-y-4">
          <section className="space-y-2">
            <SectionHeader title="Value history" />
            {mvs.length > 0 ? (
              <MarketValueChart
                data={mvs}
                playerName={playerName}
                dateOfBirth={dateOfBirth}
              />
            ) : (
              <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-card)] rounded-[var(--card-radius)]">
                No valuation history recorded.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
