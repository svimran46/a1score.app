import React from "react";
import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getClubShortName } from "@/lib/data/clubs";

interface HomePlayerRowProps {
  rank: number;
  id: string;
  name: string;
  slug?: string;
  photoUrl?: string | null;
  club?: {
    name?: string | null;
    shortName?: string | null;
    logoUrl?: string | null;
  } | null;
  marketValue?: number | null;
  change?: number | null;
}

/**
 * HomePlayerRow (64px tall, NO card per row, rows in one surface with 1px dividers):
 * [rank 20px muted] [photo 40px circle] [name 15/500, below it club crest 14px + short club name 12px muted] [value 15/600 gold, right].
 * For movers, show the change (+EUR30M / +€30M) as 12px green text under the value.
 * Nothing may be truncated: if a name does not fit, reduce nothing, just allow wrapping to 2 lines.
 */
export function HomePlayerRow({
  rank,
  id,
  name,
  slug,
  photoUrl,
  club,
  marketValue,
  change,
}: HomePlayerRowProps) {
  const shortClubName = getClubShortName(club);
  const valueDisplay = marketValue ? formatCompactEur(marketValue) : "";

  let changeFormatted: string | null = null;
  let isPositiveChange = true;
  if (typeof change === "number" && change !== 0) {
    isPositiveChange = change > 0;
    const sign = change > 0 ? "+" : "−"; // true minus sign \u2212
    const absVal = Math.abs(change);
    const compactStr = formatCompactEur(absVal);
    changeFormatted = `${sign}${compactStr}`;
  }

  return (
    <Link
      href={`/players/${slug || id}`}
      className="min-h-[64px] h-[64px] px-3 flex items-center hover:bg-[var(--color-surface-2)] transition-colors"
      style={{
        backgroundColor: "transparent",
      }}
    >
      {/* Rank (20px column, 13px secondary) */}
      <span
        className="w-5 min-w-[20px] text-center text-[13px] font-normal shrink-0 mr-2.5"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {rank}
      </span>

      {/* Photo (40px circle) */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 mr-3 border border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <EntityImage
          src={photoUrl}
          alt={name}
          width={40}
          height={40}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Middle Block: Name (15/500, wraps up to 2 lines, no truncation) + Club crest (14px) + short name (13px) */}
      <div className="flex-1 min-w-0 pr-2">
        <div
          className="text-[15px] font-medium leading-snug line-clamp-2"
          style={{ color: "var(--color-text)" }}
        >
          {name}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {club?.logoUrl && (
            <div className="relative w-3.5 h-3.5 shrink-0 flex items-center justify-center">
              <EntityImage
                src={club.logoUrl}
                alt={shortClubName || ""}
                width={14}
                height={14}
                className="object-contain w-3.5 h-3.5"
              />
            </div>
          )}
          <span
            className="text-[13px] font-normal leading-none"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {shortClubName || ""}
          </span>
        </div>
      </div>

      {/* Right Block: Value (15/600 gold) + optional change (+EUR30M / 12px green text) */}
      <div className="text-right shrink-0 flex flex-col items-end justify-center">
        <span
          className="text-[15px] font-semibold tabular-nums leading-tight"
          style={{ color: "var(--color-accent)" }}
        >
          {valueDisplay}
        </span>
        {changeFormatted && (
          <span
            className="text-[12px] font-normal tabular-nums leading-tight mt-0.5"
            style={{
              color: isPositiveChange ? "var(--color-positive)" : "var(--color-negative)",
            }}
          >
            {changeFormatted}
          </span>
        )}
      </div>
    </Link>
  );
}
