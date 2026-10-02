"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Trophy, X, Calendar, Sparkles } from "lucide-react";
import type { ClubHonourItem } from "@/lib/data/honours";

interface ClubHonoursBoxProps {
  honours: ClubHonourItem[];
  clubName: string;
}

export function ClubHonoursBox({ honours, clubName }: ClubHonoursBoxProps) {
  const [selectedHonour, setSelectedHonour] = useState<ClubHonourItem | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedHonour) {
        setSelectedHonour(null);
      }
    },
    [selectedHonour]
  );

  useEffect(() => {
    if (selectedHonour) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedHonour, handleKeyDown]);

  const activeHonours = (honours || []).filter((h) => h.titleCount > 0);
  if (activeHonours.length === 0) return null;

  return (
    <>
      <div className="w-full sm:w-auto p-2 sm:p-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col sm:items-end justify-center shrink-0">
        <div className="flex items-center gap-1.5 px-1 mb-1.5">
          <Trophy className="w-3.5 h-3.5 text-[var(--value-text)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Club Honours
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeHonours.map((h) => {
            const shortLabel =
              h.competitionKey === "ucl"
                ? "UCL"
                : h.competitionName.replace(" Titles", "").replace(" League", "");

            return (
              <button
                key={h.competitionKey}
                type="button"
                onClick={() => setSelectedHonour(h)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-left transition-colors min-h-[44px] min-w-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--value-text)]"
                aria-label={`View ${h.titleCount} ${h.competitionName} winning seasons`}
              >
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base font-black text-[var(--text-primary)] tabular-nums leading-none">
                    {h.titleCount}x
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] leading-tight truncate max-w-[100px] mt-0.5">
                    {shortLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accessible Interactive Winning Seasons Dialog */}
      {selectedHonour && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="honour-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedHonour(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-chip)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--value-text)] shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="honour-modal-title" className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight">
                    {clubName} — {selectedHonour.competitionName}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {selectedHonour.titleCount} {selectedHonour.titleCount === 1 ? "title" : "titles"} in club history (Newest first)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedHonour(null)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close honours dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Winning Seasons List */}
            <div className="overflow-y-auto divide-y divide-[var(--border-subtle)] pr-1 max-h-[50vh]">
              {selectedHonour.seasons && selectedHonour.seasons.length > 0 ? (
                selectedHonour.seasons.map((season, idx) => (
                  <div
                    key={season}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-xs text-[var(--text-muted)] font-mono text-right tabular-nums">
                        #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)] text-sm tracking-wide tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-[var(--value-text)] shrink-0" />
                        {season}
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-[var(--text-muted)]">
                      Champion
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                  Winning seasons data recorded via official club archives.
                </div>
              )}
            </div>

            {/* Footer with source note */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[var(--value-text)]" />
                Verified Championship Record
              </span>
              <span>Source: Transfermarkt</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
