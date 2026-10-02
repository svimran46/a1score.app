"use client";

import React from "react";
import Link from "next/link";
import { EntityImage } from "@/components/EntityImage";
import { formatCompactEur, formatDate, calculateAge } from "@/lib/utils";
import { getClubSlug } from "@/lib/slugs";
import { calculate12MonthChange, calculatePeakValuation } from "@/lib/compare";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Calendar,
  Globe,
  Activity,
  Layers,
} from "lucide-react";

export interface ComparePlayerFact {
  id: string;
  slug: string;
  fullName: string;
  commonName?: string | null;
  photoUrl?: string | null;
  dateOfBirth?: string | Date | null;
  nationality?: string | string[] | null;
  position: string;
  currentClub?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    shortName?: string | null;
  } | null;
  latestMarketValue: number;
  marketValues: Array<{ date: string | Date; valueEur: number }>;
}

interface CompareFactsTableProps {
  players: ComparePlayerFact[];
  onRemovePlayer: (slug: string) => void;
}

export function CompareFactsTable({ players, onRemovePlayer }: CompareFactsTableProps) {
  if (!players || players.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[var(--divider)]">
        <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
          Side-by-Side Comparison Matrix
        </h3>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
          Comprehensive facts, valuations, and career trajectories.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div
          className={`grid divide-x divide-[var(--divider)] min-w-[340px]`}
          style={{
            gridTemplateColumns: `repeat(${players.length}, minmax(${players.length === 1 ? "100%" : "260px"}, 1fr))`,
          }}
        >
          {players.map((player) => {
            const age = calculateAge(player.dateOfBirth);
            const dob = player.dateOfBirth ? new Date(player.dateOfBirth) : null;
            const validDob = dob && !isNaN(dob.getTime()) ? dob : null;

            const change12M = calculate12MonthChange(
              player.marketValues || [],
              player.latestMarketValue
            );

            const peak = calculatePeakValuation(
              player.marketValues || [],
              player.latestMarketValue
            );

            const club = player.currentClub;
            const clubSlug = club ? getClubSlug(club) : "";

            const nationalities = Array.isArray(player.nationality)
              ? player.nationality.join(", ")
              : player.nationality || "—";

            return (
              <div key={player.slug} className="p-4 sm:p-5 space-y-5 flex flex-col justify-between">
                {/* 1. Player Identity Header */}
                <div className="relative space-y-3">
                  <button
                    type="button"
                    onClick={() => onRemovePlayer(player.slug)}
                    aria-label={`Remove ${player.fullName} from comparison`}
                    className="absolute -top-1 -right-1 p-1.5 rounded-full text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    title="Remove player"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[var(--bg-chip)] border border-[var(--border-subtle)] overflow-hidden shrink-0 relative flex items-center justify-center">
                      <EntityImage
                        src={player.photoUrl}
                        alt={player.fullName}
                        width={56}
                        height={56}
                        entityType="player"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1 pr-6">
                      <Link
                        href={`/players/${player.slug}`}
                        className="font-bold text-sm sm:text-base text-[var(--text-primary)] hover:text-[var(--accent)] line-clamp-1 transition-colors"
                      >
                        {player.fullName}
                      </Link>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {player.position}
                      </p>
                    </div>
                  </div>

                  {/* Current Valuation Highlight */}
                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                      Current Market Value
                    </span>
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="font-mono font-black text-xl sm:text-2xl text-[var(--value-text)] tabular-nums">
                        {player.latestMarketValue > 0 ? formatCompactEur(player.latestMarketValue) : "—"}
                      </span>
                      {/* 12-Month Delta */}
                      {change12M.baselineValue > 0 && (
                        <div
                          className={`flex items-center gap-1 text-xs font-bold tabular-nums ${
                            change12M.isPositive
                              ? "text-emerald-400"
                              : change12M.isNegative
                              ? "text-rose-400"
                              : "text-[var(--text-muted)]"
                          }`}
                        >
                          {change12M.isPositive ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : change12M.isNegative ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {change12M.isPositive ? "+" : ""}
                            {change12M.pct.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Structured Comparison Metrics */}
                <div className="space-y-3.5 text-xs">
                  {/* Peak Valuation */}
                  <div className="flex items-start justify-between gap-2 py-1.5 border-b border-[var(--divider)]">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5 shrink-0">
                      <Trophy className="w-3.5 h-3.5 text-[var(--value-text)]" />
                      Peak Value
                    </span>
                    <span className="font-bold text-[var(--text-primary)] text-right">
                      <span className="font-mono text-[var(--value-text)] tabular-nums">
                        {peak.peakValue > 0 ? formatCompactEur(peak.peakValue) : "—"}
                      </span>
                      {peak.peakDate && (
                        <span className="text-[11px] text-[var(--text-muted)] block font-normal">
                          {formatDate(peak.peakDate)}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* 12M Change Details */}
                  <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--divider)]">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5 shrink-0">
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                      12M Change
                    </span>
                    <span className="font-mono font-bold text-right tabular-nums">
                      {change12M.baselineValue > 0 ? (
                        <span
                          className={
                            change12M.isPositive
                              ? "text-emerald-400"
                              : change12M.isNegative
                              ? "text-rose-400"
                              : "text-[var(--text-muted)]"
                          }
                        >
                          {change12M.isPositive ? "+" : ""}
                          {formatCompactEur(change12M.diff)} ({change12M.isPositive ? "+" : ""}
                          {change12M.pct.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)] font-normal">No 1Y Baseline</span>
                      )}
                    </span>
                  </div>

                  {/* Current Club */}
                  <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--divider)]">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5 shrink-0">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      Club
                    </span>
                    {club ? (
                      <Link
                        href={`/clubs/${clubSlug}`}
                        className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] flex items-center gap-1.5 truncate transition-colors text-right"
                      >
                        {club.logoUrl && (
                          <div className="w-4 h-4 shrink-0 relative">
                            <EntityImage
                              src={club.logoUrl}
                              alt={club.name}
                              width={16}
                              height={16}
                              entityType="club"
                              className="object-contain"
                            />
                          </div>
                        )}
                        <span className="truncate">{club.shortName || club.name}</span>
                      </Link>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </div>

                  {/* Age & Date of Birth */}
                  <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--divider)]">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      Age
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] text-right">
                      {age ? `${age} yrs` : "—"}
                      {validDob && (
                        <span className="text-[11px] text-[var(--text-muted)] block font-normal">
                          {formatDate(validDob)}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Playing Position */}
                  <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--divider)]">
                    <span className="text-[var(--text-muted)] shrink-0">Position</span>
                    <span className="font-semibold text-[var(--text-primary)] text-right">
                      {player.position || "—"}
                    </span>
                  </div>

                  {/* Nationality */}
                  <div className="flex items-center justify-between gap-2 py-1.5">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5 shrink-0">
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      Nationality
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] text-right truncate">
                      {nationalities}
                    </span>
                  </div>
                </div>

                {/* 3. Action Link */}
                <div className="pt-2">
                  <Link
                    href={`/players/${player.slug}`}
                    className="w-full min-h-[38px] px-3 py-2 rounded-xl text-xs font-bold text-center block bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
