"use client";

import { useMemo } from "react";
import { History, Shield, Calendar } from "lucide-react";
import { EntityImage } from "@/components/EntityImage";

interface H2HTabProps {
  match: any;
}

export function H2HTab({ match }: H2HTabProps) {
  const { h2h = {}, teamForm = {}, teams = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  const summary = h2h?.summary || [0, 0, 0];
  const [homeWins, draws, awayWins] = summary;
  const totalMeetings = homeWins + draws + awayWins;

  const pastMatches = useMemo(() => {
    return (h2h?.matches || []).filter((m: any) => m.finished || m.status?.finished);
  }, [h2h?.matches]);

  const homeFormList: any[] = teamForm?.[0] || teamForm?.home || [];
  const awayFormList: any[] = teamForm?.[1] || teamForm?.away || [];

  const getFormColor = (resStr: string) => {
    const r = resStr?.toUpperCase();
    if (r === "W") return "bg-emerald-500 text-white";
    if (r === "D") return "bg-slate-500 text-white";
    if (r === "L") return "bg-rose-500 text-white";
    return "bg-slate-700 text-slate-300";
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Recent Form (Last 5 Games) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Form (Last 5 Fixtures)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">All Competitions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Home Team Form */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs sm:text-sm truncate">
                {homeTeam?.name || "Home"}
              </span>
              <div className="flex items-center gap-1.5">
                {homeFormList.slice(-5).map((item: any, idx: number) => (
                  <span
                    key={idx}
                    title={`${item.tooltipText?.homeTeam} ${item.score} ${item.tooltipText?.awayTeam}`}
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${getFormColor(
                      item.resultString
                    )}`}
                  >
                    {item.resultString || "—"}
                  </span>
                ))}
              </div>
            </div>
            {homeFormList.length > 0 && (
              <div className="text-[11px] text-slate-400 divide-y divide-slate-800/60 pt-1">
                {homeFormList.slice(-3).map((item: any, idx: number) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between">
                    <span className="truncate">
                      vs {item.home?.isOurTeam ? item.away?.name : item.home?.name}
                    </span>
                    <span className="font-mono font-bold text-slate-300 ml-2">{item.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Away Team Form */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs sm:text-sm truncate">
                {awayTeam?.name || "Away"}
              </span>
              <div className="flex items-center gap-1.5">
                {awayFormList.slice(-5).map((item: any, idx: number) => (
                  <span
                    key={idx}
                    title={`${item.tooltipText?.homeTeam} ${item.score} ${item.tooltipText?.awayTeam}`}
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${getFormColor(
                      item.resultString
                    )}`}
                  >
                    {item.resultString || "—"}
                  </span>
                ))}
              </div>
            </div>
            {awayFormList.length > 0 && (
              <div className="text-[11px] text-slate-400 divide-y divide-slate-800/60 pt-1">
                {awayFormList.slice(-3).map((item: any, idx: number) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between">
                    <span className="truncate">
                      vs {item.home?.isOurTeam ? item.away?.name : item.home?.name}
                    </span>
                    <span className="font-mono font-bold text-slate-300 ml-2">{item.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Head-to-Head Historical Summary Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Head to Head Record
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {totalMeetings > 0 ? `${totalMeetings} Past Meetings` : "No Prior Record"}
          </span>
        </div>

        {totalMeetings > 0 ? (
          <div className="space-y-3 pt-1">
            {/* Wins, Draws, Losses count */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <span className="text-emerald-400">
                {homeTeam?.name}: {homeWins} {homeWins === 1 ? "Win" : "Wins"}
              </span>
              <span className="text-slate-400">
                {draws} {draws === 1 ? "Draw" : "Draws"}
              </span>
              <span className="text-blue-400">
                {awayTeam?.name}: {awayWins} {awayWins === 1 ? "Win" : "Wins"}
              </span>
            </div>

            {/* Tri-color summary bar */}
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(homeWins / totalMeetings) * 100}%` }}
                title={`${homeTeam?.name} Wins: ${homeWins}`}
              />
              <div
                className="h-full bg-slate-600 transition-all duration-300"
                style={{ width: `${(draws / totalMeetings) * 100}%` }}
                title={`Draws: ${draws}`}
              />
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(awayWins / totalMeetings) * 100}%` }}
                title={`${awayTeam?.name} Wins: ${awayWins}`}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-2">
            No historical head-to-head encounters found.
          </p>
        )}
      </div>

      {/* 3. Previous Encounters List */}
      {pastMatches.length > 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Previous Meetings
            </h3>
            <span className="text-[11px] text-slate-400">{pastMatches.length} Matches</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {pastMatches.map((m: any, idx: number) => {
              const matchDateStr = m.time?.utcTime
                ? new Date(m.time.utcTime).toLocaleDateString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Past Meeting";

              return (
                <div
                  key={m.matchUrl || idx}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm hover:bg-slate-800/20 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{matchDateStr}</span>
                    {m.league?.name && (
                      <span className="truncate max-w-[160px] text-slate-500">
                        • {m.league.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 font-semibold">
                    <span
                      className={`truncate max-w-[130px] ${
                        m.home?.name === homeTeam?.name ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {m.home?.name}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono font-black text-white text-xs">
                      {m.status?.scoreStr || "FT"}
                    </span>
                    <span
                      className={`truncate max-w-[130px] ${
                        m.away?.name === awayTeam?.name ? "text-blue-400" : "text-white"
                      }`}
                    >
                      {m.away?.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
