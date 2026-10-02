"use client";

import React, { useState } from "react";
import { StatStrip } from "@/components/StatStrip";
import { Trophy, X, Calendar, Sparkles } from "lucide-react";

export interface ClubHonourCompetitionData {
  key: string;
  label: string;
  titles: number;
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

  const statItems = activeHonours.map((h) => ({
    value: h.titles,
    label: h.label,
    onClick: () => setActiveSheetComp(h),
  }));

  return (
    <div className="space-y-2">
      {/* StatStrip: only shown when club has titles > 0 */}
      <StatStrip items={statItems} className="shadow-sm" />

      {/* Footer under the card: "Source: RSSSF, updated 14 Jun 2026" */}
      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between px-1">
        <span>Source: RSSSF, updated 14 Jun 2026</span>
        <span className="text-[10px] text-amber-500/80 font-medium">Tap title count to view winning seasons</span>
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
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {clubName} — {activeSheetComp.label}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeSheetComp.titles} {activeSheetComp.titles === 1 ? "Title" : "Titles"} in club history (Newest first)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSheetComp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Winning Seasons List - Newest First */}
            <div className="overflow-y-auto divide-y divide-slate-800/60 pr-1 max-h-[55vh]">
              {activeSheetComp.seasons.map((s, idx) => (
                <div
                  key={s.season}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-800/40 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-xs text-slate-500 font-mono text-right tabular-nums">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-100 text-sm tracking-wide tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
                      {s.season}
                    </div>
                  </div>

                  {/* Era note per row */}
                  {s.note ? (
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-full text-right ml-2 truncate max-w-[200px]" title={s.note}>
                      {s.note}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Champion
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Sheet Footer with source note */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Verified Championship Record
              </span>
              <span>Source: RSSSF, updated 14 Jun 2026</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
