"use client";

import { useMemo, useState } from "react";
import { EntityImage } from "./EntityImage";
import Link from "next/link";
import { formatCompactEur, formatEur } from "@/lib/utils";
import {
  Layers,
  PieChart,
  Shield,
  TrendingUp,
  UserCheck,
  Globe,
  Calendar,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export interface SquadPlayer {
  id: string;
  fullName: string;
  commonName?: string | null;
  position: string;
  subPosition?: string | null;
  age?: number | null;
  dateOfBirth?: string | Date | null;
  nationality?: string[];
  latestMarketValue?: number | null;
  photoUrl?: string | null;
  sourceId?: string | null;
  externalId?: string | null;
  slug?: string | null;
  number?: number | null;
}

interface SquadValuationPyramidProps {
  players: SquadPlayer[];
  totalSquadValue: number;
  clubName: string;
}

interface ValuationTier {
  name: string;
  rangeLabel: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  players: SquadPlayer[];
  totalValue: number;
  pct: number;
}

export function SquadValuationPyramid({
  players,
  totalSquadValue,
  clubName,
}: SquadValuationPyramidProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // 1. Calculate Demographic Metrics
  const demographics = useMemo(() => {
    if (!players || players.length === 0) {
      return {
        avgAge: null,
        foreignRatio: 0,
        topAssetRatio: 0,
        topPlayer: null,
      };
    }

    // Average age
    let totalAge = 0;
    let ageCount = 0;
    const currentYear = new Date().getFullYear();

    players.forEach((p) => {
      if (typeof p.age === "number" && p.age > 0) {
        totalAge += p.age;
        ageCount++;
      } else if (p.dateOfBirth) {
        const birthYear = new Date(p.dateOfBirth).getFullYear();
        if (!isNaN(birthYear) && birthYear > 1960) {
          totalAge += currentYear - birthYear;
          ageCount++;
        }
      }
    });

    const avgAge = ageCount > 0 ? (totalAge / ageCount).toFixed(1) : null;

    // Top asset concentration
    const sorted = [...players].sort(
      (a, b) => (b.latestMarketValue || 0) - (a.latestMarketValue || 0)
    );
    const topPlayer = sorted[0] || null;
    const topVal = topPlayer?.latestMarketValue || 0;
    const topAssetRatio =
      totalSquadValue > 0 ? Math.round((topVal / totalSquadValue) * 100) : 0;

    return {
      avgAge,
      topAssetRatio,
      topPlayer,
    };
  }, [players, totalSquadValue]);

  // 2. Financial Valuation Tiers
  const tiers: ValuationTier[] = useMemo(() => {
    const validTotal = totalSquadValue || 1;

    const elite: SquadPlayer[] = [];
    const starters: SquadPlayer[] = [];
    const core: SquadPlayer[] = [];
    const rotation: SquadPlayer[] = [];

    players.forEach((p) => {
      const val = p.latestMarketValue || 0;
      if (val >= 50_000_000) {
        elite.push(p);
      } else if (val >= 20_000_000) {
        starters.push(p);
      } else if (val >= 5_000_000) {
        core.push(p);
      } else {
        rotation.push(p);
      }
    });

    const buildTier = (
      name: string,
      rangeLabel: string,
      min: number,
      max: number,
      color: string,
      bgColor: string,
      borderColor: string,
      badgeBg: string,
      list: SquadPlayer[]
    ): ValuationTier => {
      const tierVal = list.reduce(
        (sum, p) => sum + (p.latestMarketValue || 0),
        0
      );
      return {
        name,
        rangeLabel,
        min,
        max,
        color,
        bgColor,
        borderColor,
        badgeBg,
        players: list.sort(
          (a, b) => (b.latestMarketValue || 0) - (a.latestMarketValue || 0)
        ),
        totalValue: tierVal,
        pct: Math.round((tierVal / validTotal) * 100),
      };
    };

    return [
      buildTier(
        "World Class / Elite",
        "€50M+",
        50_000_000,
        Infinity,
        "text-amber-400",
        "bg-amber-500/10",
        "border-amber-500/30",
        "bg-amber-400",
        elite
      ),
      buildTier(
        "Key Starters",
        "€20M – €50M",
        20_000_000,
        50_000_000,
        "text-emerald-400",
        "bg-emerald-500/10",
        "border-emerald-500/30",
        "bg-emerald-400",
        starters
      ),
      buildTier(
        "Core Squad",
        "€5M – €20M",
        5_000_000,
        20_000_000,
        "text-blue-400",
        "bg-blue-500/10",
        "border-blue-500/30",
        "bg-blue-400",
        core
      ),
      buildTier(
        "Rotation / Prospects",
        "< €5M",
        0,
        5_000_000,
        "text-slate-400",
        "bg-slate-800/40",
        "border-slate-700/50",
        "bg-slate-400",
        rotation
      ),
    ];
  }, [players, totalSquadValue]);

  // 3. Positional Valuation Allocation
  const positionalBreakdown = useMemo(() => {
    const posGroups: Record<
      string,
      { title: string; color: string; barColor: string; players: SquadPlayer[] }
    > = {
      Goalkeeper: {
        title: "Goalkeepers",
        color: "text-amber-400",
        barColor: "bg-amber-400",
        players: [],
      },
      Defender: {
        title: "Defenders",
        color: "text-blue-400",
        barColor: "bg-blue-500",
        players: [],
      },
      Midfield: {
        title: "Midfielders",
        color: "text-emerald-400",
        barColor: "bg-emerald-400",
        players: [],
      },
      Attack: {
        title: "Attackers",
        color: "text-rose-400",
        barColor: "bg-rose-500",
        players: [],
      },
    };

    players.forEach((p) => {
      const pos = (p.position || "").toLowerCase();
      if (pos.includes("goal") || pos === "gk") {
        posGroups.Goalkeeper.players.push(p);
      } else if (
        pos.includes("def") ||
        pos.includes("back") ||
        pos === "cb" ||
        pos === "lb" ||
        pos === "rb"
      ) {
        posGroups.Defender.players.push(p);
      } else if (
        pos.includes("mid") ||
        pos === "cm" ||
        pos === "dm" ||
        pos === "am"
      ) {
        posGroups.Midfield.players.push(p);
      } else {
        posGroups.Attack.players.push(p);
      }
    });

    const validTotal = totalSquadValue || 1;

    return Object.entries(posGroups).map(([key, group]) => {
      const groupVal = group.players.reduce(
        (sum, p) => sum + (p.latestMarketValue || 0),
        0
      );
      const pct = Math.round((groupVal / validTotal) * 100);
      return {
        key,
        title: group.title,
        color: group.color,
        barColor: group.barColor,
        count: group.players.length,
        totalVal: groupVal,
        pct,
      };
    });
  }, [players, totalSquadValue]);

  const activeTierObj = tiers.find((t) => t.name === selectedTier);

  return (
    <div className="space-y-6">
      {/* Squad Demographic & Concentration Barometer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Average Squad Age */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Average Squad Age
            </span>
            <div className="text-xl font-black text-white tracking-tight tabular-nums mt-0.5">
              {demographics.avgAge ? `${demographics.avgAge} yrs` : "N/A"}
            </div>
            <span className="text-[10px] text-slate-500">
              {clubName} Senior Squad
            </span>
          </div>
        </div>

        {/* Metric 2: Top Asset Concentration */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Top Asset Concentration
            </span>
            <div className="text-xl font-black text-amber-400 tracking-tight tabular-nums mt-0.5">
              {demographics.topAssetRatio}%
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              Held by {demographics.topPlayer?.commonName || demographics.topPlayer?.fullName || "Top Star"} (
              {formatCompactEur(demographics.topPlayer?.latestMarketValue || 0)})
            </span>
          </div>
        </div>

        {/* Metric 3: Squad Depth & Distribution */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Squad Valuation Depth
            </span>
            <div className="text-xl font-black text-emerald-400 tracking-tight tabular-nums mt-0.5">
              {tiers[0].players.length + tiers[1].players.length} Key Assets
            </div>
            <span className="text-[10px] text-slate-500">
              Players valued &ge; €20M
            </span>
          </div>
        </div>
      </div>

      {/* Main Valuation Pyramid & Positional Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Financial Valuation Pyramid (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl glass-panel p-6 sm:p-7 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Squad Valuation Pyramid
                </h3>
                <p className="text-xs text-slate-400">
                  Capital tier distribution across registered squad
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full tabular-nums">
              Total {formatCompactEur(totalSquadValue)}
            </span>
          </div>

          {/* Pyramid Tiers */}
          <div className="space-y-3">
            {tiers.map((tier) => {
              const isSelected = selectedTier === tier.name;
              return (
                <div
                  key={tier.name}
                  onClick={() =>
                    setSelectedTier(isSelected ? null : tier.name)
                  }
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? `${tier.bgColor} ${tier.borderColor} ring-1 ring-amber-400/40 shadow-lg`
                      : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${tier.badgeBg} flex-shrink-0`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {tier.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60">
                            {tier.rangeLabel}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {tier.players.length} player{tier.players.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-extrabold text-white tabular-nums">
                        {formatCompactEur(tier.totalValue)}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 tabular-nums">
                        {tier.pct}% of squad
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all ${tier.badgeBg}`}
                      style={{ width: `${tier.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drawer / Expanded List for Selected Tier */}
          {activeTierObj && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-3 transition-all animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {activeTierObj.name} ({activeTierObj.players.length})
                </span>
                <button
                  onClick={() => setSelectedTier(null)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {activeTierObj.players.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-3">
                  No players in this valuation tier.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {activeTierObj.players.map((p) => {
                    const extId = p.sourceId || p.externalId || p.id;
                    const slug =
                      p.slug ||
                      `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`;
                    return (
                      <Link
                        key={p.id}
                        href={`/players/${slug}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-amber-400/40 hover:bg-slate-800/60 transition-all group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative w-6 h-6 rounded-md bg-slate-800 overflow-hidden flex-shrink-0">
                            <EntityImage
                              src={p.photoUrl}
                              alt={p.fullName}
                              fill
                              sizes="24px"
                              entityType="player"
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 truncate">
                            {p.commonName || p.fullName}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold text-amber-400 tabular-nums ml-2 flex-shrink-0">
                          {formatCompactEur(p.latestMarketValue || 0)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Positional Capital Allocation (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl glass-panel p-6 sm:p-7 border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Positional Capital Split
                </h3>
                <p className="text-xs text-slate-400">
                  Where squad investment is concentrated
                </p>
              </div>
            </div>

            {/* Positional List */}
            <div className="space-y-4">
              {positionalBreakdown.map((pos) => (
                <div key={pos.key} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${pos.barColor}`} />
                      {pos.title}
                      <span className="text-[11px] font-medium text-slate-400">
                        ({pos.count})
                      </span>
                    </span>
                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="text-white">
                        {formatCompactEur(pos.totalVal)}
                      </span>
                      <span className="text-slate-400 font-normal text-[11px]">
                        {pos.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Allocation Bar */}
                  <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pos.barColor}`}
                      style={{ width: `${pos.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">
              Editorial Benchmark:
            </span>{" "}
            Modern Champions League contenders typically allocate 50–60% of
            their total squad valuation across Midfield & Attack, reflecting the
            scarcity premium of dynamic chance-creators and goalscorers.
          </div>
        </div>
      </div>
    </div>
  );
}
