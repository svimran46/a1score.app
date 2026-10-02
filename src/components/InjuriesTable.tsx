import { formatDate } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui";

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
    return null;
  }

  return (
    <Card className="p-4 sm:p-5 overflow-hidden">
      <div className="pb-3 border-b border-[var(--divider)]">
        <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
          Injury History
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Absence records and recovery timeline
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--divider)] text-[11px] font-bold">
              <th className="pb-2.5 font-bold">Injury Type</th>
              <th className="pb-2.5 font-bold">From</th>
              <th className="pb-2.5 font-bold">Until</th>
              <th className="pb-2.5 text-right font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--divider)]">
            {injuries.map((injury) => {
              const isActive = injury.status?.toLowerCase() === "active" || !injury.endDate;
              return (
                <tr key={injury.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="py-2.5 text-[var(--text-primary)] font-medium">{injury.type}</td>
                  <td className="py-2.5 text-[var(--text-secondary)] whitespace-nowrap">{formatDate(injury.startDate)}</td>
                  <td className="py-2.5 text-[var(--text-secondary)] whitespace-nowrap">{injury.endDate ? formatDate(injury.endDate) : "Ongoing"}</td>
                  <td className="py-2.5 text-right">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--trend-negative)]/10 text-[var(--trend-negative)]">
                        <AlertCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--trend-positive)]/10 text-[var(--trend-positive)]">
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
    </Card>
  );
}
