"use client";

import { useMemo } from "react";
import { formatCompactEur } from "@/lib/utils";
import { Scale, AlertTriangle, ShieldCheck, Info } from "lucide-react";

export interface TeamLineupCoverage {
  valuedCount: number;
  totalStarters: number;
}

interface MatchFinancialBarometerProps {
  homeName: string;
  awayName: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeValue?: number | null;
  awayValue?: number | null;
  homeCoverage?: TeamLineupCoverage;
  awayCoverage?: TeamLineupCoverage;
  isLive: boolean;
  isFinished: boolean;
  isUpcoming: boolean;
}

export function MatchFinancialBarometer({
  homeName,
  awayName,
  homeScore = 0,
  awayScore = 0,
  homeValue = 0,
  awayValue = 0,
  homeCoverage,
  awayCoverage,
  isLive,
  isFinished,
  isUpcoming,
}: MatchFinancialBarometerProps) {
  const hVal = homeValue || 0;
  const aVal = awayValue || 0;

  const total = hVal + aVal;

  const analysis = useMemo(() => {
    if (total === 0) return null;

    const homePct = Math.round((hVal / total) * 100);
    const awayPct = 100 - homePct;

    const higherValTeam = hVal >= aVal ? homeName : awayName;
    const lowerValTeam = hVal >= aVal ? awayName : homeName;
    const minVal = Math.min(hVal, aVal);
    const maxVal = Math.max(hVal, aVal);
    const ratio = minVal > 0 ? (maxVal / minVal).toFixed(1) : "1.0";
    const gapEur = maxVal - minVal;

    const homeValued = homeCoverage?.valuedCount ?? 11;
    const homeTotalCount = homeCoverage?.totalStarters ?? 11;
    const awayValued = awayCoverage?.valuedCount ?? 11;
    const awayTotalCount = awayCoverage?.totalStarters ?? 11;

    // Minimum coverage threshold: at least 8/11 valued on both sides (approx 72%)
    const isCoverageSufficient = homeValued >= 8 && awayValued >= 8;

    // Value vs Result logic
    let verdict = "Financial Parity Preview";
    let isUpset = false;
    let isProvisional = !isCoverageSufficient;

    const hScore = homeScore ?? 0;
    const aScore = awayScore ?? 0;

    if (!isCoverageSufficient) {
      verdict = `Provisional Lineup Coverage (${homeValued}/${homeTotalCount} vs ${awayValued}/${awayTotalCount} valued): Disparity multiplier qualified until verified valuations are confirmed for full starting XIs.`;
    } else if (!isUpcoming) {
      if (hScore === aScore) {
        verdict =
          gapEur > 50000000
            ? `Tactical Resistance: ${lowerValTeam} holding parity despite a €${formatCompactEur(gapEur)} squad disparity.`
            : "Evenly balanced tactical battle mirroring near-equal market valuations.";
      } else {
        const winningTeam = hScore > aScore ? homeName : awayName;
        if (winningTeam === lowerValTeam) {
          isUpset = true;
          verdict = `🔥 Underdog Value Resistance: ${winningTeam} outperforming a ${ratio}x (€${formatCompactEur(gapEur)}) squad valuation deficit!`;
        } else {
          verdict = `Expected Market Superiority: ${higherValTeam} capitalizing on their ${ratio}x financial depth advantage.`;
        }
      }
    } else {
      verdict =
        gapEur > 50000000
          ? `Pre-match financial disparity: ${higherValTeam} holds a ${ratio}x (€${formatCompactEur(gapEur)}) squad valuation edge.`
          : `Evenly priced fixture: Both squads enter with comparable market valuation depth.`;
    }

    return {
      homePct,
      awayPct,
      higherValTeam,
      lowerValTeam,
      ratio,
      gapEur,
      verdict,
      isUpset,
      isProvisional,
      homeValued,
      homeTotalCount,
      awayValued,
      awayTotalCount,
    };
  }, [hVal, aVal, total, homeName, awayName, homeScore, awayScore, isUpcoming, homeCoverage, awayCoverage]);

  if (!analysis || total === 0) return null;

  return (
    <div className="rounded-3xl glass-panel p-4 sm:p-6 border border-slate-800 bg-gradient-to-r from-slate-900/60 via-slate-950/80 to-slate-900/60 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80 gap-1 sm:gap-2">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Financial Parity &amp; Value-to-Pitch Index
          </h3>
        </div>
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Starting XI Comparison
        </span>
      </div>

      {/* Disparity Bar & Numbers */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 items-center text-xs gap-2">
          {/* Home */}
          <div className="space-y-0.5 min-w-0">
            <span className="font-semibold text-slate-300 block truncate">{homeName}</span>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5">
              <span className="text-amber-400 font-black text-sm tabular-nums whitespace-nowrap">
                {formatCompactEur(hVal)}
              </span>
              {homeCoverage && (
                <span className="text-[10px] text-slate-400 font-semibold tabular-nums whitespace-nowrap">
                  ({analysis.homeValued}/{analysis.homeTotalCount} valued)
                </span>
              )}
            </div>
          </div>

          {/* Ratio */}
          <div className="text-center min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block truncate">
              Disparity
            </span>
            <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 tabular-nums inline-block">
              {analysis.isProvisional ? "~" : ""}{analysis.ratio}x
            </span>
          </div>

          {/* Away */}
          <div className="space-y-0.5 text-right min-w-0">
            <span className="font-semibold text-slate-300 block truncate">{awayName}</span>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-end gap-0.5 sm:gap-1.5">
              <span className="text-amber-400 font-black text-sm tabular-nums whitespace-nowrap">
                {formatCompactEur(aVal)}
              </span>
              {awayCoverage && (
                <span className="text-[10px] text-slate-400 font-semibold tabular-nums whitespace-nowrap">
                  ({analysis.awayValued}/{analysis.awayTotalCount} valued)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dual Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${analysis.homePct}%` }}
          />
          <div
            className="h-full bg-slate-600 transition-all"
            style={{ width: `${analysis.awayPct}%` }}
          />
        </div>
      </div>

      {/* Narrative Synthesis */}
      <div
        className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
          analysis.isProvisional
            ? "bg-slate-900/90 border-amber-500/30 text-amber-300/90"
            : analysis.isUpset
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
            : "bg-slate-900/80 border-slate-800/80 text-slate-300"
        }`}
      >
        {analysis.isProvisional ? (
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
        ) : analysis.isUpset ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        )}
        <span className="leading-relaxed font-medium">{analysis.verdict}</span>
      </div>
    </div>
  );
}
