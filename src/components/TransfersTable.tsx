import { formatCompactEur, formatDate } from "@/lib/utils";
import { ArrowRight, ArrowUpRight } from "lucide-react";

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
  if (!transfers || transfers.length === 0) {
    return (
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 text-center text-slate-500 text-xs">
        No recorded transfers for this player.
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Transfer History</h3>
          <p className="text-xs text-slate-400 mt-0.5">Career moves, loan spells, and record fees</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
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
            {transfers.map((t) => (
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
                  {t.toClubName || "Unknown"}
                </td>
                <td className="py-3 text-right text-emerald-400 font-bold whitespace-nowrap">
                  {t.feeEur ? formatCompactEur(t.feeEur) : "Free / Undisclosed"}
                </td>
                <td className="py-3 text-right text-slate-400 capitalize whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700/50">
                    {t.transferType || "Transfer"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
