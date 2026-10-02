"use client";

import { useState } from "react";
import { ClubSquadTable, type SquadPlayerRow } from "./ClubSquadTable";
import { SquadValuationPyramid } from "./SquadValuationPyramid";
import { ClubTransferLedger } from "./ClubTransferLedger";
import type { FotmobTeamDetails } from "@/lib/fotmob/client";
import { formatDate } from "@/lib/utils";
import { KickoffTime } from "@/components/KickoffTime";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui";
import dynamic from "next/dynamic";
import {
  Users,
  Layers,
  MapPin,
  History,
  ArrowRightLeft,
  Calendar,
  Building,
  UserCheck,
} from "lucide-react";

const ClubValueTrendChart = dynamic(
  () => import("@/components/clubs/ClubValueTrendChart").then((m) => m.ClubValueTrendChart),
  { ssr: false }
);

interface ClubTabsContainerProps {
  clubName: string;
  totalSquadValue: number;
  players: SquadPlayerRow[];
  firstTeamPlayers?: SquadPlayerRow[];
  academyPlayers?: SquadPlayerRow[];
  details?: FotmobTeamDetails | null;
  transfersData: {
    recordArrivals: any[];
    recordDepartures: any[];
  };
  leagueName?: string | null;
  snapshots?: any[];
}

