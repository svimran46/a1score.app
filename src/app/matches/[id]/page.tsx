import Link from "next/link";
import { EntityImage } from "@/components/EntityImage";
import { notFound } from "next/navigation";
import { getMatchDetails } from "@/lib/fotmob/client";
import { formatCompactEur } from "@/lib/utils";
import { LiveAutoRefresher } from "@/components/LiveAutoRefresher";
import { MatchFinancialBarometer } from "@/components/MatchFinancialBarometer";
import { PitchLineup } from "@/components/PitchLineup";
import { MatchTimeline } from "@/components/MatchTimeline";
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

import { constructMetadata, SITE_URL } from "@/lib/metadata";
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
    return constructMetadata({
      title: "Match Not Found",
      description: "The requested football match center could not be located.",
      path: `/matches/${params.id}`,
    });
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

  return constructMetadata({
    title: `${home} ${scoreStr} ${away} — Live Match Center (${statusStr})`,
    description: `Live match intelligence for ${home} ${scoreStr} ${away}. Confirmed lineups, tactical formations, live match timeline, stats, and squad market valuations on a1score.app.`,
    path: `/matches/${params.id}`,
  });
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

  const homeValuedCount = homeStarters.filter(
    (p: any) => typeof p.marketValue === "number" && p.marketValue > 0
  ).length;
  const awayValuedCount = awayStarters.filter(
    (p: any) => typeof p.marketValue === "number" && p.marketValue > 0
  ).length;

  const homeStarterTotalVal =
    lineup?.homeTeam?.totalStarterMarketValue ||
    homeStarters.reduce((acc: number, p: any) => acc + (p.marketValue || 0), 0);

  const awayStarterTotalVal =
    lineup?.awayTeam?.totalStarterMarketValue ||
    awayStarters.reduce((acc: number, p: any) => acc + (p.marketValue || 0), 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${homeTeam?.name || "Home"} vs ${awayTeam?.name || "Away"}`,
    sport: "Football",
    url: `${SITE_URL}/matches/${params.id}`,
    startDate: general?.matchTimeUTC || undefined,
    eventStatus: isFinished
      ? "https://schema.org/EventFinished"
      : isLive
      ? "https://schema.org/EventLive"
      : "https://schema.org/EventScheduled",
    homeTeam: {
      "@type": "SportsTeam",
      name: homeTeam?.name || "Home",
      logo: homeTeam?.imageUrl || undefined,
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: awayTeam?.name || "Away",
      logo: awayTeam?.imageUrl || undefined,
    },
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
      <div className="rounded-3xl glass-panel p-4 sm:p-8 border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        {/* Competition & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs pb-4 sm:pb-6 border-b border-slate-800/80 gap-2">
          {/* Row 1 on mobile: Competition name */}
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-white tracking-wide truncate">
              {general.leagueName || "Football Match"}
            </span>
            {general.matchRound && (
              <span className="text-slate-500 hidden sm:inline shrink-0">• Round {general.matchRound}</span>
            )}
          </div>

          {/* Row 2 on mobile: Round + Live badge */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {general.matchRound && (
              <span className="text-slate-400 sm:hidden">Round {general.matchRound}</span>
            )}
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {isLive && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
              <span
                className={`font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs uppercase tracking-wider whitespace-nowrap ${
                  isLive
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : isFinished
                    ? "bg-slate-800 text-slate-300 border border-slate-700"
                    : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                }`}
              >
                {isLive ? "LIVE NOW" : isFinished ? "FULL TIME" : "UPCOMING"}
              </span>
            </div>
          </div>
        </div>

        {/* Teams and Big Score */}
        <div className="py-4 sm:py-8 grid grid-cols-3 items-center gap-2 sm:gap-4">
          {/* Home Team */}
          <div className="flex flex-col items-center sm:items-end text-center sm:text-right space-y-2 sm:space-y-3 min-w-0">
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/80 p-2 sm:p-2.5 shadow-xl flex items-center justify-center border border-slate-700/60 overflow-hidden shrink-0">
              <EntityImage
                src={homeTeam?.imageUrl}
                alt={homeTeam.name || "Home"}
                width={64}
                height={64}
                entityType="club"
                className="object-contain"
              />
            </div>
            <div className="w-full">
              <h2 className="text-sm sm:text-2xl font-black text-white tracking-tight truncate [text-wrap:balance]">
                {homeTeam?.name || "Home Team"}
              </h2>
              {lineup?.homeTeam?.formation && (
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap block mt-0.5">
                  <span className="hidden sm:inline">Formation: </span>{lineup.homeTeam.formation}
                </span>
              )}
            </div>
          </div>

          {/* Central Score */}
          <div className="flex flex-col items-center justify-center text-center px-1">
            {isLive || isFinished ? (
              <div className="flex items-center gap-2 sm:gap-6 tabular-nums">
                <span
                  className={`text-3xl sm:text-6xl font-black tabular-nums ${
                    isLive ? "text-emerald-400" : "text-white"
                  }`}
                >
                  {homeTeam?.score ?? 0}
                </span>
                <span className="text-xl sm:text-4xl font-light text-slate-600">-</span>
                <span
                  className={`text-3xl sm:text-6xl font-black tabular-nums ${
                    isLive ? "text-emerald-400" : "text-white"
                  }`}
                >
                  {awayTeam?.score ?? 0}
                </span>
              </div>
            ) : (
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-base sm:text-xl font-bold text-white block">VS</span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block whitespace-nowrap">
                  {general.matchTimeUTC?.split(",")?.[2] || "Upcoming"}
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2 sm:space-y-3 min-w-0">
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/80 p-2 sm:p-2.5 shadow-xl flex items-center justify-center border border-slate-700/60 overflow-hidden shrink-0">
              <EntityImage
                src={awayTeam?.imageUrl}
                alt={awayTeam.name || "Away"}
                width={64}
                height={64}
                entityType="club"
                className="object-contain"
              />
            </div>
            <div className="w-full">
              <h2 className="text-sm sm:text-2xl font-black text-white tracking-tight truncate [text-wrap:balance]">
                {awayTeam?.name || "Away Team"}
              </h2>
              {lineup?.awayTeam?.formation && (
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap block mt-0.5">
                  <span className="hidden sm:inline">Formation: </span>{lineup.awayTeam.formation}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Disparity & Value-to-Pitch Index */}
      {(homeStarterTotalVal > 0 || awayStarterTotalVal > 0) && (
        <MatchFinancialBarometer
          homeName={homeTeam?.name || "Home"}
          awayName={awayTeam?.name || "Away"}
          homeScore={homeTeam?.score}
          awayScore={awayTeam?.score}
          homeValue={homeStarterTotalVal}
          awayValue={awayStarterTotalVal}
          homeCoverage={{ valuedCount: homeValuedCount, totalStarters: homeStarters.length || 11 }}
          awayCoverage={{ valuedCount: awayValuedCount, totalStarters: awayStarters.length || 11 }}
          isLive={isLive}
          isFinished={isFinished}
          isUpcoming={isUpcoming}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tactical Pitch Lineups & Unavailable */}
        <div className="lg:col-span-2 space-y-6">
          <PitchLineup
            homeTeam={{
              name: homeTeam?.name,
              formation: lineup?.homeTeam?.formation,
              starters: homeStarters,
              totalStarterMarketValue: homeStarterTotalVal,
            }}
            awayTeam={{
              name: awayTeam?.name,
              formation: lineup?.awayTeam?.formation,
              starters: awayStarters,
              totalStarterMarketValue: awayStarterTotalVal,
            }}
            homeName={homeTeam?.name || "Home Team"}
            awayName={awayTeam?.name || "Away Team"}
          />

          {/* Injuries / Unavailable */}
          {(homeUnavailable.length > 0 || awayUnavailable.length > 0) && (
            <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Injured &amp; Unavailable Players</span>
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
                  * Official competition match statistics reflect the formal match report recorded by competition officials.
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

          {/* Match Timeline Events */}
          <MatchTimeline
            events={events}
            homeName={homeTeam?.name || "Home"}
            awayName={awayTeam?.name || "Away"}
            onPitchYellowCards={match.cardReconciliation?.onPitchYellowCards}
            onPitchRedCards={match.cardReconciliation?.onPitchRedCards}
          />
        </div>
      </div>
    </div>
  );
}
