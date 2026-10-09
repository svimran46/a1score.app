"use client";

import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur, calculateAge } from "@/lib/utils";
import type { PositionalPeer } from "@/lib/data/players";
import { Users, User, Shield, ArrowUpRight, ArrowDownRight, Award } from "lucide-react";

interface PositionalPeersProps {
  currentMarketValue: number;
  currentPosition: string;
  peers: PositionalPeer[];
}

export function PositionalPeers({
  currentMarketValue,
  currentPosition,
  peers,
}: PositionalPeersProps) {
  if (!peers || peers.length === 0) {
    return null;
  }

  // Calculate highest valuation among peers and subject for relative width bars
  const maxValuation = Math.max(
    currentMarketValue,
    ...peers.map((p) => p.latestMarketValue)
  );

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-divider space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-divider gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-value-text" />
            <h3 className="text-lg font-bold text-text-primary tracking-tight">
              Positional Peer Benchmarking
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Top worldwide valuations in the {currentPosition} category
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-value-text border border-accent/20 font-semibold self-start sm:self-auto">
          Global Elite Comparison
        </span>
      </div>

      {/* Peer Cards Grid */}
      <div className="space-y-3">
        {peers.map((peer, idx) => {
          const diff = peer.latestMarketValue - currentMarketValue;
          const isHigher = diff > 0;
          const isLower = diff < 0;
          const barWidth = Math.max(
            15,
            Math.round((peer.latestMarketValue / maxValuation) * 100)
          );
          const age = peer.dateOfBirth ? calculateAge(peer.dateOfBirth) : null;

          return (
            <Link
              key={peer.id}
              href={`/players/${peer.slug}`}
              className="group rounded-2xl glass-panel glass-panel-hover p-4 border border-divider/80 hover:border-accent/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <span className="w-6 text-center font-black text-text-muted text-xs tabular-nums">
                  #{idx + 1}
                </span>

                <div className="relative w-12 h-12 rounded-xl bg-bg-chip flex-shrink-0 overflow-hidden border border-divider/60">
                  <EntityImage
                    src={peer.photoUrl}
                    alt={peer.fullName}
                    fill
                    sizes="48px"
                    entityType="player"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-text-primary tracking-tight truncate group-hover:text-value-text transition-colors">
                      {peer.commonName || peer.fullName}
                    </h4>
                    {age && (
                      <span className="text-[11px] text-text-muted tabular-nums">
                        ({age} y/o)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted truncate mt-0.5">
                    {peer.currentClub?.name || "Club"} • {peer.subPosition || peer.position}
                  </div>

                  {/* Relative Valuation Bar */}
                  <div className="mt-2 w-full max-w-xs h-1.5 bg-bg-chip/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent/80 rounded-full group-hover:bg-accent transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Valuation & Delta from Subject */}
              <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center flex-shrink-0 text-right space-y-1 pl-9 sm:pl-0">
                <span className="text-base font-black text-value-text figure tabular-nums">
                  {formatCompactEur(peer.latestMarketValue)}
                </span>

                {diff !== 0 ? (
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
                      isHigher ? "text-value-text/90" : "text-text-muted"
                    }`}
                  >
                    {isHigher ? "+" : "-"}
                    {formatCompactEur(Math.abs(diff))} vs profile
                  </span>
                ) : (
                  <span className="text-xs font-medium text-text-muted">Equal valuation</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
