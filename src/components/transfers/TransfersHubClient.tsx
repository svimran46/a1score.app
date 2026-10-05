"use client";

import React, { useState, useMemo } from "react";
import { TransferRecord } from "@/lib/data/transfers";
import { Card, SectionHeader, TransferRow, Tabs } from "@/components/ui";
import { ArrowRightLeft, FileText, Filter, Check } from "lucide-react";

interface TransfersHubClientProps {
  initialRecords: TransferRecord[];
  initialCommercial: TransferRecord[];
  initialContractEnds: TransferRecord[];
}

export function TransfersHubClient({
  initialRecords,
  initialCommercial,
  initialContractEnds,
}: TransfersHubClientProps) {
  const [activeTab, setActiveTab] = useState<"commercial" | "contracts">("commercial");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [minFeeFilter, setMinFeeFilter] = useState<number>(0);

  // Filter recent commercial moves
  const filteredCommercial = useMemo(() => {
    return initialCommercial.filter((t) => {
      if (selectedTypeFilter !== "all" && t.transferType !== selectedTypeFilter) {
        return false;
      }
      if (minFeeFilter > 0) {
        if (!t.feeEur || t.feeEur < minFeeFilter) return false;
      }
      return true;
    });
  }, [initialCommercial, selectedTypeFilter, minFeeFilter]);

  const tabs = [
    {
      id: "commercial",
      label: "Commercial Moves",
      count: initialCommercial.length,
      icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
    },
    {
      id: "contracts",
      label: "Contract Ends & Retirements",
      count: initialContractEnds.length,
      icon: <FileText className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. All-Time Record Transfers (Top 20 Documented Fees) */}
      <Card className="p-1 overflow-hidden">
        <div className="divide-y divide-[var(--divider)]">
          {initialRecords.map((t, idx) => (
            <div key={t.id} className="relative flex items-center">
              <span className="w-6 text-center text-xs font-bold text-[var(--text-muted)] pl-2 shrink-0 select-none tabular-nums">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <TransferRow
                  id={t.id}
                  playerName={t.player?.commonName || t.player?.fullName || "Player"}
                  playerSlug={t.player?.slug}
                  playerAvatar={t.player?.photoUrl}
                  playerPosition={t.player?.position}
                  fromClubName={t.fromClubName}
                  toClubName={t.toClubName}
                  fee={t.feeEur}
                  transferType={t.displayType}
                  date={t.displayDate}
                  isAgreedFutureDeal={t.isAgreedFutureDeal}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. Recent Transfers Section with Tab Switcher & Filters */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SectionHeader
            title="Recent Market Activity"
            action={
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {activeTab === "commercial"
                  ? `${filteredCommercial.length} Documented Moves`
                  : `${initialContractEnds.length} Recorded Ends`}
              </span>
            }
          />
        </div>

        {/* Segmented Control / Tab Switcher */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          ariaLabel="Transfer types"
        />

        {/* Filter Pills for Commercial Moves */}
        {activeTab === "commercial" && (
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter("all")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTypeFilter === "all"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-chip)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter("permanent")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTypeFilter === "permanent"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-chip)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Permanent
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter("loan")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTypeFilter === "loan"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-chip)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Loan
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter("free")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTypeFilter === "free"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-chip)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Free Transfer
            </button>

            {/* Min Fee Quick Toggle */}
            <button
              type="button"
              onClick={() => setMinFeeFilter(minFeeFilter === 0 ? 10000000 : 0)}
              className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                minFeeFilter > 0
                  ? "bg-[var(--bg-chip)] text-[var(--value-text)] ring-1 ring-[var(--value-text)]"
                  : "bg-[var(--bg-chip)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {minFeeFilter > 0 ? "Fee ≥ €10M ✓" : "Fee ≥ €10M"}
            </button>
          </div>
        )}

        {/* Tab 1 Content: Commercial Moves */}
        {activeTab === "commercial" && (
          <Card className="p-1 overflow-hidden">
            {filteredCommercial.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                No transfers match the selected filters.
              </div>
            ) : (
              <div className="divide-y divide-[var(--divider)]">
                {filteredCommercial.map((t) => (
                  <TransferRow
                    key={t.id}
                    id={t.id}
                    playerName={t.player?.commonName || t.player?.fullName || "Player"}
                    playerSlug={t.player?.slug}
                    playerAvatar={t.player?.photoUrl}
                    playerPosition={t.player?.position}
                    fromClubName={t.fromClubName}
                    toClubName={t.toClubName}
                    fee={t.feeEur}
                    transferType={t.displayType}
                    date={t.displayDate}
                    isAgreedFutureDeal={t.isAgreedFutureDeal}
                  />
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Tab 2 Content: Contract Ends & Retirements */}
        {activeTab === "contracts" && (
          <Card className="p-1 overflow-hidden">
            {initialContractEnds.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                No recent contract expiries or retirements recorded.
              </div>
            ) : (
              <div className="divide-y divide-[var(--divider)]">
                {initialContractEnds.map((t) => (
                  <TransferRow
                    key={t.id}
                    id={t.id}
                    playerName={t.player?.commonName || t.player?.fullName || "Player"}
                    playerSlug={t.player?.slug}
                    playerAvatar={t.player?.photoUrl}
                    playerPosition={t.player?.position}
                    fromClubName={t.fromClubName}
                    toClubName={t.toClubName}
                    fee={t.feeEur}
                    transferType={t.displayType}
                    date={t.displayDate}
                    isAgreedFutureDeal={t.isAgreedFutureDeal}
                  />
                ))}
              </div>
            )}
          </Card>
        )}
      </section>
    </div>
  );
}
