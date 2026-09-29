"use client";

import { useState } from "react";
import { EntityImage } from "./EntityImage";
import Link from "next/link";
import { formatCompactEur } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  Building2,
  User,
  ShieldCheck,
} from "lucide-react";

export interface ClubTransferRecord {
  id: string;
  fromClubName: string | null;
  toClubName: string | null;
  date: string | Date;
  feeEur: number;
  transferType?: string | null;
  player: {
    id: string;
    fullName: string;
    commonName?: string | null;
    photoUrl?: string | null;
    position?: string | null;
    transfermarktId?: string | null;
  } | null;
}

interface ClubTransferLedgerProps {
  recordArrivals: ClubTransferRecord[];
  recordDepartures: ClubTransferRecord[];
  clubName: string;
}

export function ClubTransferLedger({
  recordArrivals,
  recordDepartures,
  clubName,
}: ClubTransferLedgerProps) {
  const [activeTab, setActiveTab] = useState<"arrivals" | "departures">("arrivals");

  const hasArrivals = recordArrivals && recordArrivals.length > 0;
  const hasDepartures = recordDepartures && recordDepartures.length > 0;

  if (!hasArrivals && !hasDepartures) {
    return null;
  }

  const activeList = activeTab === "arrivals" ? recordArrivals : recordDepartures;

  const totalArrivalsSpend = recordArrivals.reduce((sum, t) => sum + (t.feeEur || 0), 0);
  const totalDeparturesIncome = recordDepartures.reduce((sum, t) => sum + (t.feeEur || 0), 0);

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 space-y-6">
      {/* Header and Filter Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Transfer Flow & Record Ledger
            </h3>
            <p className="text-xs text-slate-400">
              Verified historical commercial market fees for {clubName}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("arrivals")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "arrivals"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Record Signings ({recordArrivals.length})
          </button>
          <button
            onClick={() => setActiveTab("departures")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "departures"
                ? "bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Record Sales ({recordDepartures.length})
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-amber-400" />
            Top 5 Inbound Investment
          </span>
          <span className="font-black text-amber-400 tabular-nums">
            {formatCompactEur(totalArrivalsSpend)}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            Top 5 Outbound Realized
          </span>
          <span className="font-black text-emerald-400 tabular-nums">
            {formatCompactEur(totalDeparturesIncome)}
          </span>
        </div>
      </div>

      {/* Transfer Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
              <th className="pb-3 w-8 font-semibold text-center">#</th>
              <th className="pb-3 font-semibold">Player</th>
              <th className="pb-3 font-semibold">Position</th>
              <th className="pb-3 font-semibold">
                {activeTab === "arrivals" ? "Signed From" : "Sold To"}
              </th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 text-right font-semibold">Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {activeList.map((t, index) => {
              const p = t.player;
              const slug = p
                ? `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${
                    p.transfermarktId || p.id
                  }`
                : null;
              const counterparty =
                activeTab === "arrivals" ? t.fromClubName : t.toClubName;

              return (
                <tr
                  key={t.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="py-3 text-center font-bold text-slate-500 tabular-nums">
                    {index + 1}
                  </td>
                  <td className="py-3 pr-4">
                    {p && slug ? (
                      <Link
                        href={`/players/${slug}`}
                        className="flex items-center gap-3"
                      >
                        <div className="relative w-8 h-8 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60">
                          <EntityImage
                            src={p.photoUrl}
                            alt={p.fullName}
                            fill
                            sizes="32px"
                            entityType="player"
                            className="object-cover"
                          />
                        </div>
                        <span className="text-white font-semibold group-hover:text-amber-400 transition-colors">
                          {p.commonName || p.fullName}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-slate-300 font-medium">
                        Unknown Player
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium border border-slate-700/60">
                      {p?.position || "Player"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {counterparty || "Direct / Open Market"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-400 tabular-nums whitespace-nowrap">
                    {formatDate(t.date)}
                  </td>
                  <td className="py-3 text-right font-extrabold whitespace-nowrap text-sm tabular-nums">
                    <span
                      className={
                        activeTab === "arrivals"
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }
                    >
                      {formatCompactEur(t.feeEur)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Verified Transfermarkt Commercial Ledger
        </span>
        <span>Excludes internal youth academy progressions</span>
      </div>
    </div>
  );
}
