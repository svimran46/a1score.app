import { Card } from "@/components/ui";

interface SeasonStatItem {
  id: string;
  season: string;
  competition: string;
  clubName: string;
  appearances?: number | null;
  goals?: number | null;
  assists?: number | null;
  minutesPlayed?: number | null;
  yellowCards?: number | null;
  redCards?: number | null;
  rating?: number | null;
}

interface StatsTableProps {
  stats: SeasonStatItem[];
}

export function StatsTable({ stats }: StatsTableProps) {
  if (!stats || stats.length === 0) {
    return null;
  }

  const hasRating = stats.some((s) => typeof s.rating === "number" && s.rating > 0);

  return (
    <Card className="p-4 sm:p-5 overflow-hidden">
      <div className="pb-3 border-b border-[var(--divider)]">
        <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
          Career & Season Statistics
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Competition breakdowns and performance records
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs tabular-nums">
          <thead>
            <tr className="text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--divider)] text-[11px] font-bold">
              <th className="pb-2.5 font-bold">Season</th>
              <th className="pb-2.5 font-bold">Competition</th>
              <th className="pb-2.5 font-bold">Club</th>
              <th className="pb-2.5 text-center font-bold">Apps</th>
              <th className="pb-2.5 text-center font-bold text-[var(--trend-positive)]">Goals</th>
              <th className="pb-2.5 text-center font-bold text-[var(--accent)]">Assists</th>
              {hasRating ? (
                <th className="pb-2.5 text-center font-bold text-[var(--value-text)]">Rating</th>
              ) : (
                <>
                  <th className="pb-2.5 text-center font-bold text-[var(--value-text)]">YC</th>
                  <th className="pb-2.5 text-center font-bold text-[var(--trend-negative)]">RC</th>
                </>
              )}
              <th className="pb-2.5 text-right font-bold">Mins</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--divider)]">
            {stats.map((s) => (
              <tr key={s.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                <td className="py-2.5 text-[var(--text-primary)] font-medium whitespace-nowrap">{s.season}</td>
                <td className="py-2.5 text-[var(--text-secondary)] truncate max-w-[140px]">{s.competition}</td>
                <td className="py-2.5 text-[var(--text-secondary)] truncate max-w-[130px]">{s.clubName}</td>
                <td className="py-2.5 text-center text-[var(--text-primary)] font-semibold">{s.appearances ?? "-"}</td>
                <td className="py-2.5 text-center text-[var(--trend-positive)] font-bold">{s.goals ?? 0}</td>
                <td className="py-2.5 text-center text-[var(--accent)] font-bold">{s.assists ?? 0}</td>
                {hasRating ? (
                  <td className="py-2.5 text-center">
                    {s.rating ? (
                      <span className="px-2 py-0.5 rounded-lg font-bold text-[var(--value-text)] figure bg-[var(--bg-chip)]">
                        {s.rating.toFixed(2)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                ) : (
                  <>
                    <td className="py-2.5 text-center text-[var(--value-text)] font-semibold">{s.yellowCards ?? 0}</td>
                    <td className="py-2.5 text-center text-[var(--trend-negative)] font-semibold">{s.redCards ?? 0}</td>
                  </>
                )}
                <td className="py-2.5 text-right text-[var(--text-muted)] whitespace-nowrap">
                  {s.minutesPlayed ? `${s.minutesPlayed}'` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
