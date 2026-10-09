import React from "react";
import type { SeasonStatRow } from "@/lib/data/playerProfile.types";
import { formatCount } from "@/lib/format-value";

type StatKey = "competition" | "clubName" | "appearances" | "goals" | "assists" | "minutesPlayed" | "yellowCards" | "redCards" | "rating";

const COLUMNS: { key: StatKey; label: string; srLabel?: string; numeric: boolean }[] = [
  { key: "competition", label: "Competition", numeric: false },
  { key: "clubName", label: "Club", numeric: false },
  { key: "appearances", label: "Apps", srLabel: "Appearances", numeric: true },
  { key: "goals", label: "Goals", numeric: true },
  { key: "assists", label: "Assists", numeric: true },
  { key: "minutesPlayed", label: "Minutes", numeric: true },
  { key: "yellowCards", label: "YC", srLabel: "Yellow cards", numeric: true },
  { key: "redCards", label: "RC", srLabel: "Red cards", numeric: true },
  { key: "rating", label: "Rating", numeric: true },
];

function NotAvailable() {
  return (
    <>
      <span aria-hidden="true" className="text-text-muted">–</span>
      <span className="sr-only">not available</span>
    </>
  );
}

function cell(row: SeasonStatRow, key: StatKey): React.ReactNode {
  const v = row[key];
  if (v == null || v === "") return <NotAvailable />;
  if (key === "rating" && typeof v === "number") return v.toFixed(1);
  if (typeof v === "number") return formatCount(v);
  return v;
}

export interface StatsTableProps {
  rows: SeasonStatRow[];
  caption?: string;
  /** Surface the table sits on, so the sticky first column covers what scrolls under it. */
  surface?: "card" | "page";
}

/**
 * Career stats: a plain, honest table. A missing figure is "–" (read as
 * "not available"), never 0; a column with no data at all is dropped.
 * Counts are ordinary tabular text, not the money or trend voice.
 */
export function StatsTable({ rows, caption = "Career stats by season and competition", surface = "card" }: StatsTableProps) {
  if (!rows || rows.length === 0) return null;

  const columns = COLUMNS.filter((c) => rows.some((r) => r[c.key] != null && r[c.key] !== ""));
  const stickyBg = surface === "card" ? "bg-bg-card" : "bg-bg-page";
  const ring = surface === "card" ? "focus-visible:ring-offset-[var(--bg-card)]" : "focus-visible:ring-offset-[var(--bg-page)]";

  return (
    <div
      role="region"
      aria-label="Career stats"
      tabIndex={0}
      className={`overflow-x-auto overscroll-x-contain rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 ${ring}`}
    >
      <table className="w-full min-w-max border-collapse text-left text-sm tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-divider/60">
            <th scope="col" className={`sticky left-0 z-10 ${stickyBg} py-2 pr-4 text-xs font-medium leading-4 text-text-muted`}>
              Season
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`py-2 pr-4 text-xs font-medium leading-4 text-text-muted last:pr-0 ${c.numeric ? "text-right" : ""}`}
              >
                {c.srLabel ? (
                  <>
                    <span aria-hidden="true">{c.label}</span>
                    <span className="sr-only">{c.srLabel}</span>
                  </>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.season}-${r.competition ?? ""}-${r.clubName ?? ""}-${i}`} className="border-b border-divider/60 last:border-b-0">
              <th
                scope="row"
                className={`sticky left-0 z-10 ${stickyBg} whitespace-nowrap py-2 pr-4 font-medium text-text-primary`}
              >
                {r.season}
              </th>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`py-2 pr-4 last:pr-0 ${
                    c.numeric
                      ? "whitespace-nowrap text-right font-semibold text-text-primary"
                      : "max-w-[11rem] truncate text-text-secondary"
                  }`}
                >
                  {cell(r, c.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
