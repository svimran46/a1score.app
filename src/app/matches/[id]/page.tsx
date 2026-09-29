import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getMatchDetails } from "@/lib/fotmob/client";
import { formatCompactEur } from "@/lib/utils";
import { LiveAutoRefresher } from "@/components/LiveAutoRefresher";
import {
  ArrowLeft,
  Shield,
  Activity,
  Calendar,
  AlertCircle,
  Users,
  BarChart2,
  Trophy,
} from "lucide-react";

import type { Metadata } from "next";

export const revalidate = 5; // Ultra-fresh match details every 5s
export const runtime = "edge";

interface MatchPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const match = await getMatchDetails(params.id);
  if (!match) {
    return {
      title: "Match Not Found | a1score.app",
    };
  }

  const home = match.teams?.home?.name || "Home Team";
  const away = match.teams?.away?.name || "Away Team";
  const scoreStr = match.general?.started
    ? `${match.teams?.home?.score ?? 0} - ${match.teams?.away?.score ?? 0}`
    : "vs";
  const statusStr = match.general?.finished
    ? "Full Time"
    : match.general?.started
    ? "LIVE"
    : "Upcoming";

  return {
    title: `${home} ${scoreStr} ${away} — Live Match Center (${statusStr}) | a1score.app`,
    description: `Live match intelligence for ${home} ${scoreStr} ${away}. Confirmed lineups, tactical formations, live match timeline, stats, and squad market valuations on a1score.app.`,
    openGraph: {
      title: `${home} ${scoreStr} ${away} — Live Match Center`,
      description: `Live score, lineups, and squad valuations for ${home} vs ${away}.`,
    },
  };
}

