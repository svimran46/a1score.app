import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, ArrowRight, Shield } from "lucide-react";
import { formatCompactEur } from "@/lib/utils";

export interface TransferRowProps {
  id?: string;
  playerName: string;
  playerSlug?: string | null;
  playerAvatar?: string | null;
  playerPosition?: string | null;
  fromClubName?: string | null;
  fromClubCrest?: string | null;
  toClubName?: string | null;
  toClubCrest?: string | null;
  fee?: number | string | null;
  transferType?: string | null; // e.g. "Loan", "Free", "End of loan"
  date?: string | null;
  isAgreedFutureDeal?: boolean;
  href?: string;
  className?: string;
}

/**
 * FotMob-style TransferRow component:
 * player avatar + name | from-club crest -> to-club crest | fee (amber, tabular-nums) | date (muted)
 */
export function TransferRow({
  id,
  playerName,
  playerSlug,
  playerAvatar,
  playerPosition,
  fromClubName,
  fromClubCrest,
  toClubName,
  toClubCrest,
  fee,
  transferType,
  date,
  isAgreedFutureDeal = false,
  href = playerSlug ? `/players/${playerSlug}` : id ? `/players/${id}` : "/transfers",
  className = "",
}: TransferRowProps) {
  // Format fee label
  const feeDisplay =
    typeof fee === "number"
      ? fee === 0
        ? transferType || "Free"
        : formatCompactEur(fee)
      : fee || transferType || "Undisclosed";

  const hasClubs = Boolean(fromClubName || toClubName);

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-3 px-3 sm:px-4 h-[var(--row-height)] min-h-[64px] rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] w-full select-none ${className}`}
    >
      {/* 1. Player Avatar + Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-chip)] overflow-hidden shrink-0 flex items-center justify-center relative">
          {playerAvatar ? (
            <Image
              src={playerAvatar}
              alt={playerName}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <User className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] truncate transition-colors">
            {playerName}
          </div>
          {/* Phones: the crest block is hidden, so name the clubs instead */}
          {hasClubs && (
            <div className="sm:hidden text-xs text-[var(--text-muted)] mt-0.5 truncate">
              {fromClubName || "Unknown"} <span aria-hidden="true">→</span>
              <span className="sr-only">to</span> {toClubName || "Unknown"}
            </div>
          )}
          {playerPosition && (
            <div className={`${hasClubs ? "hidden sm:block" : ""} text-xs text-[var(--text-muted)] mt-0.5 truncate`}>
              {playerPosition}
            </div>
          )}
        </div>
      </div>

      {/* 2. From-Club Crest -> To-Club Crest (480px+) */}
      <div className="hidden sm:flex items-center gap-2 shrink-0 px-2 sm:px-4">
        {/* From club */}
        <div
          className="w-7 h-7 rounded-lg bg-[var(--bg-chip)] flex items-center justify-center shrink-0 overflow-hidden relative"
          title={fromClubName || "Previous club"}
        >
          {fromClubCrest ? (
            <Image
              src={fromClubCrest}
              alt={fromClubName || ""}
              width={20}
              height={20}
              className="object-contain"
              unoptimized
            />
          ) : (
            <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          )}
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />

        {/* To club */}
        <div
          className="w-7 h-7 rounded-lg bg-[var(--bg-chip)] flex items-center justify-center shrink-0 overflow-hidden relative"
          title={toClubName || "New club"}
        >
          {toClubCrest ? (
            <Image
              src={toClubCrest}
              alt={toClubName || ""}
              width={20}
              height={20}
              className="object-contain"
              unoptimized
            />
          ) : (
            <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          )}
        </div>
      </div>

      {/* 3. Fee (amber, tabular-nums) | Date (muted) */}
      <div className="text-right shrink-0">
        <div className="text-sm sm:text-base font-bold text-[var(--value-text)] figure tabular-nums leading-tight">
          {feeDisplay}
        </div>
        {isAgreedFutureDeal ? (
          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-chip)] text-[var(--trend-positive)] whitespace-nowrap">
            {date || "Agreed Future Deal"}
          </span>
        ) : date ? (
          <div className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums">
            {date}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
