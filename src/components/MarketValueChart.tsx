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
 * - Line chart with 1 accent color (gold).
 * - Peak marked with dot and caption "Peak €180M".
 * - Labeled axes, no gradients, no glows.
 * - Single surface card container (radius 12, border 1px).
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
    <div
      className="rounded-[12px] p-4 overflow-hidden"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        borderWidth: "1px",
      }}
    >
      {/* Top row: Peak caption left, Time range right */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b" style={{ borderColor: "var(--color-border)" }}>
        <span
          className="text-[13px] font-normal"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {overallPeak ? `Peak ${formatCompactEur(overallPeak.value)}` : ""}
        </span>

        {/* Segmented control for range */}
        <div
          className="flex items-center p-0.5 rounded-[8px]"
          style={{ backgroundColor: "var(--color-surface-2)" }}
        >
          {(["ALL", "3Y", "1Y"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className="px-2.5 py-1 rounded-[6px] text-[13px] font-medium transition-colors"
              style={{
                color: timeRange === range ? "var(--color-accent)" : "var(--color-text-secondary)",
                backgroundColor: timeRange === range ? "var(--color-surface)" : "transparent",
              }}
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="dateStr"
              stroke="var(--color-text-secondary)"
              fontSize={13}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              stroke="var(--color-text-secondary)"
              fontSize={13}
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
                    <div
                      className="p-2.5 rounded-[8px] border text-[13px]"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                      }}
                    >
                      <div className="font-semibold text-[15px]" style={{ color: "var(--color-accent)" }}>
                        {formatCompactEur(d.value)}
                      </div>
                      <div className="mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        {d.dateStr}
                      </div>
                      {d.club && (
                        <div className="mt-0.5" style={{ color: "var(--color-text)" }}>
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
              stroke="var(--color-accent)"
              strokeWidth={2}
              fill="transparent"
            />
            {overallPeak && (
              <ReferenceDot
                x={overallPeak.dateStr}
                y={overallPeak.value}
                r={4}
                fill="var(--color-accent)"
                stroke="var(--color-surface)"
                strokeWidth={2}
              />
            )}
            {latest && (
              <ReferenceDot
                x={latest.dateStr}
                y={latest.value}
                r={4}
                fill="var(--color-accent)"
                stroke="var(--color-surface)"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