export default async function MatchDetailsPage({ params }: MatchPageProps) {
  const match = await getMatchDetails(params.id);

  if (!match) {
    notFound();
  }

  const { general = {} as any, teams = {} as any, events = [], lineup = {} as any, stats = [] } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  const isLive = general?.started && !general?.finished;
  const isFinished = general?.finished;
  const isUpcoming = !general?.started && !general?.finished;

  // Extract top stats
  const topStatsGroup = (stats || []).find((s: any) => s?.key === "top_stats" || s?.title?.toLowerCase().includes("top"));
  const matchStatsList = topStatsGroup?.stats || stats?.[0]?.stats || [];

  const homeStarters = lineup?.homeTeam?.starters || [];
  const awayStarters = lineup?.awayTeam?.starters || [];
  const homeUnavailable = lineup?.homeTeam?.unavailable || [];
  const awayUnavailable = lineup?.awayTeam?.unavailable || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top navigation & Live Refresher */}
      <div className="flex items-center justify-between">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Live Match Center
        </Link>
        <LiveAutoRefresher intervalMs={5000} label="Match Sync" defaultEnabled={!isFinished} />
      </div>

      {/* Main Scoreboard Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        {/* Competition & Status */}
        <div className="flex items-center justify-between text-xs pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white tracking-wide">
              {general.leagueName || "Football Match"}
            </span>
            {general.matchRound && (
              <span className="text-slate-500">• Round {general.matchRound}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLive && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
            <span
              className={`font-black px-3 py-1 rounded-full text-xs uppercase tracking-wider ${
                isLive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : isFinished
                  ? "bg-slate-800 text-slate-300 border border-slate-700"
                  : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
              }`}
            >
              {isLive ? "LIVE NOW" : isFinished ? "FULL TIME" : "UPCOMING"}
            </span>
          </div>
        </div>

        {/* Teams and Big Score */}
        <div className="py-8 grid grid-cols-3 items-center gap-4">
          {/* Home Team */}
          <div className="flex flex-col items-center sm:items-end text-center sm:text-right space-y-3">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/80 p-2.5 shadow-xl flex items-center justify-center border border-slate-700/60">
              {homeTeam?.imageUrl ? (
                <Image
                  src={homeTeam.imageUrl}
                  alt={homeTeam.name || "Home"}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              ) : (
                <Shield className="w-10 h-10 text-slate-500" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-2xl font-black text-white tracking-tight">
                {homeTeam?.name || "Home Team"}
              </h2>
              {lineup?.homeTeam?.formation && (
                <span className="text-xs text-slate-400 font-medium">
                  Formation: {lineup.homeTeam.formation}
                </span>
              )}
            </div>
          </div>

          {/* Central Score */}
          <div className="flex flex-col items-center justify-center text-center">
            {isLive || isFinished ? (
              <div className="flex items-center gap-3 sm:gap-6 tabular-nums">
                <span
                  className={`text-4xl sm:text-6xl font-black tabular-nums ${
                    isLive ? "text-emerald-400" : "text-white"
                  }`}
                >
                  {homeTeam?.score ?? 0}
                </span>
                <span className="text-2xl sm:text-4xl font-light text-slate-600">-</span>
                <span
                  className={`text-4xl sm:text-6xl font-black tabular-nums ${
                    isLive ? "text-emerald-400" : "text-white"
                  }`}
                >
                  {awayTeam?.score ?? 0}
                </span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-lg sm:text-xl font-bold text-white block">VS</span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {general.matchTimeUTC?.split(",")?.[2] || "Upcoming"}
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/80 p-2.5 shadow-xl flex items-center justify-center border border-slate-700/60">
              {awayTeam?.imageUrl ? (
                <Image
                  src={awayTeam.imageUrl}
                  alt={awayTeam.name || "Away"}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              ) : (
                <Shield className="w-10 h-10 text-slate-500" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-2xl font-black text-white tracking-tight">
                {awayTeam?.name || "Away Team"}
              </h2>
              {lineup?.awayTeam?.formation && (
                <span className="text-xs text-slate-400 font-medium">
                  Formation: {lineup.awayTeam.formation}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lineups */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Confirmed Lineups
                </h3>
              </div>
              <span className="text-xs text-slate-500">Starting XI</span>
            </div>

            {homeStarters.length > 0 || awayStarters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Starters */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800/60">
                    <span>{homeTeam?.name} Starting XI</span>
                    {lineup?.homeTeam?.totalStarterMarketValue && (
                      <span className="text-amber-400 font-extrabold tabular-nums">
                        {formatCompactEur(lineup.homeTeam.totalStarterMarketValue)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {homeStarters.map((player: any) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/40 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 text-center font-bold text-slate-500 tabular-nums">
                            {player.shirtNumber || "-"}
                          </span>
                          <span className="font-semibold text-white truncate">
                            {player.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {player.marketValue ? (
                            <span className="text-[11px] font-bold text-amber-400 tabular-nums">
                              {formatCompactEur(player.marketValue)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Away Starters */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800/60">
                    <span>{awayTeam?.name} Starting XI</span>
                    {lineup?.awayTeam?.totalStarterMarketValue && (
                      <span className="text-amber-400 font-extrabold tabular-nums">
                        {formatCompactEur(lineup.awayTeam.totalStarterMarketValue)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {awayStarters.map((player: any) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/40 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 text-center font-bold text-slate-500 tabular-nums">
                            {player.shirtNumber || "-"}
                          </span>
                          <span className="font-semibold text-white truncate">
                            {player.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {player.marketValue ? (
                            <span className="text-[11px] font-bold text-amber-400 tabular-nums">
                              {formatCompactEur(player.marketValue)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Lineups not yet confirmed for this match. Check back closer to kickoff.
              </div>
            )}

            {/* Injuries / Unavailable */}
            {(homeUnavailable.length > 0 || awayUnavailable.length > 0) && (
              <div className="pt-6 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Injured & Unavailable Players</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {homeUnavailable.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-slate-400 font-semibold">{homeTeam?.name}</span>
                      {homeUnavailable.map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-slate-300"
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="text-[10px] text-red-400">
                            {p.unavailability?.expectedReturn || "Injured"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {awayUnavailable.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-slate-400 font-semibold">{awayTeam?.name}</span>
                      {awayUnavailable.map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-slate-300"
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="text-[10px] text-red-400">
                            {p.unavailability?.expectedReturn || "Injured"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Match Stats & Timeline */}
        <div className="space-y-6">
          {/* Match Stats */}
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Match Statistics
              </h3>
            </div>

            {matchStatsList.length > 0 ? (
              <div className="space-y-4">
                {matchStatsList.map((stat: any, idx: number) => {
                  const homeVal = stat.stats?.[0] ?? 0;
                  const awayVal = stat.stats?.[1] ?? 0;
                  const total = (Number(homeVal) || 0) + (Number(awayVal) || 0);
                  const homePct = total > 0 ? Math.round(((Number(homeVal) || 0) / total) * 100) : 50;

                  return (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-300">
                        <span className={stat.highlighted === "home" ? "text-emerald-400" : ""}>
                          {homeVal}
                        </span>
                        <span className="text-slate-400 font-medium text-[11px]">
                          {stat.title}
                        </span>
                        <span className={stat.highlighted === "away" ? "text-emerald-400" : ""}>
                          {awayVal}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${homePct}%` }}
                        />
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${100 - homePct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60 leading-relaxed">
                  * Official competition match statistics reconcile on-pitch incidents, bench cautions, and post-whistle disciplinary cards recorded by match officials.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                {isUpcoming
                  ? "Match statistics will be recorded live once kickoff begins."
                  : "No match stats available."}
              </div>
            )}
          </div>

          {/* Match Events */}
          {events.length > 0 && (
            <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Activity className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Timeline Events
                </h3>
              </div>

              <div className="space-y-2.5">
                {events.map((ev: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/40 text-xs"
                  >
                    <span className="font-bold text-emerald-400 w-8 text-center flex-shrink-0">
                      {ev.time}&apos;
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-white truncate block">
                        {ev.player?.name || ev.type || "Match Event"}
                      </span>
                      {ev.homeScore !== undefined && ev.awayScore !== undefined && (
                        <span className="text-[10px] text-slate-400">
                          Score: {ev.homeScore} - {ev.awayScore}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
