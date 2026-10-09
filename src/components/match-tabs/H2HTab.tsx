"use client";

import { useMemo } from "react";
import { History, Calendar, Trophy } from "lucide-react";
import { EntityImage } from "@/components/EntityImage";
import { formatDate } from "@/lib/utils";

interface H2HTabProps {
  match: any;
}

export function H2HTab({ match }: H2HTabProps) {
  const { h2h = {}, teamForm = {}, teams = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  const summary = h2h?.summary || [0, 0, 0];
  const [homeWins = 0, draws = 0, awayWins = 0] = summary;
  const totalMeetings = homeWins + draws + awayWins;

  const pastMatches = useMemo(() => {
    return (h2h?.matches || [])
      .filter((m: any) => m.finished || m.status?.finished)
      .slice(0, 5); // Last 5 meetings
  }, [h2h?.matches]);

  const homeFormList: any[] = teamForm?.[0] || teamForm?.home || [];
  const awayFormList: any[] = teamForm?.[1] || teamForm?.away || [];

  const getFormColor = (resStr: string) => {
    const r = resStr?.toUpperCase();
    if (r === "W") return "bg-trend-up text-accent-contrast shadow-xs";
    if (r === "D") return "bg-accent text-accent-contrast font-black shadow-xs";
    if (r === "L") return "bg-trend-down text-accent-contrast shadow-xs";
    return "bg-[var(--bg-chip)] text-[var(--text-muted)]";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Recent Form (Last 5 Games) */}
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--value-text)]" />
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Recent Form (Last 5 Matches)
            </h3>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">All Competitions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Home Team Form */}
          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-primary)] text-xs sm:text-sm truncate">
                {homeTeam?.name || "Home"}
              </span>
              <div className="flex items-center gap-1.5">
                {homeFormList.slice(-5).map((item: any, idx: number) => (
                  <span
                    key={idx}
                    title={`${item.tooltipText?.homeTeam || "Home"} ${item.score || ""} ${item.tooltipText?.awayTeam || "Away"}`}
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
              <div className="text-[11px] text-[var(--text-muted)] divide-y divide-[var(--divider)] pt-1">
                {homeFormList.slice(-3).map((item: any, idx: number) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                    <span className="truncate">
                      vs {item.home?.isOurTeam ? item.away?.name : item.home?.name}
                    </span>
                    <span className="font-mono font-bold text-[var(--text-primary)] tabular-nums ml-2 shrink-0">
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Away Team Form */}
          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-primary)] text-xs sm:text-sm truncate">
                {awayTeam?.name || "Away"}
              </span>
              <div className="flex items-center gap-1.5">
                {awayFormList.slice(-5).map((item: any, idx: number) => (
                  <span
                    key={idx}
                    title={`${item.tooltipText?.homeTeam || "Home"} ${item.score || ""} ${item.tooltipText?.awayTeam || "Away"}`}
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
              <div className="text-[11px] text-[var(--text-muted)] divide-y divide-[var(--divider)] pt-1">
                {awayFormList.slice(-3).map((item: any, idx: number) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                    <span className="truncate">
                      vs {item.home?.isOurTeam ? item.away?.name : item.home?.name}
                    </span>
                    <span className="font-mono font-bold text-[var(--text-primary)] tabular-nums ml-2 shrink-0">
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. All-Time H2H Summary */}
      {totalMeetings > 0 && (
        <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[var(--value-text)]" />
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Head-to-Head Record
              </h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-medium tabular-nums">
              {totalMeetings} Recorded Matches
            </span>
          </div>

          {/* Win/Draw/Loss Counter Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] truncate">
                {homeTeam?.name || "Home"} Wins
              </p>
              <p className="text-xl sm:text-3xl font-black text-trend-up tabular-nums mt-0.5">
                {homeWins}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Draws</p>
              <p className="text-xl sm:text-3xl font-black text-[var(--value-text)] figure tabular-nums mt-0.5">
                {draws}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] truncate">
                {awayTeam?.name || "Away"} Wins
              </p>
              <p className="text-xl sm:text-3xl font-black text-info tabular-nums mt-0.5">
                {awayWins}
              </p>
            </div>
          </div>

          {/* Proportional Record Bar */}
          <div className="w-full h-2.5 rounded-full bg-[var(--bg-chip)] overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-trend-up transition-all duration-300"
              style={{ width: `${(homeWins / totalMeetings) * 100}%` }}
              title={`${homeTeam?.name || "Home"}: ${homeWins} wins`}
            />
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(draws / totalMeetings) * 100}%` }}
              title={`Draws: ${draws}`}
            />
            <div
              className="h-full bg-info transition-all duration-300"
              style={{ width: `${(awayWins / totalMeetings) * 100}%` }}
              title={`${awayTeam?.name || "Away"}: ${awayWins} wins`}
            />
          </div>
        </div>
      )}

      {/* 3. Past 5 Meetings */}
      {pastMatches.length > 0 && (
        <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Previous Meetings (Last 5)
            </h3>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">Head-to-Head</span>
          </div>

          <div className="divide-y divide-[var(--divider)]">
            {pastMatches.map((m: any, idx: number) => {
              const homeScore = m.home?.score ?? m.status?.scoreStr?.split("-")[0]?.trim() ?? "0";
              const awayScore = m.away?.score ?? m.status?.scoreStr?.split("-")[1]?.trim() ?? "0";

              return (
                <div
                  key={m.id || idx}
                  className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-[var(--bg-hover)] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span className="text-[11px] text-[var(--text-muted)] shrink-0">
                      {m.timeTS ? formatDate(new Date(m.timeTS * 1000)) : m.date || "Past"}
                    </span>
                    <span className="text-[var(--divider)] hidden sm:inline">•</span>
                    <span className="text-[var(--text-secondary)] truncate hidden sm:inline">
                      {m.leagueName || m.tournament?.name || "Fixture"}
                    </span>
                  </div>

                  {/* Match Matchup and Score */}
                  <div className="flex items-center gap-3 shrink-0 font-medium">
                    <span className="text-[var(--text-primary)] font-semibold truncate max-w-[100px] text-right">
                      {m.home?.name || "Home"}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono font-bold text-[var(--value-text)] figure tabular-nums text-xs">
                      {homeScore} - {awayScore}
                    </span>
                    <span className="text-[var(--text-primary)] font-semibold truncate max-w-[100px]">
                      {m.away?.name || "Away"}
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
