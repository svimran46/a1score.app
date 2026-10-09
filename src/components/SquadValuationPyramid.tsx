"use client";

import { useMemo, useState } from "react";
import { EntityImage } from "./EntityImage";
import Link from "next/link";
import { formatCompactEur } from "@/lib/utils";
import { getPlayerSlug } from "@/lib/slugs";
import { Card } from "@/components/ui";
import {
  Layers,
  PieChart,
  Shield,
  TrendingUp,
  Calendar,
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
        topAssetRatio: 0,
        topPlayer: null,
      };
    }

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
        "bg-[var(--value-text)]",
        elite
      ),
      buildTier(
        "Key Starters",
        "€20M – €50M",
        20_000_000,
        50_000_000,
        "bg-[var(--trend-positive)]",
        starters
      ),
      buildTier(
        "Core Squad",
        "€5M – €20M",
        5_000_000,
        20_000_000,
        "bg-[var(--accent)]",
        core
      ),
      buildTier(
        "Rotation / Prospects",
        "< €5M",
        0,
        5_000_000,
        "bg-[var(--text-muted)]",
        rotation
      ),
    ];
  }, [players, totalSquadValue]);

  // 3. Positional Valuation Allocation
  const positionalBreakdown = useMemo(() => {
    const posGroups: Record<
      string,
      { title: string; barColor: string; players: SquadPlayer[] }
    > = {
      Goalkeeper: {
        title: "Goalkeepers",
        barColor: "bg-[var(--value-text)]",
        players: [],
      },
      Defender: {
        title: "Defenders",
        barColor: "bg-[var(--accent)]",
        players: [],
      },
      Midfield: {
        title: "Midfielders",
        barColor: "bg-[var(--trend-positive)]",
        players: [],
      },
      Attack: {
        title: "Attackers",
        barColor: "bg-[var(--trend-negative)]",
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
        barColor: group.barColor,
        count: group.players.length,
        totalVal: groupVal,
        pct,
      };
    });
  }, [players, totalSquadValue]);

  const activeTierObj = tiers.find((t) => t.name === selectedTier);

  return (
    <div className="space-y-4">
      <p className="sr-only">
        Squad financial pyramid and asset distribution analysis for {clubName}. Total squad valuation is {formatCompactEur(totalSquadValue)} across {players.length} squad members.
      </p>

      {/* Squad Demographic & Concentration Barometer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Average Squad Age */}
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-chip)] flex items-center justify-center shrink-0 text-[var(--accent)]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Average Squad Age
            </span>
            <div className="text-lg font-black text-[var(--text-primary)] tracking-tight tabular-nums">
              {demographics.avgAge ? `${demographics.avgAge} yrs` : "N/A"}
            </div>
          </div>
        </Card>

        {/* Metric 2: Top Asset Concentration */}
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-chip)] flex items-center justify-center shrink-0 text-[var(--value-text)]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Top Asset Concentration
            </span>
            <div className="text-lg font-black text-[var(--value-text)] figure tracking-tight tabular-nums">
              {demographics.topAssetRatio}%
            </div>
            <span className="text-[10px] text-[var(--text-muted)] truncate block">
              {demographics.topPlayer?.commonName || demographics.topPlayer?.fullName || "Top Star"} (
              {formatCompactEur(demographics.topPlayer?.latestMarketValue || 0)})
            </span>
          </div>
        </Card>

        {/* Metric 3: Squad Depth */}
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-chip)] flex items-center justify-center shrink-0 text-[var(--trend-positive)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Squad Valuation Depth
            </span>
            <div className="text-lg font-black text-[var(--trend-positive)] tracking-tight tabular-nums">
              {tiers[0].players.length + tiers[1].players.length} Key Assets
            </div>
            <span className="text-[10px] text-[var(--text-muted)] block">
              Valued &ge; €20M
            </span>
          </div>
        </Card>
      </div>

      {/* Main Valuation Pyramid & Positional Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Financial Valuation Pyramid (7 cols) */}
        <Card className="lg:col-span-7 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--value-text)]" />
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                Squad Valuation Pyramid
              </h3>
            </div>
            <span className="text-xs font-bold text-[var(--value-text)] figure tabular-nums">
              Total {formatCompactEur(totalSquadValue)}
            </span>
          </div>

          {/* Pyramid Tiers */}
          <div className="space-y-2.5">
            {tiers.map((tier) => {
              const isSelected = selectedTier === tier.name;
              return (
                <div
                  key={tier.name}
                  onClick={() =>
                    setSelectedTier(isSelected ? null : tier.name)
                  }
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--bg-hover)] ring-2 ring-[var(--focus-ring)]"
                      : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${tier.badgeBg} shrink-0`}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[var(--text-primary)]">
                            {tier.name}
                          </span>
                          <span className="text-[10px] font-semibold text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-chip)]">
                            {tier.rangeLabel}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {tier.players.length} player{tier.players.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                        {formatCompactEur(tier.totalValue)}
                      </div>
                      <div className="text-[10px] font-medium text-[var(--text-muted)] tabular-nums">
                        {tier.pct}% of squad
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-1.5 bg-[var(--bg-page)] rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all ${tier.badgeBg}`}
                      style={{ width: `${tier.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded List for Selected Tier */}
          {activeTierObj && (
            <div className="p-3 rounded-xl bg-[var(--bg-page)] space-y-2 transition-all">
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--divider)]">
                <span className="text-xs font-bold text-[var(--value-text)] uppercase tracking-wider">
                  {activeTierObj.name} ({activeTierObj.players.length})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTier(null)}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Close
                </button>
              </div>

              {activeTierObj.players.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)] text-center py-2">
                  No players in this valuation tier.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {activeTierObj.players.map((p) => {
                    const extId = p.sourceId || p.externalId || p.id;
                    const slug =
                      p.slug ||
                      getPlayerSlug({ ...p, transfermarktId: extId });
                    return (
                      <Link
                        key={p.id}
                        href={`/players/${slug}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] transition-all group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative w-6 h-6 rounded-md bg-[var(--bg-page)] overflow-hidden shrink-0">
                            <EntityImage
                              src={p.photoUrl}
                              alt={p.fullName}
                              fill
                              sizes="24px"
                              entityType="player"
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate">
                            {p.commonName || p.fullName}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[var(--value-text)] figure tabular-nums ml-2 shrink-0">
                          {formatCompactEur(p.latestMarketValue || 0)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Right Column: Positional Capital Split (5 cols) */}
        <Card className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--divider)]">
              <PieChart className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                Positional Capital Split
              </h3>
            </div>

            {/* Positional List */}
            <div className="space-y-3">
              {positionalBreakdown.map((pos) => (
                <div key={pos.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[var(--text-primary)] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${pos.barColor}`} />
                      {pos.title}
                      <span className="text-[11px] font-medium text-[var(--text-muted)]">
                        ({pos.count})
                      </span>
                    </span>
                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="text-[var(--text-primary)]">
                        {formatCompactEur(pos.totalVal)}
                      </span>
                      <span className="text-[var(--text-muted)] font-normal text-[11px]">
                        {pos.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Allocation Bar */}
                  <div className="w-full h-1.5 bg-[var(--bg-page)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pos.barColor}`}
                      style={{ width: `${pos.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-elevated)] text-[11px] text-[var(--text-muted)] leading-relaxed">
            <span className="font-semibold text-[var(--text-primary)]">
              Positional Breakdown:
            </span>{" "}
            {clubName} squad allocation across Tactical Units.
          </div>
        </Card>
      </div>
    </div>
  );
}
