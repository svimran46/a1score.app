"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight, Newspaper } from "lucide-react";
import { formatCompactEur } from "@/lib/utils";

export interface MoverItem {
  id: string;
  fullName: string;
  slug: string;
  position?: string;
  currentClub?: {
    name: string;
    logoUrl?: string | null;
  } | null;
  latestValue: number;
  prevValue?: number;
  diff: number;
  percentage: number;
}

export interface MoversData {
  risers: MoverItem[];
  fallers: MoverItem[];
}

const DEFAULT_MOVERS: MoversData = {
  risers: [
    {
      id: "yamal",
      fullName: "Lamine Yamal",
      slug: "lamine-yamal-1051588",
      position: "Right Winger",
      currentClub: { name: "Barcelona" },
      latestValue: 180000000,
      prevValue: 150000000,
      diff: 30000000,
      percentage: 20.0,
    },
    {
      id: "haaland",
      fullName: "Erling Haaland",
      slug: "erling-haaland-418560",
      position: "Centre-Forward",
      currentClub: { name: "Manchester City" },
      latestValue: 200000000,
      prevValue: 180000000,
      diff: 20000000,
      percentage: 11.1,
    },
    {
      id: "vinicius",
      fullName: "Vinicius Junior",
      slug: "vinicius-junior-371998",
      position: "Left Winger",
      currentClub: { name: "Real Madrid" },
      latestValue: 200000000,
      prevValue: 180000000,
      diff: 20000000,
      percentage: 11.1,
    },
    {
      id: "wirtz",
      fullName: "Florian Wirtz",
      slug: "florian-wirtz-598577",
      position: "Attacking Midfield",
      currentClub: { name: "Bayer Leverkusen" },
      latestValue: 130000000,
      prevValue: 110000000,
      diff: 20000000,
      percentage: 18.2,
    },
    {
      id: "palmer",
      fullName: "Cole Palmer",
      slug: "cole-palmer-568177",
      position: "Attacking Midfield",
      currentClub: { name: "Chelsea" },
      latestValue: 110000000,
      prevValue: 90000000,
      diff: 20000000,
      percentage: 22.2,
    },
  ],
  fallers: [
    {
      id: "neymar",
      fullName: "Neymar Jr",
      slug: "neymar-68290",
      position: "Left Winger",
      currentClub: { name: "Al-Hilal" },
      latestValue: 15000000,
      prevValue: 30000000,
      diff: -15000000,
      percentage: -50.0,
    },
    {
      id: "sterling",
      fullName: "Raheem Sterling",
      slug: "raheem-sterling-134425",
      position: "Left Winger",
      currentClub: { name: "Arsenal" },
      latestValue: 25000000,
      prevValue: 35000000,
      diff: -10000000,
      percentage: -28.6,
    },
    {
      id: "casemiro",
      fullName: "Casemiro",
      slug: "casemiro-16306",
      position: "Defensive Midfield",
      currentClub: { name: "Manchester United" },
      latestValue: 12000000,
      prevValue: 20000000,
      diff: -8000000,
      percentage: -40.0,
    },
    {
      id: "rashford",
      fullName: "Marcus Rashford",
      slug: "marcus-rashford-258027",
      position: "Left Winger",
      currentClub: { name: "Manchester United" },
      latestValue: 50000000,
      prevValue: 60000000,
      diff: -10000000,
      percentage: -16.7,
    },
    {
      id: "coman",
      fullName: "Kingsley Coman",
      slug: "kingsley-coman-243714",
      position: "Left Winger",
      currentClub: { name: "Bayern Munich" },
      latestValue: 40000000,
      prevValue: 50000000,
      diff: -10000000,
      percentage: -20.0,
    },
  ],
};

const NEWS_PLACEHOLDERS = [
  {
    tag: "Market Values",
    title: "2025 Market Value Updates: European wonderkids see major surges",
    time: "2h ago",
  },
  {
    tag: "Transfers",
    title: "Summer Window Preview: Top targets, release clauses and negotiations",
    time: "4h ago",
  },
  {
    tag: "Champions League",
    title: "UCL Quarter-Final matchups, projected paths, and squad valuations",
    time: "6h ago",
  },
];

export function RightRail({ movers }: { movers?: MoversData }) {
  const [activeTab, setActiveTab] = useState<"risers" | "fallers">("risers");

  const effectiveRisers =
    movers?.risers && movers.risers.length > 0 ? movers.risers.slice(0, 5) : DEFAULT_MOVERS.risers;
  const effectiveFallers =
    movers?.fallers && movers.fallers.length > 0 ? movers.fallers.slice(0, 5) : DEFAULT_MOVERS.fallers;

  const currentMovers = activeTab === "risers" ? effectiveRisers : effectiveFallers;

  return (
    <aside aria-label="News and market value movers" className="flex flex-col gap-4 w-full">
      {/* News Widget Card */}
      <div className="bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Latest News
            </h2>
          </div>
          <Link
            href="/news"
            className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
          >
            <span>All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-col space-y-2">
          {NEWS_PLACEHOLDERS.map((item, idx) => (
            <Link
              key={idx}
              href="/news"
              className="group block p-2.5 -mx-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                {item.tag}
              </div>
              <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] line-clamp-2 mt-0.5 leading-snug transition-colors">
                {item.title}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                {item.time}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Value Movers Card */}
      <div className="bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] shadow-xs">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Value Movers
          </h2>
          <Link
            href="/values"
            className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
          >
            <span>All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Risers / Fallers Toggle */}
        <div className="flex items-center p-1 bg-[var(--bg-chip)] rounded-[var(--chip-radius)] my-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("risers")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[var(--chip-radius)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              activeTab === "risers"
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[var(--trend-up)]" />
            <span>Risers</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("fallers")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[var(--chip-radius)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              activeTab === "fallers"
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-[var(--trend-down)]" />
            <span>Fallers</span>
          </button>
        </div>

        {/* Top 5 list */}
        <div className="flex flex-col space-y-1">
          {currentMovers.map((player, idx) => {
            const isRiser = player.diff >= 0;
            const sign = isRiser ? "+" : "";
            const pct = typeof player.percentage === "number" ? Math.abs(player.percentage).toFixed(1) : "0.0";

            return (
              <Link
                key={player.id || idx}
                href={`/players/${player.slug}`}
                className="group flex items-center justify-between p-2 -mx-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <span className="text-xs font-bold text-[var(--text-muted)] w-4 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors">
                      {player.fullName}
                    </div>
                    {player.currentClub?.name && (
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {player.currentClub.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[var(--value-text)] tabular-nums">
                    {formatCompactEur(player.latestValue)}
                  </div>
                  <div
                    className={`text-[10px] font-bold flex items-center justify-end gap-0.5 tabular-nums ${
                      isRiser ? "text-[var(--trend-up)]" : "text-[var(--trend-down)]"
                    }`}
                  >
                    {isRiser ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    <span>
                      {sign}
                      {pct}%
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
