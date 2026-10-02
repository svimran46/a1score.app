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
import { Card, Chip } from "@/components/ui";

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

/**
 * a1score MarketValueChart:
 * - Line chart with valuation accent token (--value-text).
 * - Peak marked with dot and caption.
 * - Labeled axes, accessible tooltips, legend, and screen-reader summary.
 * - Time range chips (1Y / 3Y / ALL).
 * - Single surface Card container (no borders).
 */
export function MarketValueChart({
  data,
  playerName,
  transfers = [],
  dateOfBirth,
}: MarketValueChartProps) {
  const [timeRange, setTimeRange] = useState<"ALL" | "3Y" | "1Y">("ALL");

  const validPoints = useMemo(() => {
    return (data || []).filter((p) => {
      if (!p || !p.date) return false;
      const t = new Date(p.date).getTime();
      return !isNaN(t) && typeof p.valueEur === "number" && !isNaN(p.valueEur);
    });
  }, [data]);

  const fullTimeline = useMemo(() => {
    if (validPoints.length === 0) return [];

    const sorted = [...validPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sorted.map((point, idx) => {
      const prev = idx > 0 ? sorted[idx - 1] : null;
      const diffFromPrev = prev ? point.valueEur - prev.valueEur : 0;
      const pctFromPrev = prev && prev.valueEur > 0 ? (diffFromPrev / prev.valueEur) * 100 : 0;
      const pointTime = new Date(point.date).getTime();

      return {
        id: point.id || `val-${idx}`,
        dateStr: formatDate(point.date),
        rawDate: point.date,
        timestamp: pointTime,
        value: point.valueEur,
        club: point.clubName || "Club",
        diffFromPrev,
        pctFromPrev,
      };
    });
  }, [validPoints]);

  const overallPeak = useMemo(() => {
    if (fullTimeline.length === 0) return null;
    return [...fullTimeline].sort((a, b) => b.value - a.value)[0];
  }, [fullTimeline]);

  const filteredData = useMemo(() => {
    if (fullTimeline.length === 0) return [];
    if (timeRange === "ALL" || fullTimeline.length <= 4) return fullTimeline;

    const latestTime = fullTimeline[fullTimeline.length - 1].timestamp;
    const cutoffYears = timeRange === "1Y" ? 1 : 3;
    const cutoffTime = latestTime - cutoffYears * 365.25 * 24 * 60 * 60 * 1000;

    const filtered = fullTimeline.filter((p) => p.timestamp >= cutoffTime);
    return filtered.length >= 2 ? filtered : fullTimeline.slice(-4);
  }, [fullTimeline, timeRange]);

  if (fullTimeline.length === 0) {
    return null;
  }

  const latest = fullTimeline[fullTimeline.length - 1];

  return (
    <Card className="p-4 sm:p-5 overflow-hidden">
      {/* Screen Reader Accessible Summary */}
      <div className="sr-only" aria-live="polite">
        {playerName || "Player"} market valuation history: currently valued at {formatCompactEur(latest.value)} as of {latest.dateStr}, with an all-time peak of {overallPeak ? formatCompactEur(overallPeak.value) : "N/A"}.
      </div>

      {/* Top row: Peak caption left, Time range chips right */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-[var(--divider)]">
        <div>
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
            Valuation History
          </span>
          {overallPeak && (
            <span className="text-sm font-bold text-[var(--value-text)] tabular-nums mt-0.5 block">
              Peak: {formatCompactEur(overallPeak.value)} ({overallPeak.dateStr})
            </span>
          )}
          <p className="sr-only">
            Valuation history chart for {playerName || "player"}. Latest market valuation is {formatCompactEur(latest.value)} recorded on {latest.dateStr}. All-time peak valuation is {overallPeak ? `${formatCompactEur(overallPeak.value)} recorded on ${overallPeak.dateStr}` : "not available"}.
          </p>
        </div>

        {/* Range Chips */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-page)] p-1 rounded-xl">
          {(["ALL", "3Y", "1Y"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                timeRange === range
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[240px] sm:h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
            <XAxis
              dataKey="dateStr"
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactEur(v)}
              domain={[0, "dataMax + 10000000"]}
              dx={-4}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--divider)] shadow-lg text-xs">
                      <div className="font-extrabold text-sm text-[var(--value-text)] tabular-nums">
                        {formatCompactEur(d.value)}
                      </div>
                      <div className="mt-1 text-[var(--text-muted)] font-medium">
                        {d.dateStr}
                      </div>
                      {d.club && (
                        <div className="mt-0.5 text-[var(--text-primary)] font-semibold">
                          {d.club}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--value-text)"
              strokeWidth={2.5}
              fill="transparent"
            />
            {overallPeak && (
              <ReferenceDot
                x={overallPeak.dateStr}
                y={overallPeak.value}
                r={4.5}
                fill="var(--value-text)"
                stroke="var(--bg-card)"
                strokeWidth={2}
              />
            )}
            {latest && (
              <ReferenceDot
                x={latest.dateStr}
                y={latest.value}
                r={4.5}
                fill="var(--value-text)"
                stroke="var(--bg-card)"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-[var(--divider)] text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--value-text)] shrink-0" />
          <span className="font-medium">Market Valuation Trend (€ EUR)</span>
        </div>
        <span className="tabular-nums">
          Latest: <strong className="text-[var(--text-primary)]">{formatCompactEur(latest.value)}</strong>
        </span>
      </div>
    </Card>
  );
}
