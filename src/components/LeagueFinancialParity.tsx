"use client";

import { useMemo, useState } from "react";
import { EntityImage } from "./EntityImage";
import Link from "next/link";
import { formatCompactEur } from "@/lib/utils";
import { getClubSlug } from "@/lib/slugs";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  BarChart3,
  Award,
  AlertTriangle,
  Info,
} from "lucide-react";

export interface LeagueClubValuation {
  id: string;
  name: string;
  logoUrl?: string | null;
  squadSize?: number;
  totalSquadValue: number;
}

export interface LeagueStandingRow {
  id: number;
  idx: number;
  name: string;
  shortName?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  scoresStr: string;
  goalConDiff: number;
  pts: number;
  totalSquadValue?: number;
  clubId?: string | null;
  imageUrl?: string | null;
}

interface LeagueFinancialParityProps {
  clubs: LeagueClubValuation[];
  standings: LeagueStandingRow[];
  totalLeagueValue: number;
  leagueName: string;
}

export function LeagueFinancialParity({
  clubs,
  standings,
  totalLeagueValue,
  leagueName,
}: LeagueFinancialParityProps) {
  const [activeTab, setActiveTab] = useState<"parity" | "efficiency">("parity");

  // 1. Wealth Concentration & Disparity Metrics
  const parityMetrics = useMemo(() => {
    const validClubs = [...clubs].filter((c) => c.totalSquadValue > 0);
    if (validClubs.length === 0) {
      return null;
    }

    const sortedByVal = [...validClubs].sort(
      (a, b) => b.totalSquadValue - a.totalSquadValue
    );
    const topClub = sortedByVal[0];
    const lowestClub = sortedByVal[sortedByVal.length - 1];

    // Real Mathematical Median Club Value
    const n = sortedByVal.length;
    let medianClubValue = 0;
    let medianDetail = "";

    if (n % 2 === 0) {
      const c1 = sortedByVal[n / 2 - 1]; // 10th club for n=20
      const c2 = sortedByVal[n / 2];     // 11th club for n=20
      medianClubValue = Math.round((c1.totalSquadValue + c2.totalSquadValue) / 2);
      medianDetail = `average of 10th & 11th: ${c1.name} (${formatCompactEur(c1.totalSquadValue)}) & ${c2.name} (${formatCompactEur(c2.totalSquadValue)})`;
    } else {
      const c = sortedByVal[Math.floor(n / 2)];
      medianClubValue = c.totalSquadValue;
      medianDetail = `${c.name} (${formatCompactEur(c.totalSquadValue)})`;
    }

    // Top 3 Concentration
    const top3Val = sortedByVal
      .slice(0, 3)
      .reduce((sum, c) => sum + c.totalSquadValue, 0);
    const top3Ratio =
      totalLeagueValue > 0 ? Math.round((top3Val / totalLeagueValue) * 100) : 0;

    // Multiplier Disparity Ratio (Top club vs Median club value)
    const medianRatio =
      medianClubValue > 0
        ? (topClub.totalSquadValue / medianClubValue).toFixed(1)
        : "1.0";

    return {
      topClub,
      lowestClub,
      medianClubValue,
      medianDetail,
      top3Ratio,
      medianRatio,
      sortedClubs: sortedByVal,
    };
  }, [clubs, totalLeagueValue]);

  // 2. Valuation Efficiency (Points per €10M Squad Value)
  const efficiencyMetrics = useMemo(() => {
    if (!standings || standings.length === 0) return null;

    const ratedList = standings
      .filter((s) => (s.totalSquadValue || 0) > 0 && s.played > 0)
      .map((s) => {
        const valIn10M = (s.totalSquadValue || 0) / 10_000_000;
        const ptsPer10M = valIn10M > 0 ? s.pts / valIn10M : 0;
        return {
          ...s,
          ptsPer10M,
          valIn10M,
        };
      })
      .sort((a, b) => b.ptsPer10M - a.ptsPer10M);

    if (ratedList.length < 2) return null;

    const overperformers = ratedList.slice(0, 3);
    const underperformers = [...ratedList].reverse().slice(0, 3);

    return {
      ratedList,
      overperformers,
      underperformers,
    };
  }, [standings]);

  if (!parityMetrics) {
    return null;
  }

  const { topClub, lowestClub, medianClubValue, medianDetail, top3Ratio, medianRatio, sortedClubs } = parityMetrics;

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 space-y-6">
      {/* Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Competition Financial Parity & Efficiency
            </h3>
            <p className="text-xs text-slate-400">
              Economic concentration and points-per-euro performance in {leagueName}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("parity")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "parity"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Wealth Distribution
          </button>
          {efficiencyMetrics && (
            <button
              onClick={() => setActiveTab("efficiency")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "efficiency"
                  ? "bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Points vs Money
            </button>
          )}
        </div>
      </div>

      {/* Top 3 High-Level Macro Barometer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Wealth Concentration */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Top 3 Wealth Concentration
          </span>
          <div className="text-2xl font-black text-amber-400 tracking-tight tabular-nums">
            {top3Ratio}%
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            The top 3 most valuable squads account for {top3Ratio}% of the entire league&apos;s cumulative valuation.
          </p>
        </div>

        {/* Metric 2: Richest vs Median Disparity Ratio */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Economic Disparity Multiplier
          </span>
          <div className="text-2xl font-black text-emerald-400 tracking-tight tabular-nums">
            {medianRatio}x
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            {topClub.name} ({formatCompactEur(topClub.totalSquadValue)}) is valued at {medianRatio}x the median club value ({formatCompactEur(medianClubValue)}, {medianDetail}).
          </p>
        </div>

        {/* Metric 3: Total League Wealth */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Competition Value
          </span>
          <div className="text-2xl font-black text-white tracking-tight tabular-nums">
            {formatCompactEur(totalLeagueValue)}
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Cumulative player transfer market value across all {clubs.length} registered clubs.
          </p>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "parity" ? (
        /* Tab 1: Wealth Distribution Ranking */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
            <span className="font-semibold uppercase tracking-wider">
              Club Valuation Hierarchy
            </span>
            <span>Share of League Capital</span>
          </div>

          <div className="space-y-3">
            {sortedClubs.map((club, index) => {
              const pct = totalLeagueValue > 0
                ? ((club.totalSquadValue / totalLeagueValue) * 100).toFixed(1)
                : "0.0";
              const standingMatch = standings.find(
                (s) =>
                  s.clubId === club.id ||
                  s.name.toLowerCase() === club.name.toLowerCase()
              );

              return (
                <div
                  key={club.id}
                  className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/30 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-500 w-5 text-center flex-shrink-0 tabular-nums">
                        #{index + 1}
                      </span>
                      <Link
                        href={`/clubs/${getClubSlug(club)}`}
                        className="flex items-center gap-2.5 min-w-0 group"
                      >
                        <div className="relative w-7 h-7 rounded-lg bg-slate-800 p-1 flex-shrink-0 border border-slate-700/60 overflow-hidden">
                          <EntityImage
                            src={club.logoUrl}
                            alt={club.name}
                            fill
                            sizes="28px"
                            entityType="club"
                            className="object-contain"
                          />
                        </div>
                        <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                          {club.name}
                        </span>
                      </Link>

                      {standingMatch && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                          Table: #{standingMatch.idx} ({standingMatch.pts} pts)
                        </span>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-extrabold text-amber-400 tabular-nums">
                        {formatCompactEur(club.totalSquadValue)}
                      </span>
                      <span className="text-[11px] text-slate-400 tabular-nums ml-2">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        index < 3
                          ? "bg-amber-400"
                          : index < 8
                          ? "bg-emerald-400"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.max(Number(pct) * 3, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Tab 2: Points vs Money Efficiency Index */
        efficiencyMetrics && (
          <div className="space-y-6">
            {/* Early Season Small Sample Notice (Threshold: 10 matches) */}
            {standings && standings.length > 0 && standings[0].played < 10 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2.5">
                <Info className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Early season notice (Sample: {standings[0].played} matches played):</strong> Points-to-money efficiency metrics fluctuate heavily in opening rounds. Ranking stabilizes as the campaign progresses past 10 matches.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overperformers */}
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Highest Value Efficiency (Overperformers)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Clubs producing the most points per €10M of squad market valuation.
                </p>

                <div className="space-y-2 pt-1">
                  {efficiencyMetrics.overperformers.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-emerald-400">#{i + 1}</span>
                        <div>
                          <span className="font-bold text-white block">{c.name}</span>
                          <span className="text-[10px] text-slate-400">
                            Table #{c.idx} • {c.pts} pts • {formatCompactEur(c.totalSquadValue || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-400 tabular-nums">
                          {c.ptsPer10M.toFixed(1)} pts
                        </span>
                        <span className="text-[10px] text-slate-500 block">/ €10M value</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Underperformers */}
              <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20 text-rose-400">
                  <TrendingDown className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Lowest Value Efficiency (Underperformers)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Clubs with expensive squad market values failing to yield expected points.
                </p>

                <div className="space-y-2 pt-1">
                  {efficiencyMetrics.underperformers.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-rose-400">#{i + 1}</span>
                        <div>
                          <span className="font-bold text-white block">{c.name}</span>
                          <span className="text-[10px] text-slate-400">
                            Table #{c.idx} • {c.pts} pts • {formatCompactEur(c.totalSquadValue || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-rose-400 tabular-nums">
                          {c.ptsPer10M.toFixed(1)} pts
                        </span>
                        <span className="text-[10px] text-slate-500 block">/ €10M value</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>The &quot;Money vs Pitch&quot; Index:</strong> Evaluates commercial expenditure efficacy by dividing competition points earned by total squad market capital in units of €10M.
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