export function ClubTabsContainer({
  clubName,
  totalSquadValue,
  players,
  firstTeamPlayers = [],
  academyPlayers = [],
  details,
  transfersData,
  leagueName,
  snapshots = [],
}: ClubTabsContainerProps) {
  const [activeTab, setActiveTab] = useState<
    "squad" | "transfers" | "value" | "overview" | "form"
  >("squad");

  const tabs = [
    {
      id: "squad",
      label: "Squad",
      count: firstTeamPlayers.length > 0 ? firstTeamPlayers.length : players.length,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "transfers",
      label: "Transfers",
      count: (transfersData?.recordArrivals?.length || 0) + (transfersData?.recordDepartures?.length || 0) || undefined,
      icon: <ArrowRightLeft className="w-4 h-4" />,
    },
    {
      id: "value",
      label: "Value",
      icon: <Layers className="w-4 h-4" />,
    },
    ...(details?.venue || details?.manager
      ? [{ id: "overview", label: "Overview", icon: <Building className="w-4 h-4" /> }]
      : []),
    ...(details?.recentForm && details.recentForm.length > 0
      ? [{ id: "form", label: "Form", icon: <History className="w-4 h-4" /> }]
      : []),
  ];

  return (
    <div className="space-y-4">
      {/* Navigation Tabs Bar */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
        ariaLabel="Club sections"
      />

      {/* Tab 1: Squad (Player rows) */}
      {activeTab === "squad" && (
        <ClubSquadTable
          players={players}
          firstTeamPlayers={firstTeamPlayers}
          academyPlayers={academyPlayers}
          clubName={clubName}
        />
      )}

      {/* Tab 2: Transfers Ledger */}
      {activeTab === "transfers" && (
        <ClubTransferLedger
          recordArrivals={transfersData.recordArrivals}
          recordDepartures={transfersData.recordDepartures}
          clubName={clubName}
        />
      )}

      {/* Tab 3: Squad Valuation & Value Trend */}
      {activeTab === "value" && (
        <div className="space-y-4">
          <SquadValuationPyramid
            players={firstTeamPlayers.length > 0 ? firstTeamPlayers : players}
            totalSquadValue={totalSquadValue}
            clubName={clubName}
          />
          {snapshots && snapshots.length >= 2 && (
            <ClubValueTrendChart snapshots={snapshots} clubName={clubName} />
          )}
        </div>
      )}

      {/* Tab 4: Overview (Stadium & Manager) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stadium / Venue Info */}
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--divider)]">
              <MapPin className="w-4 h-4 text-[var(--value-text)]" />
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                Home Ground & Stadium
              </h3>
            </div>

            {details?.venue ? (
              <div className="space-y-2.5 pt-1">
                <div className="text-base font-black text-[var(--text-primary)]">
                  {details.venue.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {details.venue.city && (
                    <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)]">
                      <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">Location</span>
                      <span className="text-[var(--text-primary)] font-semibold">{details.venue.city}</span>
                    </div>
                  )}
                  {details.venue.capacity && (
                    <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)]">
                      <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">Capacity</span>
                      <span className="text-[var(--value-text)] font-extrabold tabular-nums">
                        {details.venue.capacity.toLocaleString("en-US")} seats
                      </span>
                    </div>
                  )}
                  {details.venue.surface && (
                    <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)]">
                      <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">Pitch Surface</span>
                      <span className="text-[var(--text-primary)] font-semibold">{details.venue.surface}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                Stadium details pending synchronization.
              </div>
            )}
          </Card>

          {/* Manager / Head Coach */}
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--divider)]">
              <UserCheck className="w-4 h-4 text-[var(--trend-positive)]" />
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                Manager & Head Coach
              </h3>
            </div>

            {details?.manager ? (
              <div className="space-y-2.5 pt-1">
                <div className="text-base font-black text-[var(--text-primary)]">
                  {details.manager.name}
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] text-xs">
                  <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">Current Tenure</span>
                  <span className="text-[var(--trend-positive)] font-semibold">
                    Active Manager ({details.manager.season || "Current Season"})
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                Manager profile pending synchronization.
              </div>
            )}

            {/* Domestic League Standing Quick Card */}
            {details?.leagueTable && (
              <div className="pt-2 border-t border-[var(--divider)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">League Standing:</span>
                  <span className="font-bold text-[var(--value-text)]">
                    Rank #{details.leagueTable.rank} in {leagueName || "League"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">PTS</span>
                    <span className="font-extrabold text-[var(--text-primary)] tabular-nums">{details.leagueTable.pts}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">P</span>
                    <span className="font-extrabold text-[var(--text-primary)] tabular-nums">{details.leagueTable.played}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">W-D-L</span>
                    <span className="font-extrabold text-[var(--text-primary)] tabular-nums">
                      {details.leagueTable.wins}-{details.leagueTable.draws}-{details.leagueTable.losses}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">GD</span>
                    <span className="font-extrabold text-[var(--text-primary)] tabular-nums">
                      {details.leagueTable.gd > 0 ? `+${details.leagueTable.gd}` : details.leagueTable.gd}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 5: Recent Form & Next Fixture */}
      {activeTab === "form" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Form */}
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--divider)]">
              <History className="w-4 h-4 text-[var(--value-text)]" />
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                Recent Match Form
              </h3>
            </div>

            {details?.recentForm && details.recentForm.length > 0 ? (
              <div className="space-y-2 pt-1">
                {details.recentForm.map((m, idx) => {
                  const isWin = m.result === "W";
                  const isLoss = m.result === "L";
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                            isWin
                              ? "bg-[var(--trend-positive)]/15 text-[var(--trend-positive)]"
                              : isLoss
                              ? "bg-[var(--trend-negative)]/15 text-[var(--trend-negative)]"
                              : "bg-[var(--bg-chip)] text-[var(--text-muted)]"
                          }`}
                        >
                          {m.result}
                        </span>
                        <div>
                          <span className="text-[var(--text-primary)] font-semibold block">{m.opponent}</span>
                          {m.date && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              <time dateTime={m.date} suppressHydrationWarning>
                                {formatDate(m.date)}
                              </time>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-extrabold text-[var(--text-primary)] tabular-nums px-2 py-0.5 rounded bg-[var(--bg-page)]">
                        {m.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                Recent match form data currently unavailable.
              </div>
            )}
          </Card>

          {/* Next Match Fixture */}
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--divider)]">
              <Calendar className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                Next Scheduled Match
              </h3>
            </div>

            {details?.nextMatch ? (
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--bg-chip)] text-[var(--accent)]">
                  {details.nextMatch.tournament}
                </span>
                <div className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  {details.nextMatch.isHome ? `${clubName} vs ${details.nextMatch.opponent}` : `${details.nextMatch.opponent} vs ${clubName}`}
                </div>
                {details.nextMatch.date && (
                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      <KickoffTime date={details.nextMatch.date} includeDate={true} />
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                Next fixture schedule pending announcement.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
