"use client";

import React, { useState } from "react";
import { StatStrip } from "@/components/StatStrip";
import { Trophy, X, Calendar, Sparkles, Info } from "lucide-react";

export interface ClubHonourCompetitionData {
  key: string;
  label: string;
  note?: string | null;
  titles: number;
  source?: string | null;
  updatedDate?: string | null;
  seasons: Array<{
    season: string;
    seasonEndYear: number;
    note?: string | null;
  }>;
}

interface ClubHonoursStatStripProps {
  honours: ClubHonourCompetitionData[];
  clubName: string;
}

export function ClubHonoursStatStrip({ honours, clubName }: ClubHonoursStatStripProps) {
  const [activeSheetComp, setActiveSheetComp] = useState<ClubHonourCompetitionData | null>(null);

  // Filter only competitions with titles > 0
  const activeHonours = (honours || []).filter((h) => h.titles > 0);
  if (activeHonours.length === 0) return null;

  // Each competition with titles > 0 becomes an item in the StatStrip
  const statItems = activeHonours.map((h) => ({
    value: h.titles,
    label: h.label,
    onClick: () => setActiveSheetComp(h),
  }));

  // Build footer source text dynamically based on competitions displayed
  const uniqueDates = Array.from(new Set(activeHonours.map((h) => h.updatedDate).filter(Boolean)));
  const footerDateText = uniqueDates.length > 0 ? uniqueDates.join(" / ") : "18 Jun 2026";

  return (
    <div className="space-y-2">
      {/* StatStrip: shows numbers for all competitions with titles > 0 */}
      <StatStrip items={statItems} className="shadow-sm" />

      {/* Footer under the card: "Source: RSSSF, updated {date}" */}
      <div className="text-[11px] text-text-muted dark:text-text-muted flex items-center justify-between px-1">
        <span>Source: RSSSF, updated {footerDateText}</span>
        <span className="text-[10px] text-value-text/80 font-medium">Tap count to view winning seasons</span>
      </div>

      {/* Interactive Sheet / Modal when tapped */}
      {activeSheetComp && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveSheetComp(null)}
        >
          <div
            className="w-full max-w-lg bg-bg-card border border-divider rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-start justify-between pb-3 border-b border-divider">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-value-text">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary leading-tight">
                    {clubName} — {activeSheetComp.label}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {activeSheetComp.titles} {activeSheetComp.titles === 1 ? "Title" : "Titles"} in club history (Newest first)
                  </p>
                  {activeSheetComp.note && (
                    <div className="flex items-center gap-1 text-[11px] text-value-text/90 mt-1">
                      <Info className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{activeSheetComp.note}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSheetComp(null)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-chip transition-colors"
                aria-label="Close sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Winning Seasons List - Newest First */}
            <div className="overflow-y-auto divide-y divide-divider/60 pr-1 max-h-[55vh]">
              {activeSheetComp.seasons.map((s, idx) => (
                <div
                  key={s.season}
                  className="py-3 px-2 flex items-center justify-between hover:bg-bg-chip/40 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-xs text-text-muted font-mono text-right tabular-nums">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-text-primary text-sm tracking-wide tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-value-text/80 flex-shrink-0" />
                      {s.season}
                    </div>
                  </div>

                  {/* Era note per row */}
                  {s.note ? (
                    <span
                      className="text-[11px] font-medium text-text-secondary bg-bg-chip/80 border border-divider/60 px-2 py-0.5 rounded-full text-right ml-2 truncate max-w-[220px]"
                      title={s.note}
                    >
                      {s.note}
                    </span>
                  ) : (
                    <span className="text-[11px] text-text-muted">
                      Champion
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Sheet Footer with source note */}
            <div className="pt-3 border-t border-divider flex items-center justify-between text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-value-text" />
                Verified Championship Record
              </span>
              <span>Source: RSSSF, updated {activeSheetComp.updatedDate || "18 Jun 2026"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
