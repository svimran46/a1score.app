"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { EntityImage } from "@/components/EntityImage";
import { KickoffTime } from "@/components/KickoffTime";
import {
  Trophy,
  Calendar,
  MapPin,
  User,
  Users,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { formatCompactEur } from "@/lib/utils";

interface OverviewTabProps {
  match: any;
}

export function OverviewTab({ match }: OverviewTabProps) {
  const { general = {}, teams = {}, events = [], infoBox = {}, status = {} } = match || {};
  const homeTeam = teams?.home || {};
  const awayTeam = teams?.away || {};

  // Extract key events summary: Goals, Red Cards, Penalties
  const keyEvents = useMemo(() => {
    const list = (events || []).filter(
      (e: any) =>
        e.type === "Goal" ||
        (e.type === "Card" && (e.card === "Red" || e.card === "YellowRed")) ||
        e.isPenalty
    );
    // Chronological order: 1' to 90'+
    return list.sort((a: any, b: any) => (a.time || 0) - (b.time || 0));
  }, [events]);

  const matchDate = general?.matchTimeUTCDate || general?.matchTimeUTC;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. KEY MATCH EVENTS SUMMARY (Goals & Red Cards) */}
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--value-text)]" />
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Key Events Summary
            </h3>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            {keyEvents.length} Major Incidents
          </span>
        </div>

        {keyEvents.length > 0 ? (
          <div className="divide-y divide-[var(--divider)]">
            {keyEvents.map((event: any, idx: number) => {
              const isHome = event.isHome;
              const teamName = isHome ? homeTeam?.name : awayTeam?.name;
              const teamImage = isHome ? homeTeam?.imageUrl : awayTeam?.imageUrl;
              const playerName = event.player?.name || event.name || event.nameStr || "Player";

              let minuteLabel = `${event.time || 0}'`;
              if (event.overloadTime) {
                minuteLabel = `${event.time}+${event.overloadTime}'`;
              }

              const isGoal = event.type === "Goal";
              const isRedCard = event.type === "Card" && (event.card === "Red" || event.card === "YellowRed");

              return (
                <div
                  key={event.eventId || event.reactKey || idx}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-[var(--bg-hover)] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono font-bold text-[var(--text-muted)] text-xs w-9">
                      {minuteLabel}
                    </span>
                    {isGoal ? (
                      <span
                        role="img"
                        aria-label="Goal"
                        className="w-6 h-6 rounded-full bg-trend-up/15 border border-trend-up/30 flex items-center justify-center text-xs shrink-0"
                      >
                        ⚽
                      </span>
                    ) : isRedCard ? (
                      <span
                        title="Red Card"
                        className="w-5 h-6 rounded bg-trend-down border border-trend-down shadow-xs shrink-0"
                      />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] shrink-0" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)] truncate">
                      <span>{playerName}</span>
                      {event.ownGoal && (
                        <span className="text-[10px] font-bold text-trend-down bg-trend-down/15 px-1.5 py-0.5 rounded border border-trend-down/30">
                          OG
                        </span>
                      )}
                      {event.isPenalty && (
                        <span className="text-[10px] font-bold text-[var(--value-text)] bg-accent/15 px-1.5 py-0.5 rounded border border-accent/30">
                          PEN
                        </span>
                      )}
                    </div>
                    {event.assistStr && (
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        Assist: {event.assistStr}
                      </p>
                    )}
                  </div>

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
          <div className="py-6 text-center text-[var(--text-muted)] text-xs">
            {status?.isUpcoming
              ? "Match has not started yet. Goals and major events will appear here."
              : "No goals or red cards recorded for this match."}
          </div>
        )}
      </div>

      {/* 2. MATCH INFORMATION & VENUE CONTEXT */}
      <div className="rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[var(--value-text)]" />
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Match Information
            </h3>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Official Data</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          {/* Competition */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <Trophy className="w-4 h-4 text-[var(--value-text)] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Competition</p>
              <p className="font-semibold text-[var(--text-primary)] mt-0.5 truncate">
                {infoBox?.tournament?.leagueName || general?.leagueName || "League"}
              </p>
              {(general?.leagueRoundName || general?.matchRound) && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  {general?.leagueRoundName || `Round ${general?.matchRound}`}
                </p>
              )}
            </div>
          </div>

          {/* Date & Kickoff */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <Calendar className="w-4 h-4 text-info shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Date & Kickoff</p>
              <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                {matchDate ? (
                  <KickoffTime date={matchDate} includeDate={true} />
                ) : (
                  general?.matchTimeUTC || "TBD"
                )}
              </p>
            </div>
          </div>

          {/* Stadium / Venue */}
          {(infoBox?.stadium || general?.venue || general?.stadium) && (() => {
            const venue = infoBox?.stadium || general?.venue || general?.stadium;
            const venueName = venue?.name || venue;
            const venueCity = venue?.city;
            return (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <MapPin className="w-4 h-4 text-trend-down shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Venue</p>
                  <p className="font-semibold text-[var(--text-primary)] mt-0.5 truncate">
                    {venueName}
                    {venueCity && `, ${venueCity}`}
                  </p>
                  {venue?.capacity && (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Capacity: {Number(venue.capacity).toLocaleString()} • Surface:{" "}
                      {venue.surface || "Grass"}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Referee */}
          {(infoBox?.referee || general?.referee) && (() => {
            const ref = infoBox?.referee || general?.referee;
            const refName = ref?.text || ref?.name || (typeof ref === "string" ? ref : "Match Official");
            return (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <User className="w-4 h-4 text-trend-up shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Match Referee</p>
                  <p className="font-semibold text-[var(--text-primary)] mt-0.5 truncate">
                    {refName}
                  </p>
                  {ref?.country && (
                    <p className="text-[11px] text-[var(--text-muted)]">{ref.country}</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Attendance */}
          {(infoBox?.attendance || general?.attendance) && (() => {
            const att = infoBox?.attendance || general?.attendance;
            return (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <Users className="w-4 h-4 text-highlight shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Attendance</p>
                  <p className="font-semibold text-[var(--text-primary)] mt-0.5 tabular-nums">
                    {Number(att).toLocaleString()} spectators
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
