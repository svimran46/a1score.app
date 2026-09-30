"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { EntityImage } from "@/components/EntityImage";
import { LiveMinute } from "@/components/LiveMinute";
import { KickoffTime } from "@/components/KickoffTime";
import { formatCompactEur } from "@/lib/utils";
import { ArrowLeft, Trophy, AlertCircle } from "lucide-react";

interface ScorerItem {
  player: string;
  minutes: string;
}

interface MatchScorecardProps {
  match: any;
  goalHighlight?: boolean;
}

export function MatchScorecard({ match, goalHighlight = false }: MatchScorecardProps) {
  const { general = {}, status = {}, teams = {}, scorers = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  const isLive = status?.isLive;
  const isHT = status?.isHT;
  const isFinished = status?.finished;
  const isUpcoming = status?.isUpcoming;
  const isCancelled = status?.cancelled;

  // Localized kickoff time & live countdown for upcoming matches
  const matchDate = general?.matchTimeUTCDate || general?.matchTimeUTC;
  const [countdownStr, setCountdownStr] = useState<string>("");

  useEffect(() => {
    if (!isUpcoming || !matchDate) return;

    const targetTime = new Date(matchDate).getTime();
    if (isNaN(targetTime)) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setCountdownStr("Starting soon");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const hh = String(hours).padStart(2, "0");
      const mm = String(mins).padStart(2, "0");
      const ss = String(secs).padStart(2, "0");

      setCountdownStr(`Starts in ${hh}:${mm}:${ss}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isUpcoming, matchDate]);

  const localKickoffTime = useMemo(() => {
    if (!matchDate) return null;
    const d = new Date(matchDate);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [matchDate]);

  // Secondary line under team names (FIFA rank or Squad valuation)
  const getTeamSecondary = (team: any) => {
    const parts: string[] = [];
    if (team?.totalStarterMarketValue && team.totalStarterMarketValue > 0) {
      parts.push(formatCompactEur(team.totalStarterMarketValue));
    }
    if (team?.fifaRank) {
      parts.push(`#${team.fifaRank} FIFA`);
    }
    return parts.join(" • ") || null;
  };

  const homeSecondary = getTeamSecondary(homeTeam);
  const awaySecondary = getTeamSecondary(awayTeam);

  // Scorers paired row mapping
  const homeScorers: ScorerItem[] = scorers?.home || [];
  const awayScorers: ScorerItem[] = scorers?.away || [];
  const maxScorerRows = Math.max(homeScorers.length, awayScorers.length);
  const totalGoals = (homeTeam?.score || 0) + (awayTeam?.score || 0);
  const showScorersLoading =
    totalGoals > 0 && homeScorers.length === 0 && awayScorers.length === 0;

  return (
    <div
      id="main-match-scorecard"
      className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/95 backdrop-blur-xl shadow-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-all duration-300"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Top Header: Back navigation + Competition Crest/Name + Round */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800/80 gap-2 text-xs">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1.5 font-semibold text-slate-400 hover:text-emerald-400 transition-colors shrink-0 min-h-[36px] py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Matches</span>
          <span className="sm:hidden">Back</span>
        </Link>

        {/* Competition Name & Round */}
        <div className="flex items-center gap-2 text-right min-w-0">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-white tracking-tight truncate">
            {general.leagueName || "Match Center"}
          </span>
          {general.matchRound && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
              Round {general.matchRound}
            </span>
          )}
        </div>
      </div>

      {/* Main Scoreboard Content: Crests, Score, Status, Scorers (tight fit, no dead space) */}
      <div className="pt-4 sm:pt-6 pb-2">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          {/* HOME TEAM */}
          <div className="flex flex-col items-center text-center space-y-2 min-w-0">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-slate-800/80 p-2 sm:p-3 shadow-xl flex items-center justify-center border border-slate-700/60 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              <EntityImage
                src={homeTeam?.imageUrl}
                alt={homeTeam.name || "Home Team"}
                width={80}
                height={80}
                entityType="club"
                className="object-contain"
              />
            </div>
            <div className="w-full">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight truncate [text-wrap:balance]">
                {homeTeam?.name || "Home"}
              </h2>
              {homeSecondary && (
                <p className="text-[11px] sm:text-xs text-amber-400 font-semibold truncate mt-0.5">
                  {homeSecondary}
                </p>
              )}
            </div>
          </div>

          {/* CENTER: SCORE & STATUS */}
          <div className="flex flex-col items-center justify-center text-center px-1 sm:px-4">
            {isUpcoming ? (
              <div className="space-y-1.5 py-1">
                <span className="text-2xl sm:text-4xl font-black text-white tracking-widest block">
                  VS
                </span>
                {matchDate && (
                  <span className="text-xs sm:text-sm font-bold text-slate-300 block">
                    <KickoffTime date={matchDate} />
                  </span>
                )}
                {countdownStr && (
                  <span className="text-[10px] sm:text-xs text-amber-400 font-semibold tracking-wide block">
                    {countdownStr}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-1">
                {/* Big Score */}
                <div
                  className={`flex items-center gap-2 sm:gap-4 lg:gap-6 tabular-nums transition-all duration-300 ${
                    goalHighlight
                      ? "ring-2 ring-emerald-400 bg-emerald-500/10 rounded-2xl px-4 py-1 scale-105"
                      : ""
                  }`}
                  aria-live="polite"
                >
                  <span
                    className={`text-4xl sm:text-6xl lg:text-7xl font-black tabular-nums tracking-tight ${
                      isLive ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    {homeTeam?.score ?? 0}
                  </span>
                  <span className="text-2xl sm:text-4xl lg:text-5xl font-light text-slate-600">
                    -
                  </span>
                  <span
                    className={`text-4xl sm:text-6xl lg:text-7xl font-black tabular-nums tracking-tight ${
                      isLive ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    {awayTeam?.score ?? 0}
                  </span>
                </div>

                {/* Status Line directly under score */}
                <div className="pt-1">
                  {isCancelled ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Postponed / Cancelled
                    </span>
                  ) : isLive ? (
                    <LiveMinute
                      shortTime={status?.liveTime?.short}
                      longTime={status?.liveTime?.long}
                      isLive={true}
                      isHT={isHT}
                      isFinished={false}
                      className="text-xs sm:text-sm"
                    />
                  ) : isFinished ? (
                    <span className="text-xs sm:text-sm font-semibold text-slate-400">
                      Full time
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* AWAY TEAM */}
          <div className="flex flex-col items-center text-center space-y-2 min-w-0">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-slate-800/80 p-2 sm:p-3 shadow-xl flex items-center justify-center border border-slate-700/60 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              <EntityImage
                src={awayTeam?.imageUrl}
                alt={awayTeam.name || "Away Team"}
                width={80}
                height={80}
                entityType="club"
                className="object-contain"
              />
            </div>
            <div className="w-full">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight truncate [text-wrap:balance]">
                {awayTeam?.name || "Away"}
              </h2>
              {awaySecondary && (
                <p className="text-[11px] sm:text-xs text-amber-400 font-semibold truncate mt-0.5">
                  {awaySecondary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SCORERS ROW (Two columns split at centre with small ball icon) */}
        {showScorersLoading ? (
          <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
            <span className="text-[11px] text-slate-400 italic">Goal details loading...</span>
          </div>
        ) : maxScorerRows > 0 ? (
          <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
            {Array.from({ length: maxScorerRows }).map((_, idx) => {
              const homeScorer = homeScorers[idx];
              const awayScorer = awayScorers[idx];

              return (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 text-xs sm:text-sm"
                >
                  {/* Home Scorer (Right-aligned in left column) */}
                  <div className="text-right text-slate-200 font-medium truncate">
                    {homeScorer ? (
                      <span>
                        <span className="font-semibold">{homeScorer.player}</span>{" "}
                        <span className="text-slate-400 font-mono text-xs">
                          {homeScorer.minutes}
                        </span>
                      </span>
                    ) : null}
                  </div>

                  {/* Ball Icon */}
                  <div className="w-5 flex items-center justify-center text-slate-500 shrink-0">
                    <span className="text-xs leading-none" role="img" aria-label="Goal">
                      ⚽
                    </span>
                  </div>

                  {/* Away Scorer (Left-aligned in right column) */}
                  <div className="text-left text-slate-200 font-medium truncate">
                    {awayScorer ? (
                      <span>
                        <span className="font-semibold">{awayScorer.player}</span>{" "}
                        <span className="text-slate-400 font-mono text-xs">
                          {awayScorer.minutes}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
