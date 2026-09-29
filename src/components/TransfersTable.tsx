"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { isYouthMove, formatTransferFee } from "@/lib/transfers";
import { ArrowRight, GraduationCap, ArrowUpRight } from "lucide-react";

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
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 text-center text-slate-500 text-xs">
        No recorded transfers for this player.
      </div>
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
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Transfer History</h3>
          <p className="text-xs text-slate-400 mt-0.5">Career moves, loan spells, and record fees</p>
        </div>

        {youthCount > 0 && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilter("senior")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filter === "senior"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Senior Only
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filter === "all"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Moves ({transfers.length})
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        {displayedTransfers.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No senior transfers recorded. (All moves were internal academy promotions)
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">From Club</th>
                <th className="pb-3 text-center"></th>
                <th className="pb-3 font-semibold">To Club</th>
                <th className="pb-3 font-semibold text-right">Fee</th>
                <th className="pb-3 font-semibold text-right">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {displayedTransfers.map((t) => {
                const feeInfo = formatTransferFee(t.feeEur, t.transferType);
                const isYouth = isYouthMove(t.fromClubName, t.toClubName, t.transferType);

                return (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-slate-300 font-medium whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="py-3 text-slate-300 font-medium truncate max-w-[140px]">
                      {t.fromClubName || "Unknown"}
                    </td>
                    <td className="py-3 text-center text-slate-500 px-2">
                      <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                    </td>
                    <td className="py-3 text-white font-semibold truncate max-w-[140px]">
                      <div className="flex items-center gap-1.5">
                        <span>{t.toClubName || "Unknown"}</span>
                        {isYouth && (
                          <span
                            title="Academy / Youth Move"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          >
                            <GraduationCap className="w-2.5 h-2.5" />
                            Youth
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className={`py-3 text-right font-bold whitespace-nowrap ${
                        feeInfo.isAmount ? "text-emerald-400" : "text-slate-400 font-normal"
                      }`}
                    >
                      {feeInfo.label}
                    </td>
                    <td className="py-3 text-right text-slate-400 capitalize whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700/50">
                        {isYouth ? "Promotion" : t.transferType || "Transfer"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
