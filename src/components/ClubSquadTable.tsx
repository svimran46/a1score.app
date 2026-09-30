"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur, formatEur } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  AlertTriangle,
  Users,
  Shield,
  Clock,
  Calendar,
} from "lucide-react";

export interface SquadPlayerRow {
  id: string;
  sourceId?: string | null;
  slug?: string | null;
  fullName: string;
  commonName?: string | null;
  number?: number | null;
  position: string;
  positionGroup: "GK" | "DEF" | "MID" | "ATT" | string;
  age?: number | null;
  contractUntil?: string | null;
  injury?: string | null;
  tier?: "first_team" | "academy" | string;
  nationality: string[];
  photoUrl?: string | null;
  latestMarketValue?: number | null;
}

interface ClubSquadTableProps {
  players: SquadPlayerRow[];
  firstTeamPlayers?: SquadPlayerRow[];
  academyPlayers?: SquadPlayerRow[];
  clubName: string;
}

type SortField = "value" | "age" | "name" | "number" | "contract";
type SortDirection = "asc" | "desc";

export function ClubSquadTable({
  players,
  firstTeamPlayers = [],
  academyPlayers = [],
  clubName,
}: ClubSquadTableProps) {
  const [selectedTier, setSelectedTier] = useState<"first_team" | "academy">("first_team");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    GK: false,
    DEF: false,
    MID: false,
    ATT: false,
  });

  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Choose roster according to tier
  const activeList = useMemo(() => {
    if (selectedTier === "first_team") {
      return firstTeamPlayers.length > 0
        ? firstTeamPlayers
        : players.filter((p) => p.tier !== "academy");
    }
    return academyPlayers.length > 0
      ? academyPlayers
      : players.filter((p) => p.tier === "academy");
  }, [selectedTier, players, firstTeamPlayers, academyPlayers]);

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Group by Canonical Position
  const groupedPlayers = useMemo(() => {
    const groups: Record<"GK" | "DEF" | "MID" | "ATT", SquadPlayerRow[]> = {
      GK: [],
      DEF: [],
      MID: [],
      ATT: [],
    };

    activeList.forEach((p) => {
      let g = (p.positionGroup || "MID").toUpperCase() as "GK" | "DEF" | "MID" | "ATT";
      if (!groups[g]) g = "MID";
      groups[g].push(p);
    });

    // Sort each group
    Object.keys(groups).forEach((key) => {
      const gKey = key as "GK" | "DEF" | "MID" | "ATT";
      groups[gKey].sort((a, b) => {
        let diff = 0;
        if (sortField === "value") {
          diff = (b.latestMarketValue || 0) - (a.latestMarketValue || 0);
        } else if (sortField === "age") {
          diff = (b.age || 0) - (a.age || 0);
        } else if (sortField === "name") {
          diff = a.fullName.localeCompare(b.fullName);
        } else if (sortField === "number") {
          diff = (a.number || 999) - (b.number || 999);
        } else if (sortField === "contract") {
          diff = (a.contractUntil || "").localeCompare(b.contractUntil || "");
        }
        return sortDir === "asc" ? -diff : diff;
      });
    });

    return groups;
  }, [activeList, sortField, sortDir]);

  const positionMetadata = [
    { key: "GK", label: "Goalkeepers", short: "GK", badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    { key: "DEF", label: "Defenders", short: "DEF", badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    { key: "MID", label: "Midfielders", short: "MID", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { key: "ATT", label: "Forwards & Attackers", short: "ATT", badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  ];

  return (
    <div className="rounded-3xl glass-panel p-4 sm:p-7 border border-slate-800 space-y-6">
      {/* Header & Tier Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Squad Roster & Market Valuations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered senior squad grouped by tactical role. Click any column header to sort.
          </p>
        </div>

        {/* Tier Tabs (First Team vs Academy) */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-bold shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedTier("first_team")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              selectedTier === "first_team"
                ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            First Team ({firstTeamPlayers.length > 0 ? firstTeamPlayers.length : activeList.length})
          </button>
          {academyPlayers.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTier("academy")}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                selectedTier === "academy"
                  ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Academy / Reserves ({academyPlayers.length})
            </button>
          )}
        </div>
      </div>

      {/* Position Group Tables */}
      <div className="space-y-6">
        {positionMetadata.map((meta) => {
          const list = groupedPlayers[meta.key as "GK" | "DEF" | "MID" | "ATT"] || [];
          const isCollapsed = collapsedGroups[meta.key];
          const subtotalVal = list.reduce((sum, p) => sum + (p.latestMarketValue || 0), 0);

          if (list.length === 0) return null;

          return (
            <div
              key={meta.key}
              className="rounded-2xl border border-slate-800/90 bg-slate-900/30 overflow-hidden transition-all"
            >
              {/* Group Accordion Header */}
              <button
                type="button"
                onClick={() => toggleGroup(meta.key)}
                className="w-full px-4 sm:px-6 py-3.5 bg-slate-900/60 hover:bg-slate-850/80 flex items-center justify-between transition-colors cursor-pointer"
                aria-expanded={!isCollapsed}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black border uppercase tracking-wider ${meta.badgeColor}`}>
                    {meta.short}
                  </span>
                  <span className="text-sm font-bold text-white tracking-tight">
                    {meta.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({list.length} {list.length === 1 ? "player" : "players"})
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs sm:text-sm font-extrabold text-amber-400 tabular-nums">
                    {formatCompactEur(subtotalVal)}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Group Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800/80 bg-slate-950/40">
                        <th className="py-2.5 px-3 sm:px-4 w-12 text-center">
                          <button
                            type="button"
                            onClick={() => handleSort("number")}
                            className="flex items-center justify-center gap-1 hover:text-white"
                          >
                            #
                          </button>
                        </th>
                        <th className="py-2.5 px-3 font-semibold">
                          <button
                            type="button"
                            onClick={() => handleSort("name")}
                            className="flex items-center gap-1 hover:text-white"
                          >
                            Player <ArrowUpDown className="w-3 h-3 opacity-60" />
                          </button>
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-center w-16">
                          <button
                            type="button"
                            onClick={() => handleSort("age")}
                            className="flex items-center justify-center gap-1 hover:text-white mx-auto"
                          >
                            Age <ArrowUpDown className="w-3 h-3 opacity-60" />
                          </button>
                        </th>
                        <th className="py-2.5 px-3 font-semibold">Position</th>
                        <th className="py-2.5 px-3 font-semibold">Nationality</th>
                        <th className="py-2.5 px-3 font-semibold">
                          <button
                            type="button"
                            onClick={() => handleSort("contract")}
                            className="flex items-center gap-1 hover:text-white"
                          >
                            Contract Until <ArrowUpDown className="w-3 h-3 opacity-60" />
                          </button>
                        </th>
                        <th className="py-2.5 px-3 sm:px-4 text-right font-semibold">
                          <button
                            type="button"
                            onClick={() => handleSort("value")}
                            className="flex items-center justify-end gap-1 hover:text-white ml-auto"
                          >
                            Market Value <ArrowUpDown className="w-3 h-3 opacity-60" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {list.map((player) => {
                        const extId = player.sourceId || player.id;
                        const slug =
                          player.slug ||
                          `${player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`;

                        return (
                          <tr
                            key={player.id}
                            className="hover:bg-slate-800/40 transition-colors group"
                          >
                            {/* Shirt Number */}
                            <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-400 tabular-nums">
                              {player.number ? player.number : "N/A"}
                            </td>

                            {/* Player Info (Name + Photo + Injury) */}
                            <td className="py-3 px-3">
                              <Link
                                href={`/players/${slug}`}
                                className="flex items-center gap-3 min-w-0"
                              >
                                <div className="relative w-8 h-8 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                                  <EntityImage
                                    src={player.photoUrl}
                                    alt=""
                                    fill
                                    sizes="32px"
                                    entityType="player"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-white font-semibold group-hover:text-amber-400 transition-colors truncate block">
                                    {player.commonName || player.fullName}
                                  </span>
                                  {player.injury && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 mt-0.5">
                                      <AlertTriangle className="w-3 h-3" />
                                      {player.injury}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            </td>

                            {/* Age */}
                            <td className="py-3 px-3 text-center text-slate-300 tabular-nums">
                              {player.age ? player.age : "N/A"}
                            </td>

                            {/* Detailed Position */}
                            <td className="py-3 px-3 text-slate-300">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium border border-slate-700/60 whitespace-nowrap">
                                {player.position}
                              </span>
                            </td>

                            {/* Nationality */}
                            <td className="py-3 px-3 text-slate-300 truncate max-w-[120px]">
                              {player.nationality && player.nationality.length > 0
                                ? player.nationality.join(", ")
                                : "N/A"}
                            </td>

                            {/* Contract Expiry */}
                            <td className="py-3 px-3 text-slate-400 tabular-nums whitespace-nowrap">
                              {player.contractUntil ? player.contractUntil : "N/A"}
                            </td>

                            {/* Market Value */}
                            <td className="py-3 px-3 sm:px-4 text-right text-amber-400 font-extrabold whitespace-nowrap text-sm tabular-nums">
                              {player.latestMarketValue && player.latestMarketValue > 0
                                ? formatCompactEur(player.latestMarketValue)
                                : "N/A"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
