"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCompactEur } from "@/lib/utils";
import { mergeValuationTimelines } from "@/lib/compare";
import { Table, Eye, EyeOff } from "lucide-react";

export interface ComparePlayerChartMeta {
  slug: string;
  name: string;
  currentValue: number;
  marketValues: Array<{ date: string | Date; valueEur: number }>;
}

interface CompareValuationChartProps {
  players: ComparePlayerChartMeta[];
}

const LINE_CONFIGS = [
  {
    dash: "",
    dashName: "Solid",
    symbol: "●",
    stroke: "var(--compare-line-1, var(--value-text))",
    pointShape: "circle",
  },
  {
    dash: "6 4",
    dashName: "Dashed",
    symbol: "■",
    stroke: "var(--compare-line-2, var(--blue-500))",
    pointShape: "square",
  },
  {
    dash: "2 3",
    dashName: "Dotted",
    symbol: "▲",
    stroke: "var(--compare-line-3, var(--green-500))",
    pointShape: "triangle",
  },
];

export function CompareValuationChart({ players }: CompareValuationChartProps) {
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

  const timelineData = useMemo(() => {
    return mergeValuationTimelines(players);
  }, [players]);

  const hasData = timelineData.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center space-y-2">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          No historical valuation data available
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Valuation history will display once snapshot points are recorded.
        </p>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Player valuation comparison chart"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-4"
    >
      {/* Header & Accessibility Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--divider)]">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
            Market Valuation Trajectory
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Real historical valuation points plotted chronologically.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          aria-expanded={showTable}
        >
          {showTable ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showTable ? "Hide Data Table" : "View Data Table"}</span>
        </button>
      </div>

      {/* Accessible Non-Color-Alone Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
        {players.map((p, idx) => {
          const config = LINE_CONFIGS[idx % LINE_CONFIGS.length];
          return (
            <div key={p.slug} className="flex items-center gap-2">
              <span
                className="font-mono text-sm leading-none"
                style={{ color: config.stroke }}
                aria-hidden="true"
              >
                {config.symbol}
              </span>
              <span className="font-semibold text-[var(--text-primary)]">{p.name}</span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                ({config.dashName})
              </span>
              <span className="font-mono font-bold text-[var(--value-text)] figure tabular-nums ml-0.5">
                {formatCompactEur(p.currentValue)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recharts Line Chart */}
      <div className="w-full h-64 sm:h-80" aria-hidden={showTable ? "true" : undefined}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                return (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 shadow-lg text-xs space-y-1.5">
                    <p className="font-bold text-[var(--text-primary)] border-b border-[var(--divider)] pb-1">
                      {label}
                    </p>
                    {payload.map((entry: any, i: number) => {
                      if (entry.value == null) return null;
                      const player = players.find((pl) => pl.slug === entry.dataKey);
                      const config = LINE_CONFIGS[i % LINE_CONFIGS.length];
                      return (
                        <div key={i} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: config.stroke }}>{config.symbol}</span>
                            <span className="text-[var(--text-secondary)]">{player?.name || entry.dataKey}</span>
                          </div>
                          <span className="font-mono font-bold text-[var(--value-text)] figure tabular-nums">
                            {formatCompactEur(entry.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            {players.map((p, idx) => {
              const config = LINE_CONFIGS[idx % LINE_CONFIGS.length];
              return (
                <Line
                  key={p.slug}
                  type="monotone"
                  dataKey={p.slug}
                  name={p.name}
                  stroke={config.stroke}
                  strokeWidth={2.5}
                  strokeDasharray={config.dash || undefined}
                  dot={{ r: 3.5, strokeWidth: 1.5, fill: "var(--bg-card)" }}
                  activeDot={{ r: 6 }}
                  connectNulls={true}
                  isAnimationActive={!reducedMotion}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible Data Table Fallback */}
      {showTable && (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
          <table className="w-full text-left text-xs border-collapse" aria-label="Valuation history table">
            <thead>
              <tr className="border-b border-[var(--divider)] text-[var(--text-muted)]">
                <th className="p-2 font-bold uppercase text-[10px]">Date</th>
                {players.map((p, i) => (
                  <th key={p.slug} className="p-2 font-bold uppercase text-[10px]">
                    {LINE_CONFIGS[i % LINE_CONFIGS.length].symbol} {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divider)]">
              {timelineData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-hover)]">
                  <td className="p-2 font-medium text-[var(--text-primary)]">{row.dateStr}</td>
                  {players.map((p) => (
                    <td key={p.slug} className="p-2 font-mono tabular-nums text-[var(--text-secondary)]">
                      {row[p.slug] ? formatCompactEur(row[p.slug]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
