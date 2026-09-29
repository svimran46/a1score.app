"use client";

import { useMemo } from "react";
import Link from "next/link";
import { EntityImage } from "@/components/EntityImage";
import {
  Calendar,
  MapPin,
  User,
  Users,
  Trophy,
  ArrowRightLeft,
  Video,
  BarChart2,
  CheckCircle2,
} from "lucide-react";

interface FactsTabProps {
  match: any;
}

export function FactsTab({ match }: FactsTabProps) {
  const { general = {}, teams = {}, events = [], infoBox = {}, stats = [] } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};
  const isLive = match?.status?.isLive;

  // Timeline events: newest first when live
  const sortedEvents = useMemo(() => {
    const list = [...(events || [])];
    if (isLive) {
      return list.sort((a, b) => (b.time || 0) - (a.time || 0));
    }
    return list.sort((a, b) => (a.time || 0) - (b.time || 0));
  }, [events, isLive]);

  // Extract Top 3 Key Stats for the snapshot
  const topStats = useMemo(() => {
    const allStatsGroup = (stats || []).find(
      (s: any) => s?.key === "top_stats" || s?.title?.toLowerCase().includes("top")
    );
    const candidateList = allStatsGroup?.stats || stats?.[0]?.stats || [];

    const desiredTitles = ["possession", "shots", "shots on target", "expected goals"];
    const filtered = candidateList.filter((s: any) =>
      desiredTitles.some((t) => s?.title?.toLowerCase().includes(t))
    );

    return filtered.slice(0, 3);
  }, [stats]);

  // Render event icon
  const getEventBadge = (event: any) => {
    switch (event.type) {
      case "Goal":
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs shrink-0">
            ⚽
          </div>
        );
      case "Card":
        return event.card === "Yellow" ? (
          <div className="w-5 h-6 rounded bg-amber-400 border border-amber-300 shadow-sm shrink-0" />
        ) : (
          <div className="w-5 h-6 rounded bg-rose-500 border border-rose-400 shadow-sm shrink-0" />
        );
      case "Substitution":
        return (
          <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
          </div>
        );
      case "VAR":
        return (
          <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Video className="w-3.5 h-3.5 text-purple-400" />
          </div>
        );
      default:
        return (
          <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. MATCH TIMELINE */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Match Timeline {isLive && <span className="text-emerald-400 text-xs font-normal">• Live Updates</span>}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {isLive ? "Newest First" : "Chronological"}
          </span>
        </div>

        {sortedEvents.length > 0 ? (
          <div className="relative divide-y divide-slate-800/50">
            {sortedEvents.map((event: any, idx: number) => {
              const isHome = event.isHome;
              const teamName = isHome ? homeTeam?.name : awayTeam?.name;
              const teamImage = isHome ? homeTeam?.imageUrl : awayTeam?.imageUrl;
              const playerName = event.player?.name || event.name || event.nameStr || "Event";

              let minuteLabel = `${event.time || 0}'`;
              if (event.overloadTime) {
                minuteLabel = `${event.time}+${event.overloadTime}'`;
              }

              return (
                <div
                  key={event.eventId || event.reactKey || idx}
                  className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-slate-800/20 px-2 rounded-xl transition-colors"
                >
                  {/* Left: Minute & Icon */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-slate-400 text-xs w-9">
                      {minuteLabel}
                    </span>
                    {getEventBadge(event)}
                  </div>

                  {/* Center: Player & Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-200 truncate">
                      <span>{playerName}</span>
                      {event.ownGoal && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-1.5 py-0.2 rounded border border-rose-500/30">
                          OG
                        </span>
                      )}
                      {event.isPenalty && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          P
                        </span>
                      )}
                    </div>
                    {event.assistStr && (
                      <p className="text-[11px] text-slate-400 truncate">
                        {event.assistStr}
                      </p>
                    )}
                    {event.type === "Substitution" && event.swapPlayer && (
                      <p className="text-[11px] text-slate-400 truncate">
                        for {event.swapPlayer.name}
                      </p>
                    )}
                  </div>

                  {/* Right: Team Crest & Indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-medium text-slate-400 hidden sm:inline truncate max-w-[120px]">
                      {teamName}
                    </span>
                    <div className="w-5 h-5 rounded-md bg-slate-800 p-0.5 flex items-center justify-center">
                      <EntityImage
                        src={teamImage}
                        alt={teamName || "Team"}
                        width={20}
                        height={20}
                        entityType="club"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No match events recorded yet.
          </div>
        )}
      </div>

      {/* 2. TOP-3 KEY STATS SNAPSHOT */}
      {topStats.length > 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Key Stats Snapshot
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Match Overview</span>
          </div>

          <div className="space-y-4 pt-1">
            {topStats.map((stat: any, idx: number) => {
              const homeVal = Number(stat.stats?.[0]) || 0;
              const awayVal = Number(stat.stats?.[1]) || 0;
              const total = homeVal + awayVal;

              const homePct = total > 0 ? Math.round((homeVal / total) * 100) : 50;
              const awayPct = total > 0 ? 100 - homePct : 50;

              return (
                <div key={idx} className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between font-bold">
                    <span
                      className={
                        homeVal > awayVal ? "text-emerald-400 font-extrabold" : "text-slate-300"
                      }
                    >
                      {stat.stats?.[0]}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      {stat.title}
                    </span>
                    <span
                      className={
                        awayVal > homeVal ? "text-emerald-400 font-extrabold" : "text-slate-300"
                      }
                    >
                      {stat.stats?.[1]}
                    </span>
                  </div>

                  {/* Proportional bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                    {total === 0 ? (
                      <div className="w-full h-full bg-slate-800" />
                    ) : (
                      <>
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${homePct}%` }}
                        />
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${awayPct}%` }}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MATCH INFO CARD */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Match Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* Competition */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Competition</p>
              <p className="font-semibold text-white mt-0.5">
                {infoBox.tournament?.leagueName || general.leagueName || "League"}
              </p>
              {general.matchRound && (
                <p className="text-[11px] text-slate-400">Round {general.matchRound}</p>
              )}
            </div>
          </div>

          {/* Date & Kickoff */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Kickoff</p>
              <p className="font-semibold text-white mt-0.5">
                {general.matchTimeUTCDate
                  ? new Date(general.matchTimeUTCDate).toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : general.matchTimeUTC || "TBD"}
              </p>
            </div>
          </div>

          {/* Stadium / Venue */}
          {infoBox.stadium && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Venue</p>
                <p className="font-semibold text-white mt-0.5">
                  {infoBox.stadium.name}
                  {infoBox.stadium.city && `, ${infoBox.stadium.city}`}
                </p>
                {infoBox.stadium.capacity && (
                  <p className="text-[11px] text-slate-400">
                    Capacity: {Number(infoBox.stadium.capacity).toLocaleString()} • Surface: {infoBox.stadium.surface || "Grass"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Referee */}
          {infoBox.referee && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <User className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Referee</p>
                <p className="font-semibold text-white mt-0.5">
                  {infoBox.referee.text || infoBox.referee.name || "Match Official"}
                </p>
                {infoBox.referee.country && (
                  <p className="text-[11px] text-slate-400">{infoBox.referee.country}</p>
                )}
              </div>
            </div>
          )}

          {/* Attendance */}
          {infoBox.attendance && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Attendance</p>
                <p className="font-semibold text-white mt-0.5">
                  {Number(infoBox.attendance).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
