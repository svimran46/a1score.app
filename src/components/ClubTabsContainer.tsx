"use client";

import { useState } from "react";
import { ClubSquadTable, type SquadPlayerRow } from "./ClubSquadTable";
import { SquadValuationPyramid } from "./SquadValuationPyramid";
import { ClubTransferLedger } from "./ClubTransferLedger";
import type { FotmobTeamDetails } from "@/lib/fotmob/client";
import {
  Users,
  Layers,
  MapPin,
  Trophy,
  History,
  ArrowRightLeft,
  Calendar,
  Building,
  UserCheck,
} from "lucide-react";

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
}: ClubTabsContainerProps) {
  const [activeTab, setActiveTab] = useState<
    "squad" | "overview" | "form" | "transfers" | "pyramid"
  >("squad");

  const tabs = [
    { id: "squad", label: "Squad & Valuations", icon: Users },
    { id: "overview", label: "Stadium & Manager", icon: Building },
    { id: "form", label: "Recent Form & Fixtures", icon: History },
    { id: "transfers", label: "Transfer Ledger", icon: ArrowRightLeft },
    { id: "pyramid", label: "Valuation Pyramid", icon: Layers },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Bar */}
      <div className="flex items-center overflow-x-auto p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 gap-1 text-xs font-bold scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Squad & Valuations */}
      {activeTab === "squad" && (
        <ClubSquadTable
          players={players}
          firstTeamPlayers={firstTeamPlayers}
          academyPlayers={academyPlayers}
          clubName={clubName}
        />
      )}

      {/* Tab 2: Overview & Stadium */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stadium / Venue Info */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Home Ground & Stadium
                </h3>
                <p className="text-xs text-slate-400">Club stadium & infrastructure</p>
              </div>
            </div>

            {details?.venue ? (
              <div className="space-y-3 pt-2">
                <div className="text-lg font-black text-white">
                  {details.venue.name}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {details.venue.city && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 block uppercase text-[10px] font-bold">Location</span>
                      <span className="text-slate-200 font-semibold">{details.venue.city}</span>
                    </div>
                  )}
                  {details.venue.capacity && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 block uppercase text-[10px] font-bold">Capacity</span>
                      <span className="text-amber-400 font-extrabold tabular-nums">
                        {details.venue.capacity.toLocaleString("en-US")} seats
                      </span>
                    </div>
                  )}
                  {details.venue.surface && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 block uppercase text-[10px] font-bold">Pitch Surface</span>
                      <span className="text-slate-200 font-semibold">{details.venue.surface}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Stadium details pending synchronization.
              </div>
            )}
          </div>

          {/* Manager / Head Coach */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Manager & Head Coach
                </h3>
                <p className="text-xs text-slate-400">Tactical leadership</p>
              </div>
            </div>

            {details?.manager ? (
              <div className="space-y-3 pt-2">
                <div className="text-lg font-black text-white">
                  {details.manager.name}
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Current Tenure</span>
                  <span className="text-emerald-400 font-semibold">
                    Active Manager ({details.manager.season || "2026/2027 Season"})
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Manager profile pending synchronization.
              </div>
            )}

            {/* Domestic League Standing Quick Card */}
            {details?.leagueTable && (
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">League Standing:</span>
                  <span className="font-bold text-amber-400">
                    Rank #{details.leagueTable.rank} in {leagueName || "League"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">PTS</span>
                    <span className="font-extrabold text-white">{details.leagueTable.pts}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">P</span>
                    <span className="font-extrabold text-white">{details.leagueTable.played}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">W-D-L</span>
                    <span className="font-extrabold text-white">
                      {details.leagueTable.wins}-{details.leagueTable.draws}-{details.leagueTable.losses}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">GD</span>
                    <span className="font-extrabold text-white">
                      {details.leagueTable.gd > 0 ? `+${details.leagueTable.gd}` : details.leagueTable.gd}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Recent Form & Fixtures */}
      {activeTab === "form" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Form (Last 5) */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Recent Match Form
                </h3>
                <p className="text-xs text-slate-400">Last 5 competitive match results</p>
              </div>
            </div>

            {details?.recentForm && details.recentForm.length > 0 ? (
              <div className="space-y-2.5">
                {details.recentForm.map((m, idx) => {
                  const isWin = m.result === "W";
                  const isLoss = m.result === "L";
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                            isWin
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : isLoss
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-slate-700 text-slate-300 border border-slate-600"
                          }`}
                        >
                          {m.result}
                        </span>
                        <div>
                          <span className="text-white font-semibold block">{m.opponent}</span>
                          {m.date && (
                            <span className="text-[10px] text-slate-500">
                              {new Date(m.date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-extrabold text-white tabular-nums px-2.5 py-1 rounded bg-slate-800">
                        {m.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Recent match form data currently unavailable.
              </div>
            )}
          </div>

          {/* Next Match Fixture */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Next Scheduled Match
                </h3>
                <p className="text-xs text-slate-400">Upcoming competitive fixture</p>
              </div>
            </div>

            {details?.nextMatch ? (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {details.nextMatch.tournament}
                </span>
                <div className="text-base font-bold text-white">
                  {details.nextMatch.isHome ? `${clubName} vs ${details.nextMatch.opponent}` : `${details.nextMatch.opponent} vs ${clubName}`}
                </div>
                {details.nextMatch.date && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {new Date(details.nextMatch.date).toLocaleString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "short",
                      })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Next fixture schedule pending announcement.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Transfers Ledger */}
      {activeTab === "transfers" && (
        <ClubTransferLedger
          recordArrivals={transfersData.recordArrivals}
          recordDepartures={transfersData.recordDepartures}
          clubName={clubName}
        />
      )}

      {/* Tab 5: Valuation Architecture */}
      {activeTab === "pyramid" && (
        <SquadValuationPyramid
          players={firstTeamPlayers.length > 0 ? firstTeamPlayers : players}
          totalSquadValue={totalSquadValue}
          clubName={clubName}
        />
      )}
    </div>
  );
}
