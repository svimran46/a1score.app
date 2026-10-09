"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCompactEur, formatDate } from "@/lib/utils";
import { TrendingUp, Eye, EyeOff } from "lucide-react";

export interface ClubSnapshotPoint {
  id?: string;
  date: string | Date;
  totalMarketValue: number | bigint;
  squadSize?: number | null;
}

interface ClubValueTrendChartProps {
  snapshots: ClubSnapshotPoint[];
  clubName: string;
}

export function ClubValueTrendChart({ snapshots, clubName }: ClubValueTrendChartProps) {
  const [showTable, setShowTable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // Filter valid points and sort chronologically
  const validTimeline = useMemo(() => {
    if (!Array.isArray(snapshots) || snapshots.length === 0) return [];

    return snapshots
      .map((s) => {
        const d = new Date(s.date);
        const val = Number(s.totalMarketValue);
        return {
          date: d,
          dateStr: formatDate(d),
          timestamp: d.getTime(),
          value: val,
          squadSize: s.squadSize,
        };
      })
      .filter((s) => !isNaN(s.timestamp) && !isNaN(s.value) && s.value > 0)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [snapshots]);

  // INVARIANT: "if snapshots exist; otherwise show nothing"
  if (validTimeline.length < 2) {
    return null;
  }

  const firstPoint = validTimeline[0];
  const latestPoint = validTimeline[validTimeline.length - 1];
  const delta = latestPoint.value - firstPoint.value;
  const deltaPct = firstPoint.value > 0 ? (delta / firstPoint.value) * 100 : 0;
  const isGain = delta > 0;

  return (
    <div
      role="region"
      aria-label={`${clubName} squad market value trend chart`}
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--divider)]">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--value-text)]" />
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
              Squad Value Trend
            </h3>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Total squad market valuation recorded over time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Trend Delta Pill */}
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums border ${
              isGain
                ? "bg-trend-up/10 text-trend-up border-trend-up/20"
                : delta < 0
                ? "bg-trend-down/10 text-trend-down border-trend-down/20"
                : "bg-[var(--bg-chip)] text-[var(--text-muted)] border-transparent"
            }`}
          >
            {isGain ? "+" : ""}
            {formatCompactEur(delta)} ({isGain ? "+" : ""}
            {deltaPct.toFixed(1)}%)
          </div>

          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            aria-expanded={showTable}
          >
            {showTable ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showTable ? "Chart" : "Table"}</span>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-56 sm:h-72" aria-hidden={showTable ? "true" : undefined}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={validTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="clubValGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--value-text)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--value-text)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
            <XAxis
              dataKey="dateStr"
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle)" }}
              dy={6}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle)" }}
              tickFormatter={(v) => formatCompactEur(v)}
              width={55}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const point = payload[0].payload;
                return (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 shadow-lg text-xs space-y-1">
                    <p className="font-bold text-[var(--text-primary)] border-b border-[var(--divider)] pb-1">
                      {label}
                    </p>
                    <p className="font-mono font-bold text-[var(--value-text)] figure text-sm tabular-nums">
                      {formatCompactEur(point.value)}
                    </p>
                    {point.squadSize && (
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {point.squadSize} squad members
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Squad Valuation"
              stroke="var(--value-text)"
              strokeWidth={2.5}
              fill="url(#clubValGrad)"
              dot={{ r: 3, fill: "var(--value-text)" }}
              activeDot={{ r: 5 }}
              isAnimationActive={!reducedMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible Table */}
      {showTable && (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
          <table className="w-full text-left text-xs border-collapse" aria-label="Squad value trend table">
            <thead>
              <tr className="border-b border-[var(--divider)] text-[var(--text-muted)]">
                <th className="p-2 font-bold uppercase text-[10px]">Date</th>
                <th className="p-2 font-bold uppercase text-[10px]">Squad Value</th>
                <th className="p-2 font-bold uppercase text-[10px]">Squad Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divider)]">
              {validTimeline.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-hover)]">
                  <td className="p-2 font-medium text-[var(--text-primary)]">{row.dateStr}</td>
                  <td className="p-2 font-mono font-bold text-[var(--value-text)] figure tabular-nums">
                    {formatCompactEur(row.value)}
                  </td>
                  <td className="p-2 text-[var(--text-muted)] tabular-nums">
                    {row.squadSize ? `${row.squadSize} players` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
