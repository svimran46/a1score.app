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
}

interface StatsTableProps {
  stats: SeasonStatItem[];
}

export function StatsTable({ stats }: StatsTableProps) {
  if (!stats || stats.length === 0) {
    return (
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 text-center text-slate-500 text-xs">
        No detailed season stats recorded.
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Career Statistics</h3>
          <p className="text-xs text-slate-400 mt-0.5">Season-by-season competition breakdowns</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
              <th className="pb-3 font-semibold">Season</th>
              <th className="pb-3 font-semibold">Competition</th>
              <th className="pb-3 font-semibold">Club</th>
              <th className="pb-3 text-center font-semibold">Apps</th>
              <th className="pb-3 text-center font-semibold text-emerald-400">Goals</th>
              <th className="pb-3 text-center font-semibold text-blue-400">Assists</th>
              <th className="pb-3 text-center font-semibold text-amber-400">YC</th>
              <th className="pb-3 text-center font-semibold text-red-400">RC</th>
              <th className="pb-3 text-right font-semibold">Mins</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {stats.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 text-white font-medium whitespace-nowrap">{s.season}</td>
                <td className="py-2.5 text-slate-300 truncate max-w-[130px]">{s.competition}</td>
                <td className="py-2.5 text-slate-300 truncate max-w-[130px]">{s.clubName}</td>
                <td className="py-2.5 text-center text-slate-200 font-semibold">{s.appearances ?? "-"}</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">{s.goals ?? 0}</td>
                <td className="py-2.5 text-center text-blue-400 font-bold">{s.assists ?? 0}</td>
                <td className="py-2.5 text-center text-amber-400">{s.yellowCards ?? 0}</td>
                <td className="py-2.5 text-center text-red-400">{s.redCards ?? 0}</td>
                <td className="py-2.5 text-right text-slate-400 whitespace-nowrap">
                  {s.minutesPlayed ? `${s.minutesPlayed}'` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
