"use client";

import { useState } from "react";
import { EntityImage } from "./EntityImage";
import Link from "next/link";
import { formatCompactEur } from "@/lib/utils";
import { formatTransferFee } from "@/lib/transfers";
import { Card } from "@/components/ui";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Building2,
  ShieldCheck,
} from "lucide-react";

export interface ClubTransferRecord {
  id: string;
  fromClubName: string | null;
  toClubName: string | null;
  date: string | Date;
  feeEur: number | null;
  transferType?: string | null;
  player: {
    id: string;
    fullName: string;
    commonName?: string | null;
    photoUrl?: string | null;
    position?: string | null;
    sourceId?: string | null;
    externalId?: string | null;
    slug?: string | null;
  } | null;
}

interface ClubTransferLedgerProps {
  recordArrivals: ClubTransferRecord[];
  recordDepartures: ClubTransferRecord[];
  clubName: string;
}

export function ClubTransferLedger({
  recordArrivals,
  recordDepartures,
  clubName,
}: ClubTransferLedgerProps) {
  const [activeTab, setActiveTab] = useState<"arrivals" | "departures">("arrivals");

  const hasArrivals = recordArrivals && recordArrivals.length > 0;
  const hasDepartures = recordDepartures && recordDepartures.length > 0;

  if (!hasArrivals && !hasDepartures) {
    return null;
  }

  const activeList = activeTab === "arrivals" ? recordArrivals : recordDepartures;

  const totalArrivalsSpend = recordArrivals.reduce((sum, t) => sum + (t.feeEur || 0), 0);
  const totalDeparturesIncome = recordDepartures.reduce((sum, t) => sum + (t.feeEur || 0), 0);

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <Card className="p-4 sm:p-5 space-y-4 overflow-hidden">
      {/* Header and Filter Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--divider)]">
        <div className="flex items-center gap-2.5">
          <ArrowLeftRight className="w-4 h-4 text-[var(--value-text)]" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
              Transfer Flow & Record Ledger
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Documented commercial market fees for {clubName}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-page)] self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("arrivals")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "arrivals"
                ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Signings ({recordArrivals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("departures")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "departures"
                ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Sales ({recordDepartures.length})
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-between">
          <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
            <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--value-text)]" />
            Top Inbound Investment
          </span>
          <span className="font-bold text-[var(--value-text)] tabular-nums">
            {formatCompactEur(totalArrivalsSpend)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-between">
          <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--trend-positive)]" />
            Top Outbound Realized
          </span>
          <span className="font-bold text-[var(--trend-positive)] tabular-nums">
            {formatCompactEur(totalDeparturesIncome)}
          </span>
        </div>
      </div>

      {/* Mobile Stacked Cards (<md) */}
      <div className="md:hidden space-y-2">
        {activeList.map((t, index) => {
          const p = t.player;
          const extId = p ? (p.sourceId || p.externalId || p.id) : null;
          const slug = p
            ? p.slug || `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`
            : null;
          const counterparty = activeTab === "arrivals" ? t.fromClubName : t.toClubName;
          const feeInfo = formatTransferFee(t.feeEur, t.transferType);

          return (
            <div
              key={t.id}
              className="p-3 rounded-xl bg-[var(--bg-elevated)] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center font-bold text-[var(--text-muted)] tabular-nums">
                    #{index + 1}
                  </span>
                  {p && slug ? (
                    <Link href={`/players/${slug}`} className="flex items-center gap-2 group">
                      <div className="relative w-6 h-6 rounded-lg bg-[var(--bg-page)] overflow-hidden shrink-0">
                        <EntityImage
                          src={p.photoUrl}
                          alt={p.fullName}
                          fill
                          sizes="24px"
                          entityType="player"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[var(--text-primary)] font-bold group-hover:text-[var(--accent)] transition-colors truncate max-w-[150px]">
                        {p.commonName || p.fullName}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-[var(--text-secondary)] font-medium">Unknown Player</span>
                  )}
                </div>

                <span className="px-2 py-0.5 rounded bg-[var(--bg-chip)] text-[10px] font-semibold text-[var(--text-secondary)]">
                  {p?.position || "Player"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--divider)] text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span className="truncate text-[var(--text-muted)]">
                    {counterparty || "Direct / Open Market"}
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`font-black tabular-nums whitespace-nowrap text-sm ${
                      feeInfo.isAmount
                        ? activeTab === "arrivals"
                          ? "text-[var(--value-text)]"
                          : "text-[var(--trend-positive)]"
                        : "text-[var(--text-muted)] text-xs font-semibold"
                    }`}
                  >
                    {feeInfo.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop & Tablet Full Table (md+) with Sticky First Column */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--divider)] text-[10px] font-bold">
              <th className="pb-2.5 w-8 font-bold text-center sticky left-0 bg-[var(--bg-card)] z-10">#</th>
              <th className="pb-2.5 font-bold sticky left-8 bg-[var(--bg-card)] z-10 pr-4">Player</th>
              <th className="pb-2.5 font-bold">Position</th>
              <th className="pb-2.5 font-bold">
                {activeTab === "arrivals" ? "Signed From" : "Sold To"}
              </th>
              <th className="pb-2.5 font-bold">Date</th>
              <th className="pb-2.5 text-right font-bold">Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--divider)]">
            {activeList.map((t, index) => {
              const p = t.player;
              const extId = p ? (p.sourceId || p.externalId || p.id) : null;
              const slug = p
                ? p.slug ||
                  `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`
                : null;
              const counterparty =
                activeTab === "arrivals" ? t.fromClubName : t.toClubName;

              return (
                <tr
                  key={t.id}
                  className="hover:bg-[var(--bg-hover)] transition-colors group"
                >
                  <td className="py-2.5 text-center font-bold text-[var(--text-muted)] tabular-nums sticky left-0 bg-[var(--bg-card)] z-10">
                    {index + 1}
                  </td>
                  <td className="py-2.5 pr-4 sticky left-8 bg-[var(--bg-card)] z-10">
                    {p && slug ? (
                      <Link
                        href={`/players/${slug}`}
                        className="flex items-center gap-2.5"
                      >
                        <div className="relative w-7 h-7 rounded-lg bg-[var(--bg-page)] overflow-hidden shrink-0">
                          <EntityImage
                            src={p.photoUrl}
                            alt={p.fullName}
                            fill
                            sizes="28px"
                            entityType="player"
                            className="object-cover"
                          />
                        </div>
                        <span className="text-[var(--text-primary)] font-semibold group-hover:text-[var(--accent)] transition-colors whitespace-nowrap">
                          {p.commonName || p.fullName}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-[var(--text-secondary)] font-medium">
                        Unknown Player
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-[var(--text-secondary)]">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--bg-chip)] text-[11px] font-medium whitespace-nowrap">
                      {p?.position || "Player"}
                    </span>
                  </td>
                  <td className="py-2.5 text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {counterparty || "Direct / Open Market"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-[var(--text-muted)] tabular-nums whitespace-nowrap">
                    {formatDate(t.date)}
                  </td>
                  <td className="py-2.5 text-right font-bold whitespace-nowrap text-sm tabular-nums">
                    {(() => {
                      const feeInfo = formatTransferFee(t.feeEur, t.transferType);
                      return (
                        <span
                          className={
                            feeInfo.isAmount
                              ? activeTab === "arrivals"
                                ? "text-[var(--value-text)]"
                                : "text-[var(--trend-positive)]"
                              : "text-[var(--text-muted)] text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-chip)]"
                          }
                        >
                          {feeInfo.label}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--divider)]">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--value-text)]" />
          Documented Commercial Ledger
        </span>
        <span>Excludes internal youth academy progressions</span>
      </div>
    </Card>
  );
}
