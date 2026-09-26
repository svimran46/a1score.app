"use client";

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

interface MarketValuePoint {
  id: string;
  date: string | Date;
  valueEur: number;
  clubName?: string | null;
}

interface MarketValueChartProps {
  data: MarketValuePoint[];
  playerName?: string;
}

export function MarketValueChart({ data, playerName }: MarketValueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 rounded-2xl glass-panel">
        <p className="text-sm">No historical market valuation records available yet.</p>
      </div>
    );
  }

  // Format data for chart
  const formattedData = data.map((point) => ({
    dateStr: formatDate(point.date),
    timestamp: new Date(point.date).getTime(),
    value: point.valueEur,
    club: point.clubName || "Unknown Club",
  }));

  const latest = formattedData[formattedData.length - 1];
  const peak = [...formattedData].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Market Value Progression</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Valuation trajectory over career duration
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400 uppercase tracking-wider font-semibold">Current Value</span>
            <span className="text-emerald-400 font-extrabold text-base">
              {formatCompactEur(latest?.value)}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-slate-400 uppercase tracking-wider font-semibold">Career Peak</span>
            <span className="text-white font-extrabold text-base">
              {formatCompactEur(peak?.value)}
            </span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="valGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="dateStr"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactEur(v)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-xl glass-panel p-3 shadow-xl border border-slate-700/80 bg-slate-900/95 text-xs space-y-1">
                      <p className="font-semibold text-slate-200">{d.dateStr}</p>
                      <p className="text-emerald-400 font-bold text-sm">
                        {formatCompactEur(d.value)}
                      </p>
                      <p className="text-slate-400">{d.club}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
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
