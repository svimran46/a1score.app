"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { formatCompactEur, formatDate } from "@/lib/utils";
import { Sparkles, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MarketValuePoint {
  id: string;
  date: string | Date;
  valueEur: number;
  clubName?: string | null;
}

interface TransferItem {
  id: string;
  fromClubName?: string | null;
  toClubName?: string | null;
  date: string | Date;
  feeEur?: number | null;
  transferType?: string | null;
}

interface MarketValueChartProps {
  data: MarketValuePoint[];
  playerName?: string;
  transfers?: TransferItem[];
  dateOfBirth?: string | Date | null;
}

export function MarketValueChart({
  data,
  playerName,
  transfers = [],
  dateOfBirth,
}: MarketValueChartProps) {
  const [timeRange, setTimeRange] = useState<"ALL" | "3Y" | "1Y">("ALL");

  // Filter only points that have a valid date and numeric value
  const validPoints = useMemo(() => {
    return (data || []).filter((p) => {
      if (!p || !p.date) return false;
      const t = new Date(p.date).getTime();
      return !isNaN(t) && typeof p.valueEur === "number" && !isNaN(p.valueEur);
    });
  }, [data]);

  // Pre-calculate full timeline
  const fullTimeline = useMemo(() => {
    if (validPoints.length === 0) return [];

    const sorted = [...validPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sorted.map((point, idx) => {
      const prev = idx > 0 ? sorted[idx - 1] : null;
      const diffFromPrev = prev ? point.valueEur - prev.valueEur : 0;
      const pctFromPrev = prev && prev.valueEur > 0 ? (diffFromPrev / prev.valueEur) * 100 : 0;

      // Check if any transfer occurred near this date (within 60 days)
      const pointTime = new Date(point.date).getTime();
      const nearbyTransfer = (transfers || []).find((t) => {
        if (!t || !t.date) return false;
        const tTime = new Date(t.date).getTime();
        if (isNaN(tTime)) return false;
        return Math.abs(pointTime - tTime) <= 60 * 24 * 60 * 60 * 1000;
      });

      return {
        id: point.id || `val-${idx}`,
        dateStr: formatDate(point.date),
        rawDate: point.date,
        timestamp: pointTime,
        value: point.valueEur,
        club: point.clubName || "Club",
        diffFromPrev,
        pctFromPrev,
        transferNote: nearbyTransfer
          ? `${nearbyTransfer.fromClubName || "Unknown"} → ${nearbyTransfer.toClubName || "Unknown"}`
          : null,
      };
    });
  }, [validPoints, transfers]);

  // Overall peak calculation
  const overallPeak = useMemo(() => {
    if (fullTimeline.length === 0) return null;
    return [...fullTimeline].sort((a, b) => b.value - a.value)[0];
  }, [fullTimeline]);

  // Filtered dataset for selected time range
  const filteredData = useMemo(() => {
    if (fullTimeline.length === 0) return [];
    if (timeRange === "ALL" || fullTimeline.length <= 4) return fullTimeline;

    const latestTime = fullTimeline[fullTimeline.length - 1].timestamp;
    const cutoffYears = timeRange === "1Y" ? 1 : 3;
    const cutoffTime = latestTime - cutoffYears * 365.25 * 24 * 60 * 60 * 1000;

    const filtered = fullTimeline.filter((p) => p.timestamp >= cutoffTime);
    return filtered.length >= 2 ? filtered : fullTimeline.slice(-4);
  }, [fullTimeline, timeRange]);

  // Calculate age at peak if DOB available (unconditional hook order)
  const ageAtPeak = useMemo(() => {
    if (!dateOfBirth || !overallPeak) return null;
    const birthYear = new Date(dateOfBirth).getFullYear();
    const peakYear = new Date(overallPeak.rawDate).getFullYear();
    const age = peakYear - birthYear;
    return age > 0 ? age : null;
  }, [dateOfBirth, overallPeak]);

  if (fullTimeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 rounded-2xl glass-panel border border-slate-800">
        <p className="text-sm">No historical market valuation records available yet.</p>
      </div>
    );
  }

  const latest = fullTimeline[fullTimeline.length - 1];
  const isAtPeak = overallPeak && latest ? latest.value >= overallPeak.value : false;
  const deltaFromPeak = overallPeak && latest ? Math.max(0, overallPeak.value - latest.value) : 0;
  const deltaPct = overallPeak && overallPeak.value > 0
    ? Math.round((deltaFromPeak / overallPeak.value) * 100)
    : 0;

  return (
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      {/* Header and Financial Barometer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Market Value Progression</h3>
            {isAtPeak ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                All-Time High
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800/90 text-slate-300 border border-slate-700 tabular-nums">
                -{formatCompactEur(deltaFromPeak)} (-{deltaPct}%) from peak
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Valuation trajectory &amp; career peak benchmarks
          </p>
        </div>

        {/* Metrics & Time Range Selector */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
          <div className="flex items-center gap-5">
            <div className="flex flex-col">
              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                Current Value
              </span>
              <span className="text-amber-400 font-extrabold text-base tabular-nums">
                {formatCompactEur(latest?.value)}
              </span>
            </div>
            <div className="h-7 w-[1px] bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                Career Peak
              </span>
              <span className="text-white font-extrabold text-base tabular-nums flex items-center gap-1">
                {formatCompactEur(overallPeak?.value)}
                {ageAtPeak && (
                  <span className="text-[11px] font-normal text-slate-400">
                    ({ageAtPeak} y/o)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Time range pills */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
            {(["ALL", "3Y", "1Y"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  timeRange === range
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas: fluid height across mobile, tablet, desktop and TV */}
      <div className="h-[280px] sm:h-[340px] lg:h-[400px] 3xl:h-[480px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 15, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="valGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#182030" vertical={false} />
            <XAxis
              dataKey="dateStr"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactEur(v)}
            />
            <Tooltip
              wrapperStyle={{ outline: "none", zIndex: 50 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const isGain = d.diffFromPrev > 0;
                  const isLoss = d.diffFromPrev < 0;

                  return (
                    <div className="rounded-2xl glass-panel p-3.5 shadow-2xl border border-amber-500/30 bg-slate-950/95 text-xs space-y-2 min-w-[200px]">
                      <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1.5 border-b border-slate-800/80">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {d.dateStr}
                        </span>
                        <span className="truncate max-w-[100px] font-semibold text-slate-300">
                          {d.club}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xl font-black text-amber-400 tabular-nums">
                          {formatCompactEur(d.value)}
                        </div>

                        {d.diffFromPrev !== 0 && (
                          <div
                            className={`flex items-center gap-1 text-[11px] font-bold tabular-nums ${
                              isGain ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isGain ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {isGain ? "+" : ""}
                              {formatCompactEur(d.diffFromPrev)} ({d.pctFromPrev.toFixed(1)}%)
                            </span>
                          </div>
                        )}
                      </div>

                      {d.transferNote && (
                        <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-amber-300 font-medium truncate">
                          Transfer: {d.transferNote}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Peak Reference Dot Marker */}
            {overallPeak && (
              <ReferenceDot
                x={overallPeak.dateStr}
                y={overallPeak.value}
                r={5}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={2}
              />
            )}

            <Area
              type="monotone"
              dataKey="value"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#valGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
