import { formatDate } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface InjuryItem {
  id: string;
  type: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  status: string;
}

interface InjuriesTableProps {
  injuries: InjuryItem[];
}

export function InjuriesTable({ injuries }: InjuriesTableProps) {
  if (!injuries || injuries.length === 0) {
    return (
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 text-center text-slate-500 text-xs">
        No recorded injuries for this player.
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Injury History</h3>
          <p className="text-xs text-slate-400 mt-0.5">Medical absence records and recovery timeline</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
              <th className="pb-3 font-semibold">Injury Type</th>
              <th className="pb-3 font-semibold">From</th>
              <th className="pb-3 font-semibold">Until</th>
              <th className="pb-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {injuries.map((injury) => {
              const isActive = injury.status?.toLowerCase() === "active" || !injury.endDate;
              return (
                <tr key={injury.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 text-white font-medium">{injury.type}</td>
                  <td className="py-2.5 text-slate-300 whitespace-nowrap">{formatDate(injury.startDate)}</td>
                  <td className="py-2.5 text-slate-300 whitespace-nowrap">{injury.endDate ? formatDate(injury.endDate) : "Ongoing"}</td>
                  <td className="py-2.5 text-right">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Recovered
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
