"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { isYouthMove, formatTransferFee } from "@/lib/transfers";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui";

interface TransferItem {
  id: string;
  fromClubName?: string | null;
  toClubName?: string | null;
  date: string | Date;
  feeEur?: number | null;
  transferType?: string | null;
}

interface TransfersTableProps {
  transfers: TransferItem[];
}

export function TransfersTable({ transfers }: TransfersTableProps) {
  const [filter, setFilter] = useState<"all" | "senior">("senior");

  if (!transfers || transfers.length === 0) {
    return (
      <Card className="p-6 text-center text-xs text-[var(--text-muted)]">
        No recorded transfers for this player.
      </Card>
    );
  }

  const youthCount = transfers.filter((t) =>
    isYouthMove(t.fromClubName, t.toClubName, t.transferType)
  ).length;

  const displayedTransfers =
    filter === "senior"
      ? transfers.filter(
          (t) => !isYouthMove(t.fromClubName, t.toClubName, t.transferType)
        )
      : transfers;

  return (
    <Card className="p-4 sm:p-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--divider)] gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
            Transfer History
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Career moves, loan spells, and record fees
          </p>
        </div>

        {youthCount > 0 && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-page)] text-xs">
            <button
              type="button"
              onClick={() => setFilter("senior")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === "senior"
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Senior Only
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              All Moves ({transfers.length})
            </button>
          </div>
        )}
      </div>

      <div className="mt-3">
        {displayedTransfers.length === 0 ? (
          <div className="py-6 text-center text-[var(--text-muted)] text-xs">
            No senior transfers recorded. (All moves were internal academy promotions)
          </div>
        ) : (
          <>
            {/* Mobile Stacked Cards (<md) */}
            <div className="md:hidden space-y-2.5">
              {displayedTransfers.map((t) => {
                const feeInfo = formatTransferFee(t.feeEur, t.transferType);
                const isYouth = isYouthMove(t.fromClubName, t.toClubName, t.transferType);

                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-[var(--bg-elevated)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatDate(t.date)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--bg-chip)] text-[10px] font-semibold text-[var(--text-secondary)]">
                        {isYouth ? "Promotion" : t.transferType || "Transfer"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="truncate text-[var(--text-secondary)] font-medium">
                          {t.fromClubName || "Unknown"}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                        <span className="truncate text-[var(--text-primary)] font-bold">
                          {t.toClubName || "Unknown"}
                        </span>
                        {isYouth && (
                          <span
                            title="Academy / Youth Move"
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-[var(--bg-chip)] text-[var(--value-text)] shrink-0"
                          >
                            <GraduationCap className="w-2.5 h-2.5" />
                            Youth
                          </span>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`font-black tabular-nums whitespace-nowrap ${
                            feeInfo.isAmount ? "text-[var(--value-text)] text-sm" : "text-[var(--text-muted)] text-xs font-normal"
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
                  <tr className="text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--divider)] text-[11px] font-bold">
                    <th className="pb-2.5 font-bold sticky left-0 bg-[var(--bg-card)] z-10 pr-4">Date</th>
                    <th className="pb-2.5 font-bold">From Club</th>
                    <th className="pb-2.5 text-center"></th>
                    <th className="pb-2.5 font-bold">To Club</th>
                    <th className="pb-2.5 font-bold text-right">Fee</th>
                    <th className="pb-2.5 font-bold text-right">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--divider)]">
                  {displayedTransfers.map((t) => {
                    const feeInfo = formatTransferFee(t.feeEur, t.transferType);
                    const isYouth = isYouthMove(t.fromClubName, t.toClubName, t.transferType);

                    return (
                      <tr key={t.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="py-2.5 text-[var(--text-secondary)] font-medium whitespace-nowrap sticky left-0 bg-[var(--bg-card)] z-10 pr-4">
                          {formatDate(t.date)}
                        </td>
                        <td className="py-2.5 text-[var(--text-secondary)] font-medium truncate max-w-[140px]">
                          {t.fromClubName || "Unknown"}
                        </td>
                        <td className="py-2.5 text-center text-[var(--text-muted)] px-2">
                          <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                        </td>
                        <td className="py-2.5 text-[var(--text-primary)] font-semibold truncate max-w-[140px]">
                          <div className="flex items-center gap-1.5">
                            <span>{t.toClubName || "Unknown"}</span>
                            {isYouth && (
                              <span
                                title="Academy / Youth Move"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-chip)] text-[var(--value-text)]"
                              >
                                <GraduationCap className="w-2.5 h-2.5" />
                                Youth
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          className={`py-2.5 text-right font-bold whitespace-nowrap tabular-nums ${
                            feeInfo.isAmount ? "text-[var(--value-text)]" : "text-[var(--text-muted)] font-normal"
                          }`}
                        >
                          {feeInfo.label}
                        </td>
                        <td className="py-2.5 text-right text-[var(--text-muted)] capitalize whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-[var(--bg-chip)] text-[11px] text-[var(--text-secondary)] font-medium">
                            {isYouth ? "Promotion" : t.transferType || "Transfer"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
