"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { EntityImage } from "@/components/EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getClubSlug } from "@/lib/slugs";
import { ArrowUpDown, Trophy, Calendar, Sparkles } from "lucide-react";
import type { LeagueLegendItem } from "@/lib/fotmob/client";

export interface LeagueStandingsRowData {
  idx: number;
  id: number;
  name: string;
  shortName?: string;
  clubId?: string | null;
  imageUrl?: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  scoresStr: string;
  goalsFor?: number;
  goalsAgainst?: number;
  goalConDiff: number;
  pts: number;
  totalSquadValue: number;
  squadSize?: number;
  qualColor?: string;
  form?: Array<{
    result: string;
    score: string;
    opponent: string;
    isHome: boolean;
  }>;
  nextMatch?: {
    opponent: string;
    opponentId?: string | number;
    matchId?: string;
    date?: string;
    isHome?: boolean;
  } | null;
}

interface LeagueStandingsTableProps {
  standings: LeagueStandingsRowData[];
  leagueName: string;
  season?: string;
  legend?: LeagueLegendItem[];
}

type SortField = "points" | "value" | "gd" | "played";

export function LeagueStandingsTable({
  standings,
  leagueName,
  season = "2026/2027",
  legend = [],
}: LeagueStandingsTableProps) {
  const [sortField, setSortField] = useState<SortField>("points");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for numeric ranking
    }
  };

  const sortedRows = useMemo(() => {
    const list = [...standings];
    list.sort((a, b) => {
      let diff = 0;
      if (sortField === "points") {
        diff = b.pts - a.pts || b.goalConDiff - a.goalConDiff || b.totalSquadValue - a.totalSquadValue;
      } else if (sortField === "value") {
        diff = (b.totalSquadValue || 0) - (a.totalSquadValue || 0) || b.pts - a.pts;
      } else if (sortField === "gd") {
        diff = b.goalConDiff - a.goalConDiff || b.pts - a.pts;
      } else if (sortField === "played") {
        diff = b.played - a.played || b.pts - a.pts;
      }
      return sortAsc ? -diff : diff;
    });
    return list;
  }, [standings, sortField, sortAsc]);

  // Compute fallback legend if none provided by FotMob
  const activeLegend = useMemo(() => {
    if (legend && legend.length > 0) return legend;
    return [
      { title: "Champions League", tKey: "ucl", color: "#2AD572", indices: [0, 1, 2, 3] },
      { title: "Europa League", tKey: "uel", color: "#0046A7", indices: [4] },
      { title: "Relegation Zone", tKey: "rel", color: "#FF4646", indices: [17, 18, 19] },
    ];
  }, [legend]);

  return (
    <section className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4" aria-labelledby="standings-heading">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="standings-heading" className="text-lg font-bold text-white tracking-tight">
              Competition Standings & Squad Capital
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Season {season}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized match performance and Transfermarkt squad market valuations
          </p>
        </div>

        {/* View / Sort Toggles */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Sort table:</span>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => handleSort("points")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortField === "points"
                  ? "bg-amber-400 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              aria-label="Sort by League Points"
            >
              League Points
            </button>
            <button
              onClick={() => handleSort("value")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sortField === "value"
                  ? "bg-amber-400 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
              }`}
              aria-label="Sort by Squad Market Value"
            >
              <Sparkles className="w-3 h-3" />
              Squad Value
            </button>
          </div>
        </div>
      </div>

      {/* Table Container with Sticky Header */}
      <div
        className="overflow-x-auto max-h-[700px] relative rounded-xl border border-slate-800/80"
        role="region"
        aria-label={`${leagueName} Standings and Valuations Table`}
        tabIndex={0}
      >
        <table className="w-full text-left text-xs min-w-[760px]">
          <caption className="sr-only">
            {leagueName} Standings and Squad Market Values for Season {season}
          </caption>
          <thead className="sticky top-0 bg-slate-950/95 backdrop-blur z-10 border-b border-slate-800">
            <tr className="text-slate-400 uppercase tracking-wider text-[11px]">
              <th scope="col" className="py-3 px-2 w-12 text-center font-semibold">
                #
              </th>
              <th scope="col" className="py-3 px-3 font-semibold min-w-[180px]">
                Club
              </th>
              <th
                scope="col"
                onClick={() => handleSort("played")}
                className="py-3 px-2 text-center font-semibold cursor-pointer hover:text-white transition-colors"
                title="Matches Played"
              >
                P
              </th>
              <th scope="col" className="py-3 px-2 text-center font-semibold" title="Wins">
                W
              </th>
              <th scope="col" className="py-3 px-2 text-center font-semibold" title="Draws">
                D
              </th>
              <th scope="col" className="py-3 px-2 text-center font-semibold" title="Losses">
                L
              </th>
              <th scope="col" className="py-3 px-2 text-center font-semibold" title="Goals For">
                GF
              </th>
              <th scope="col" className="py-3 px-2 text-center font-semibold" title="Goals Against">
                GA
              </th>
              <th
                scope="col"
                onClick={() => handleSort("gd")}
                className="py-3 px-2 text-center font-semibold cursor-pointer hover:text-white transition-colors"
                title="Goal Difference"
              >
                GD
              </th>
              <th
                scope="col"
                onClick={() => handleSort("value")}
                className="py-3 px-3 text-right font-semibold cursor-pointer hover:text-amber-400 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Squad Value</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th scope="col" className="py-3 px-3 text-center font-semibold min-w-[120px]">
                Recent Form
              </th>
              <th scope="col" className="py-3 px-3 text-left font-semibold min-w-[120px]">
                Next Match
              </th>
              <th
                scope="col"
                onClick={() => handleSort("points")}
                className="py-3 px-3 text-right font-bold text-white cursor-pointer hover:text-amber-400 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Pts</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sortedRows.map((row) => {
              const gf = row.goalsFor ?? (row.scoresStr ? Number(row.scoresStr.split("-")[0]) : 0);
              const ga = row.goalsAgainst ?? (row.scoresStr ? Number(row.scoresStr.split("-")[1]) : 0);

              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Position with Qualification Color Indicator */}
                  <td className="py-3 px-2 text-center font-bold text-slate-400 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {row.qualColor ? (
                        <span
                          className="w-1.5 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: row.qualColor }}
                          title="Qualification/Relegation Zone"
                        />
                      ) : (
                        <span className="w-1.5 h-4" />
                      )}
                      <span className="tabular-nums w-4 text-center">{row.idx}</span>
                    </div>
                  </td>

                  {/* Club Name & Crest */}
                  <td className="py-3 px-3 pr-4">
                    {row.clubId ? (
                      <Link
                        href={`/clubs/${getClubSlug({ id: row.clubId, name: row.name })}`}
                        className="flex items-center gap-2.5 group-hover:text-amber-400 transition-colors"
                      >
                        <div className="relative w-6 h-6 rounded-md bg-slate-800 p-0.5 flex-shrink-0 overflow-hidden">
                          <EntityImage
                            src={row.imageUrl}
                            alt=""
                            fill
                            sizes="24px"
                            entityType="club"
                            className="object-contain"
                          />
                        </div>
                        <span className="text-white font-semibold group-hover:text-amber-400 transition-colors truncate max-w-[180px]">
                          {row.name}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-6 h-6 rounded-md bg-slate-800 p-0.5 flex-shrink-0 overflow-hidden">
                          <EntityImage
                            src={row.imageUrl}
                            alt=""
                            fill
                            sizes="24px"
                            entityType="club"
                            className="object-contain"
                          />
                        </div>
                        <span className="text-white font-semibold truncate max-w-[180px]">
                          {row.name}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Played */}
                  <td className="py-3 px-2 text-center text-slate-300 tabular-nums">
                    {row.played}
                  </td>

                  {/* Wins */}
                  <td className="py-3 px-2 text-center text-slate-300 tabular-nums">
                    {row.wins}
                  </td>

                  {/* Draws */}
                  <td className="py-3 px-2 text-center text-slate-400 tabular-nums">
                    {row.draws}
                  </td>

                  {/* Losses */}
                  <td className="py-3 px-2 text-center text-slate-400 tabular-nums">
                    {row.losses}
                  </td>

                  {/* GF */}
                  <td className="py-3 px-2 text-center text-slate-300 tabular-nums">
                    {gf}
                  </td>

                  {/* GA */}
                  <td className="py-3 px-2 text-center text-slate-400 tabular-nums">
                    {ga}
                  </td>

                  {/* GD */}
                  <td className="py-3 px-2 text-center font-medium tabular-nums">
                    <span
                      className={
                        row.goalConDiff > 0
                          ? "text-emerald-400"
                          : row.goalConDiff < 0
                          ? "text-rose-400"
                          : "text-slate-400"
                      }
                    >
                      {row.goalConDiff > 0 ? `+${row.goalConDiff}` : row.goalConDiff}
                    </span>
                  </td>

                  {/* Squad Value */}
                  <td className="py-3 px-3 text-right text-amber-400 font-bold whitespace-nowrap tabular-nums">
                    {row.totalSquadValue > 0 ? formatCompactEur(row.totalSquadValue) : "N/A"}
                  </td>

                  {/* Recent Form (Last 5) */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {row.form && row.form.length > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        {row.form.map((f, fIdx) => {
                          const bg =
                            f.result === "W"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : f.result === "D"
                              ? "bg-slate-700/50 text-slate-300 border-slate-600/30"
                              : "bg-rose-500/20 text-rose-400 border-rose-500/30";
                          return (
                            <span
                              key={fIdx}
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold border ${bg}`}
                              title={`${f.result}: ${f.score} vs ${f.opponent} (${f.isHome ? "H" : "A"})`}
                            >
                              {f.result}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Next Match */}
                  <td className="py-3 px-3 text-left whitespace-nowrap text-[11px]">
                    {row.nextMatch ? (
                      <div className="flex items-center gap-1.5" title={`Next: vs ${row.nextMatch.opponent}`}>
                        <span className="text-slate-300 truncate max-w-[90px]">
                          {row.nextMatch.opponent}
                        </span>
                        <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                          {row.nextMatch.isHome ? "H" : "A"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Pts */}
                  <td className="py-3 px-3 text-right text-white font-black text-sm tabular-nums">
                    {row.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend for Qualification & Relegation Zones */}
      {activeLegend.length > 0 && (
        <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 border-t border-slate-800/60">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
            Zone Legend:
          </span>
          {activeLegend.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.title}</span>
            </div>
          ))}
          <span className="ml-auto text-[11px] text-slate-500">
            Click column headers to sort
          </span>
        </div>
      )}
    </section>
  );
}
