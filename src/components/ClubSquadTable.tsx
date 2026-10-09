"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getPlayerSlug } from "@/lib/slugs";
import { Card } from "@/components/ui";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  AlertTriangle,
  Users,
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

  // Check if active list has any documented contract expiry data
  const hasContractData = useMemo(() => {
    return activeList.some((p) => p.contractUntil && p.contractUntil.trim() !== "" && p.contractUntil !== "-");
  }, [activeList]);

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
    { key: "GK", label: "Goalkeepers", short: "GK", badgeBg: "bg-[var(--bg-chip)] text-[var(--value-text)]" },
    { key: "DEF", label: "Defenders", short: "DEF", badgeBg: "bg-[var(--bg-chip)] text-[var(--accent)]" },
    { key: "MID", label: "Midfielders", short: "MID", badgeBg: "bg-[var(--bg-chip)] text-[var(--trend-positive)]" },
    { key: "ATT", label: "Forwards & Attackers", short: "ATT", badgeBg: "bg-[var(--bg-chip)] text-[var(--trend-negative)]" },
  ];

  return (
    <Card className="p-4 sm:p-5 space-y-4 overflow-hidden">
      {/* Header & Tier Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--divider)] gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--value-text)]" />
            Squad Roster & Market Valuations
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Registered senior squad grouped by position. Click column headers to sort.
          </p>
        </div>

        {/* Tier Tabs (First Team vs Academy) */}
        <div className="flex items-center bg-[var(--bg-page)] p-1 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedTier("first_team")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedTier === "first_team"
                ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            First Team ({firstTeamPlayers.length > 0 ? firstTeamPlayers.length : activeList.length})
          </button>
          {academyPlayers.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTier("academy")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedTier === "academy"
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Academy ({academyPlayers.length})
            </button>
          )}
        </div>
      </div>

      {/* Position Group Tables */}
      <div className="space-y-4">
        {positionMetadata.map((meta) => {
          const list = groupedPlayers[meta.key as "GK" | "DEF" | "MID" | "ATT"] || [];
          const isCollapsed = collapsedGroups[meta.key];
          const subtotalVal = list.reduce((sum, p) => sum + (p.latestMarketValue || 0), 0);

          if (list.length === 0) return null;

          return (
            <div
              key={meta.key}
              className="rounded-xl bg-[var(--bg-elevated)] overflow-hidden transition-all"
            >
              {/* Group Accordion Header */}
              <button
                type="button"
                onClick={() => toggleGroup(meta.key)}
                className="w-full px-3 sm:px-4 py-2.5 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors cursor-pointer select-none"
                aria-expanded={!isCollapsed}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${meta.badgeBg}`}>
                    {meta.short}
                  </span>
                  <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                    {meta.label}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    ({list.length})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-bold text-[var(--value-text)] figure tabular-nums">
                    {formatCompactEur(subtotalVal)}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </div>
              </button>

              {/* Group Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto border-t border-[var(--divider)]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[var(--text-muted)] uppercase tracking-wider text-[10px] font-bold border-b border-[var(--divider)] bg-bg-page/40">
                        <th className="py-2 px-3 w-10 text-center">
                          <button
                            type="button"
                            onClick={() => handleSort("number")}
                            className="flex items-center justify-center gap-0.5 hover:text-[var(--text-primary)]"
                          >
                            #
                          </button>
                        </th>
                        <th className="py-2 px-3 font-bold">
                          <button
                            type="button"
                            onClick={() => handleSort("name")}
                            className="flex items-center gap-1 hover:text-[var(--text-primary)]"
                          >
                            Player <ArrowUpDown className="w-3 h-3 opacity-60" />
                          </button>
                        </th>
                        <th className="py-2 px-3 font-bold text-center w-14">
                          <button
                            type="button"
                            onClick={() => handleSort("age")}
                            className="flex items-center justify-center gap-1 hover:text-[var(--text-primary)] mx-auto"
                          >
                            Age <ArrowUpDown className="w-3 h-3 opacity-60" />
                          </button>
                        </th>
                        <th className="py-2 px-3 font-bold">Position</th>
                        <th className="py-2 px-3 font-bold">Nationality</th>
                        {hasContractData && (
                          <th className="py-2 px-3 font-bold text-center">
                            <button
                              type="button"
                              onClick={() => handleSort("contract")}
                              className="flex items-center justify-center gap-1 hover:text-[var(--text-primary)] mx-auto"
                            >
                              Contract <ArrowUpDown className="w-3 h-3 opacity-60" />
                            </button>
                          </th>
                        )}
                        <th className="py-2 px-3 sm:px-4 text-right font-bold">
                          <button
                            type="button"
                            onClick={() => handleSort("value")}
                            className="flex items-center justify-end gap-1 hover:text-[var(--text-primary)] ml-auto"
                          >
                            Market Value <ArrowUpDown className="w-3 h-3 opacity-60" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--divider)]">
                      {list.map((player) => {
                        const extId = player.sourceId || player.id;
                        const slug =
                          player.slug ||
                          getPlayerSlug({ ...player, transfermarktId: extId });

                        return (
                          <tr
                            key={player.id}
                            className="hover:bg-[var(--bg-hover)] transition-colors group"
                          >
                            {/* Shirt Number */}
                            <td className="py-2.5 px-3 text-center font-bold text-[var(--text-muted)] tabular-nums">
                              {player.number ? player.number : "—"}
                            </td>

                            {/* Player Info (Name + Photo + Injury) */}
                            <td className="py-2.5 px-3">
                              <Link
                                href={`/players/${slug}`}
                                className="flex items-center gap-2.5 min-w-0"
                              >
                                <div className="relative w-7 h-7 rounded-lg bg-[var(--bg-page)] overflow-hidden shrink-0">
                                  <EntityImage
                                    src={player.photoUrl}
                                    alt=""
                                    fill
                                    sizes="28px"
                                    entityType="player"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[var(--text-primary)] font-semibold group-hover:text-[var(--accent)] transition-colors truncate block">
                                    {player.commonName || player.fullName}
                                  </span>
                                  {player.injury && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--trend-negative)] mt-0.5">
                                      <AlertTriangle className="w-3 h-3" />
                                      {player.injury}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            </td>

                            {/* Age */}
                            <td className="py-2.5 px-3 text-center text-[var(--text-secondary)] tabular-nums">
                              {player.age ? player.age : "—"}
                            </td>

                            {/* Detailed Position */}
                            <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                              <span className="px-2 py-0.5 rounded-md bg-[var(--bg-chip)] text-[11px] font-medium whitespace-nowrap">
                                {player.position}
                              </span>
                            </td>

                            {/* Nationality */}
                            <td className="py-2.5 px-3 text-[var(--text-secondary)] truncate max-w-[120px]">
                              {player.nationality && player.nationality.length > 0
                                ? player.nationality.join(", ")
                                : "—"}
                            </td>

                            {/* Contract Expiry (only rendered if squad has contract data) */}
                            {hasContractData && (
                              <td className="py-2.5 px-3 text-center text-[var(--text-secondary)] whitespace-nowrap tabular-nums">
                                {player.contractUntil && player.contractUntil !== "-"
                                  ? player.contractUntil
                                  : "—"}
                              </td>
                            )}

                            {/* Market Value */}
                            <td className="py-2.5 px-3 sm:px-4 text-right text-[var(--value-text)] figure font-bold whitespace-nowrap text-sm tabular-nums">
                              {player.latestMarketValue && player.latestMarketValue > 0
                                ? formatCompactEur(player.latestMarketValue)
                                : "—"}
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
    </Card>
  );
}
