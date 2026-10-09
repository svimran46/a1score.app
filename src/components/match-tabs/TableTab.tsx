"use client";

import { EntityImage } from "@/components/EntityImage";
import { Trophy } from "lucide-react";

interface TableTabProps {
  match: any;
}

export function TableTab({ match }: TableTabProps) {
  const { table = {}, teams = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};
  const standings = table?.standings || [];

  if (!table?.hasTable || standings.length === 0) {
    return (
      <div className="rounded-3xl border border-divider bg-bg-card/60 backdrop-blur-xl p-8 sm:p-12 text-center space-y-3 shadow-xl">
        <Trophy className="w-10 h-10 text-text-muted mx-auto" />
        <h4 className="text-base font-bold text-text-primary">Standings Unavailable</h4>
        <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto leading-relaxed">
          Standings table is not applicable for this fixture or competition format.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-divider bg-bg-card/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-divider/80">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-value-text" />
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            {table.leagueName || "Group / League Standings"}
          </h3>
        </div>
        <span className="text-[11px] text-text-muted">Current Table</span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-xs sm:text-sm text-left">
          <thead>
            <tr className="border-b border-divider text-[11px] uppercase tracking-wider text-text-muted">
              <th className="py-2.5 px-2 text-center w-8">#</th>
              <th className="py-2.5 px-3">Team</th>
              <th className="py-2.5 px-2 text-center w-8">P</th>
              <th className="py-2.5 px-2 text-center w-8">W</th>
              <th className="py-2.5 px-2 text-center w-8">D</th>
              <th className="py-2.5 px-2 text-center w-8">L</th>
              <th className="py-2.5 px-2 text-center w-10">GD</th>
              <th className="py-2.5 px-3 text-right font-black w-10 text-text-primary">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider/60 font-medium">
            {standings.map((row: any) => {
              const isHome = row.id === homeTeam?.id || row.name === homeTeam?.name;
              const isAway = row.id === awayTeam?.id || row.name === awayTeam?.name;
              const isCurrentFixture = isHome || isAway;

              return (
                <tr
                  key={row.id || row.idx}
                  className={`transition-colors ${
                    isCurrentFixture
                      ? "bg-accent/10 text-value-text font-bold"
                      : "text-text-secondary hover:bg-bg-chip/40"
                  }`}
                >
                  {/* Position */}
                  <td className="py-3 px-2 text-center tabular-nums">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${
                        row.idx <= 4
                          ? "bg-trend-up/15 text-trend-up border border-trend-up/30"
                          : "text-text-muted"
                      }`}
                    >
                      {row.idx}
                    </span>
                  </td>

                  {/* Team Name + Crest */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 rounded bg-bg-chip p-0.5 shrink-0 flex items-center justify-center">
                        <EntityImage
                          src={row.imageUrl}
                          alt={row.name}
                          width={20}
                          height={20}
                          entityType="club"
                          className="object-contain"
                        />
                      </div>
                      <span className="truncate">{row.name}</span>
                      {isCurrentFixture && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent/20 text-value-text border border-accent/30">
                          Match
                        </span>
                      )}
                    </div>
                  </td>

                  {/* P, W, D, L, GD, PTS */}
                  <td className="py-3 px-2 text-center tabular-nums text-text-muted">
                    {row.played}
                  </td>
                  <td className="py-3 px-2 text-center tabular-nums text-text-muted">
                    {row.wins}
                  </td>
                  <td className="py-3 px-2 text-center tabular-nums text-text-muted">
                    {row.draws}
                  </td>
                  <td className="py-3 px-2 text-center tabular-nums text-text-muted">
                    {row.losses}
                  </td>
                  <td className="py-3 px-2 text-center tabular-nums font-mono text-text-secondary">
                    {row.goalConDiff > 0 ? `+${row.goalConDiff}` : row.goalConDiff}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-black text-text-primary text-sm">
                    {row.pts}
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
