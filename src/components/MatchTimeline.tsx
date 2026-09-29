"use client";

import { Activity, Clock, ShieldAlert, ArrowLeftRight, CheckCircle2 } from "lucide-react";

interface TimelineEvent {
  reactKey?: string;
  type: string;
  time: number | string;
  overloadTime?: number | string | null;
  player?: { id?: number | string | null; name?: string };
  assistPlayer?: { id?: number | string | null; name?: string };
  isHome?: boolean;
  card?: string;
  cardReason?: { defaultText?: string };
  swap?: Array<{ name?: string }>;
  halfStrShort?: string;
  homeScore?: number;
  awayScore?: number;
  minutesAddedStr?: string;
}

interface MatchTimelineProps {
  events: TimelineEvent[];
  homeName: string;
  awayName: string;
  onPitchYellowCards?: number;
  onPitchRedCards?: number;
}

export function MatchTimeline({
  events,
  homeName,
  awayName,
  onPitchYellowCards,
  onPitchRedCards,
}: MatchTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-3xl glass-panel p-8 border border-slate-800 text-center space-y-2">
        <Clock className="w-8 h-8 text-slate-500 mx-auto" />
        <h4 className="text-sm font-semibold text-white">Match Timeline Empty</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Goals, cautions, and substitutions will stream here in real time once the referee blows kickoff.
        </p>
      </div>
    );
  }

  // Filter out noisy meta events like AddedTime if desired, keep Half, Goal, Card, Substitution
  const actionableEvents = events.filter((e) =>
    ["Goal", "Card", "Substitution", "Half", "MissedPenalty", "Var"].includes(e.type)
  );

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Live Match Timeline
          </h3>
        </div>
        <span className="text-xs text-slate-500 tabular-nums">
          {actionableEvents.length} Verified Incidents
        </span>
      </div>

      {/* Chronological Vertical Feed */}
      <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-800/80">
        {actionableEvents.map((ev, idx) => {
          const isGoal = ev.type === "Goal";
          const isCard = ev.type === "Card";
          const isSub = ev.type === "Substitution";
          const isHalf = ev.type === "Half";

          if (isHalf) {
            return (
              <div
                key={ev.reactKey || idx}
                className="relative z-10 flex items-center justify-center my-3"
              >
                <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] font-bold text-slate-300 shadow">
                  {ev.halfStrShort === "HT" ? "Half Time" : "Full Time"}
                  {ev.homeScore !== undefined && ev.awayScore !== undefined && (
                    <span className="ml-1.5 text-amber-400 tabular-nums">
                      ({ev.homeScore} - {ev.awayScore})
                    </span>
                  )}
                </span>
              </div>
            );
          }

          return (
            <div
              key={ev.reactKey || idx}
              className="relative z-10 flex items-start gap-4 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/50 transition-colors"
            >
              {/* Minute Badge */}
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center border border-slate-700 font-black text-xs text-slate-200 tabular-nums">
                {ev.time}&apos;
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  {/* Event Type Icon / Badge */}
                  {isGoal && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ⚽ GOAL
                    </span>
                  )}

                  {isCard && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                        ev.card === "Yellow"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {ev.card === "Yellow" ? "🟨 YELLOW CARD" : "🟥 RED CARD"}
                    </span>
                  )}

                  {isSub && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <ArrowLeftRight className="w-3 h-3" /> SUB
                    </span>
                  )}

                  <span className="text-[11px] font-semibold text-slate-400">
                    {ev.isHome ? homeName : awayName}
                  </span>
                </div>

                {/* Primary Actor Details */}
                <div className="text-sm font-bold text-white tracking-tight truncate">
                  {ev.player?.name || "Incident"}
                </div>

                {/* Secondary details: Assist or Sub In/Out */}
                {ev.assistPlayer?.name && (
                  <div className="text-xs text-slate-400">
                    Assist: <span className="text-slate-300 font-medium">{ev.assistPlayer.name}</span>
                  </div>
                )}

                {isSub && ev.swap && ev.swap.length >= 2 && (
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="text-emerald-400 font-medium">IN: {ev.swap[0]?.name}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-rose-400 font-medium">OUT: {ev.swap[1]?.name}</span>
                  </div>
                )}

                {isCard && ev.cardReason?.defaultText && (
                  <div className="text-[11px] text-slate-500">
                    Reason: {ev.cardReason.defaultText}
                  </div>
                )}
              </div>

              {/* Running Score (if Goal) */}
              {isGoal && ev.homeScore !== undefined && ev.awayScore !== undefined && (
                <div className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-black text-amber-400 tabular-nums">
                  {ev.homeScore} - {ev.awayScore}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disciplinary Reconciliation Footnote */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-400">Disciplinary Reconciliation:</strong> Match statistics reflect the formal match report recorded by competition officials, while the timeline logs verified on-pitch active match incidents.
        </p>
      </div>
    </div>
  );
}
