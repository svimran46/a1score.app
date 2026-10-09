import { getTransfersHubData, TransferRecord } from "@/lib/data/transfers";
import { constructMetadata } from "@/lib/metadata";
import { Card, SectionHeader, PageHeader } from "@/components/ui";
import { TransfersHubClient } from "@/components/transfers/TransfersHubClient";
import { ShieldCheck, Info } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Commercial Transfer Hub — Latest Moves & Record Fees",
  description:
    "Comprehensive football transfer tracker: documented commercial fees, record transfers, and market expenditure on a1score.app.",
  path: "/transfers",
});

export default async function TransfersPage() {
  const { allTimeRecords, recentCommercial, contractEndsAndRetirements } =
    await getTransfersHubData();

  return (
    <div className="space-y-6 max-w-[720px] mx-auto">
      {/* Page Header */}
      <PageHeader
        variant="directory"
        categoryLabel="Commercial Ledger Intelligence"
        title="Transfers"
        subtitle="Documented player transactions, historical record fees, and commercial market expenditure across global football."
      />

      {/* 1. All-Time Record Transfers (Always SSR-rendered with Neymar €222M #1) */}
      <section className="space-y-2">
        <SectionHeader
          title="All-Time Record Transfers"
          action={
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Top 20 Documented Fees
            </span>
          }
        />
        <TransfersHubClient
          initialRecords={allTimeRecords}
          initialCommercial={recentCommercial}
          initialContractEnds={contractEndsAndRetirements}
        />
      </section>

      {/* Verification & Data Methodology Footnote */}
      <div className="pt-3 border-t border-[var(--divider)] space-y-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--value-text)]" />
            Documented Commercial Ledger
          </span>
          <span>Excludes internal youth academy progressions</span>
        </div>
        <p className="text-[10px] text-text-muted/80 flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          Historical records and transaction valuations are based on documented commercial fees from Transfermarkt.
        </p>
      </div>
    </div>
  );
}
