"use client";

import { useMemo } from "react";
import { formatCompactEur, calculateAge } from "@/lib/utils";
import {
  TrendingUp,
  Activity,
  Flame,
  Award,
  Zap,
  Target,
  Sparkles,
} from "lucide-react";

interface SeasonStatItem {
  id: string;
  season: string;
  competition: string;
  appearances?: number | null;
  goals?: number | null;
  assists?: number | null;
  minutesPlayed?: number | null;
  rating?: number | null;
}

interface MarketValuePoint {
  id: string;
  date: string | Date;
  valueEur: number;
}

interface PlayerIntelligenceRibbonProps {
  latestMarketValue: number;
  marketValues: MarketValuePoint[];
  seasonStats: SeasonStatItem[];
  dateOfBirth?: string | Date | null;
  position: string;
}

export function PlayerIntelligenceRibbon({
  latestMarketValue,
  marketValues,
  seasonStats,
  dateOfBirth,
  position,
}: PlayerIntelligenceRibbonProps) {
  // Sort market values chronologically
  const sortedValues = useMemo(() => {
    return [...marketValues].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [marketValues]);

  // Compute 1Y or previous delta
  const valuationDelta = useMemo(() => {
    if (sortedValues.length < 2) return null;
    const latest = sortedValues[sortedValues.length - 1];
    const prev = sortedValues[sortedValues.length - 2];
    const diff = latest.valueEur - prev.valueEur;
    const pct = prev.valueEur > 0 ? (diff / prev.valueEur) * 100 : 0;

    return {
      diff,
      pct,
      isGain: diff > 0,
      isLoss: diff < 0,
    };
  }, [sortedValues]);

  // Peak analysis
  const peakAnalysis = useMemo(() => {
    if (sortedValues.length === 0) return null;
    const peak = [...sortedValues].sort((a, b) => b.valueEur - a.valueEur)[0];
    const isAtPeak = latestMarketValue >= peak.valueEur;
    return {
      peakValue: peak.valueEur,
      isAtPeak,
      delta: peak.valueEur - latestMarketValue,
    };
  }, [sortedValues, latestMarketValue]);

  // Aggregate current season verified performance
  const seasonTotals = useMemo(() => {
    if (!seasonStats || seasonStats.length === 0) return null;

    let apps = 0;
    let goals = 0;
    let assists = 0;
    let mins = 0;
    let ratingsCount = 0;
    let ratingsSum = 0;

    for (const stat of seasonStats) {
      apps += stat.appearances || 0;
      goals += stat.goals || 0;
      assists += stat.assists || 0;
      mins += stat.minutesPlayed || 0;
      if (typeof stat.rating === "number" && stat.rating > 0) {
        ratingsSum += stat.rating;
        ratingsCount++;
      }
    }

    const avgRating = ratingsCount > 0 ? (ratingsSum / ratingsCount).toFixed(2) : null;
    const goalContribPer90 = mins > 0 ? (((goals + assists) / mins) * 90).toFixed(2) : null;

    return {
      apps,
      goals,
      assists,
      mins,
      avgRating,
      goalContribPer90,
    };
  }, [seasonStats]);

  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;

  return (
    <div className="rounded-3xl glass-panel p-6 border border-slate-800 bg-gradient-to-r from-slate-900/60 via-slate-950/80 to-slate-900/60 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Valuation Intelligence &amp; Performance Correlation
          </h3>
        </div>
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Valuation &amp; form insights
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Valuation Velocity */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-400" /> Valuation Shift
          </span>
          <div className="text-base sm:text-lg font-black text-white tabular-nums flex items-center gap-1.5">
            {valuationDelta ? (
              <span
                className={
                  valuationDelta.isGain
                    ? "text-emerald-400"
                    : valuationDelta.isLoss
                    ? "text-rose-400"
                    : "text-slate-200"
                }
              >
                {valuationDelta.isGain ? "+" : ""}
                {formatCompactEur(valuationDelta.diff)}
              </span>
            ) : (
              <span className="text-slate-400">Stable</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {valuationDelta
              ? `${valuationDelta.isGain ? "+" : ""}${valuationDelta.pct.toFixed(1)}% latest window`
              : "Historical baseline"}
          </div>
        </div>

        {/* Metric 2: Peak Status */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Peak Status
          </span>
          <div className="text-base sm:text-lg font-black text-amber-400">
            {peakAnalysis?.isAtPeak ? "All-Time High" : "Near Peak"}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {peakAnalysis?.isAtPeak
              ? `Max recorded €${formatCompactEur(peakAnalysis.peakValue)}`
              : `-${formatCompactEur(peakAnalysis?.delta || 0)} from peak`}
          </div>
        </div>

        {/* Metric 3: Output Efficiency */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
            <Target className="w-3 h-3 text-emerald-400" /> G+A Contributions
          </span>
          <div className="text-base sm:text-lg font-black text-emerald-400 tabular-nums">
            {seasonTotals ? `${seasonTotals.goals + seasonTotals.assists} Goals & Assists` : "Tracking live"}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {seasonTotals?.goalContribPer90
              ? `${seasonTotals.goalContribPer90} per 90 mins`
              : `${seasonTotals?.apps || 0} appearances`}
          </div>
        </div>

        {/* Metric 4: Form & Rating */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" /> Match Rating
          </span>
          <div className="text-base sm:text-lg font-black text-white tabular-nums">
            {seasonTotals?.avgRating ? (
              <span className="text-amber-400 font-extrabold">{seasonTotals.avgRating} / 10</span>
            ) : (
              <span className="text-slate-300">Verified</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            {age ? `${age} y/o • ${position}` : position}
          </div>
        </div>
      </div>
    </div>
  );
}
