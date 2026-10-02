"use client";

import React, { useState, useMemo } from "react";
import { EntityImage } from "@/components/EntityImage";
import { Chip } from "@/components/ui";
import {
  Clock,
  ArrowRightLeft,
  Video,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface TimelineTabProps {
  match: any;
}

export function TimelineTab({ match }: TimelineTabProps) {
  const { events = [], teams = {}, status = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};
  const isLive = status?.isLive;

  const [filter, setFilter] = useState<"all" | "goals" | "cards" | "subs">("all");

  // Sorted events in minute order (chronological: 1' to 90'+)
  const sortedEvents = useMemo(() => {
    const list = [...(events || [])];
    return list.sort((a, b) => (a.time || 0) - (b.time || 0));
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return sortedEvents;
    if (filter === "goals") return sortedEvents.filter((e) => e.type === "Goal");
    if (filter === "cards") return sortedEvents.filter((e) => e.type === "Card");
    if (filter === "subs") return sortedEvents.filter((e) => e.type === "Substitution");
    return sortedEvents;
  }, [sortedEvents, filter]);

  const getEventBadge = (event: any) => {
    switch (event.type) {
      case "Goal":
        return {
          icon: <span className="text-sm">⚽</span>,
          label: event.ownGoal ? "Own Goal" : event.isPenalty ? "Penalty Goal" : "Goal",
          badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        };
      case "Card":
        if (event.card === "Yellow") {
          return {
            icon: <div className="w-3.5 h-4.5 rounded bg-amber-400 border border-amber-300 shadow-xs" />,
            label: "Yellow Card",
            badgeClass: "bg-amber-500/15 text-[var(--value-text)] border-amber-500/30",
          };
        }
        return {
          icon: <div className="w-3.5 h-4.5 rounded bg-rose-500 border border-rose-400 shadow-xs" />,
          label: event.card === "YellowRed" ? "Second Yellow (Red)" : "Red Card",
          badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        };
      case "Substitution":
        return {
          icon: <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />,
          label: "Substitution",
          badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        };
      case "VAR":
        return {
          icon: <Video className="w-3.5 h-3.5 text-purple-400" />,
          label: "VAR Review",
          badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        };
      default:
        return {
          icon: <div className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />,
          label: event.type || "Match Event",
          badgeClass: "bg-[var(--bg-chip)] text-[var(--text-muted)] border-[var(--border-subtle)]",
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-4">
        {/* Header & Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--divider)]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--value-text)]" />
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Match Timeline
            </h3>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              ({sortedEvents.length} events)
            </span>
          </div>

          {/* Filter Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "all", label: "All Events" },
              { id: "goals", label: "Goals" },
              { id: "cards", label: "Cards" },
              { id: "subs", label: "Subs" },
            ].map((f) => (
              <Chip
                key={f.id}
                active={filter === f.id}
                onClick={() => setFilter(f.id as any)}
                className="text-xs min-h-[36px]"
              >
                {f.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Timeline Event Stream */}
        {filteredEvents.length > 0 ? (
          <div className="divide-y divide-[var(--divider)] relative">
            {filteredEvents.map((event: any, idx: number) => {
              const isHome = event.isHome;
              const teamName = isHome ? homeTeam?.name : awayTeam?.name;
              const teamImage = isHome ? homeTeam?.imageUrl : awayTeam?.imageUrl;
              const playerName = event.player?.name || event.name || event.nameStr || "Event";

              let minuteLabel = `${event.time || 0}'`;
              if (event.overloadTime) {
                minuteLabel = `${event.time}+${event.overloadTime}'`;
              }

              const { icon, label, badgeClass } = getEventBadge(event);

              return (
                <div
                  key={event.eventId || event.reactKey || idx}
                  className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-[var(--bg-hover)] px-2 rounded-xl transition-colors"
                >
                  {/* Left: Minute & Event Icon */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono font-bold text-[var(--text-muted)] text-xs w-9">
                      {minuteLabel}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-[var(--bg-chip)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                  </div>

                  {/* Center: Details & Badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--text-primary)] truncate">
                        {playerName}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}
                      >
                        {label}
                      </span>
                      {event.isPenalty && event.type === "Goal" && (
                        <span className="text-[10px] font-bold text-[var(--value-text)] bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                          Penalty
                        </span>
                      )}
                      {event.ownGoal && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/30">
                          Own Goal
                        </span>
                      )}
                    </div>

                    {/* Secondary Event Detail (Assist or Substituted Player) */}
                    {(event.assistStr || event.assist?.name || event.assist) && (
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        Assist: {event.assistStr || event.assist?.name || event.assist}
                      </p>
                    )}
                    {event.type === "Substitution" && (event.swapPlayer || event.swap) && (
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        Replaced: {event.swapPlayer?.name || event.swap?.name || event.swapPlayer}
                      </p>
                    )}
                  </div>

                  {/* Right: Team Crest & Indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-medium text-[var(--text-muted)] hidden sm:inline truncate max-w-[120px]">
                      {teamName}
                    </span>
                    <div className="w-6 h-6 rounded-md bg-[var(--bg-chip)] p-0.5 flex items-center justify-center">
                      <EntityImage
                        src={teamImage}
                        alt={teamName || "Team"}
                        width={20}
                        height={20}
                        entityType="club"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-[var(--text-muted)] text-xs">
            {events.length === 0
              ? "No timeline events recorded yet. Match updates will stream in minute order."
              : `No ${filter} events recorded for this match.`}
          </div>
        )}
      </div>
    </div>
  );
}
