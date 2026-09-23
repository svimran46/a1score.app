import Link from "next/link";

import { TeamLogo } from "@/components/shared/team-logo";
import { EmptyState } from "@/components/shared/states";
import type { Standing, StandingRow } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/**
 * Zone color from the row's own `description` — never from rank math
 * (Section 8.3). Returns border + tint classes.
 */
function zoneClasses(description: string | null): { border: string; tint: string; dot: string } {
  const d = (description ?? "").toLowerCase();
  if (d.includes("relegation")) {
    return { border: "border-l-destructive", tint: "bg-destructive/[0.04]", dot: "bg-destructive" };
  }
  if (d.includes("conference")) {
    return { border: "border-l-chart-3", tint: "bg-chart-3/[0.04]", dot: "bg-chart-3" };
  }
  if (d.includes("europa") || d.includes("europhean") || d.includes("europe")) {
    return { border: "border-l-chart-4", tint: "bg-chart-4/[0.04]", dot: "bg-chart-4" };
  }
  if (d.includes("champions") || d.includes("promotion") || d.includes("play-off") || d.includes("playoff")) {
    return { border: "border-l-emerald-500", tint: "bg-emerald-500/[0.04]", dot: "bg-emerald-500" };
  }
  return { border: "border-l-transparent", tint: "", dot: "bg-border" };
}

function FormPips({ form }: { form: string | null }) {
  if (!form) return <span className="text-muted-foreground text-xs">–</span>;
  const chars = form.toUpperCase().slice(-5).split("");
  return (
    <span className="flex items-center gap-0.5" aria-label={`Form: ${form}`}>
      {chars.map((c, i) => (
        <span
          key={i}
          title={c === "W" ? "Win" : c === "D" ? "Draw" : "Loss"}
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white",
            c === "W" && "bg-emerald-600",
            c === "D" && "bg-muted-foreground/70",
            c === "L" && "bg-destructive",
          )}
        >
          {c}
        </span>
      ))}
    </span>
  );
}

/**
 * League table (Section 8.3). Row accents derive from each row's
 * `description` (e.g. "Promotion - Champions League"), with a legend.
 */
export function StandingsTable({ standing }: { standing: Standing }) {
  const rows = standing.rows;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No table yet"
        message="Standings appear once the season has games played."
      />
    );
  }

  const zones = [...new Set(rows.map((r) => r.description).filter((d): d is string => d !== null))];

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-sm">
          <caption className="sr-only">League standings</caption>
          <thead>
            <tr className="text-muted-foreground border-b text-2xs tracking-wide uppercase">
              <th scope="col" className="px-2 py-2 text-left font-medium">#</th>
              <th scope="col" className="py-2 text-left font-medium">Team</th>
              <th scope="col" className="px-1.5 py-2 text-right font-medium" title="Played">P</th>
              <th scope="col" className="px-1.5 py-2 text-right font-medium" title="Won">W</th>
              <th scope="col" className="px-1.5 py-2 text-right font-medium" title="Drawn">D</th>
              <th scope="col" className="px-1.5 py-2 text-right font-medium" title="Lost">L</th>
              <th scope="col" className="hidden px-1.5 py-2 text-right font-medium sm:table-cell" title="Goals for">GF</th>
              <th scope="col" className="hidden px-1.5 py-2 text-right font-medium sm:table-cell" title="Goals against">GA</th>
              <th scope="col" className="px-1.5 py-2 text-right font-medium" title="Goal difference">GD</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Pts</th>
              <th scope="col" className="hidden px-2 py-2 text-right font-medium md:table-cell">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((row: StandingRow) => {
              const zone = zoneClasses(row.description);
              return (
                <tr
                  key={row.teamId}
                  className={cn("border-l-2 transition-colors hover:bg-accent/40", zone.border, zone.tint)}
                  title={row.description ?? undefined}
                >
                  <td className="tabnum px-2 py-2 text-left text-xs text-muted-foreground">
                    {row.rank}
                  </td>
                  <td className="max-w-[180px] py-2">
                    <Link
                      href={`/teams/${row.teamId}`}
                      className="flex items-center gap-2 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <TeamLogo src={row.teamLogoUrl} alt={row.teamName} size={20} />
                      <span className="truncate font-medium">{row.teamName}</span>
                    </Link>
                  </td>
                  <td className="tabnum px-1.5 py-2 text-right">{row.played}</td>
                  <td className="tabnum px-1.5 py-2 text-right">{row.win}</td>
                  <td className="tabnum px-1.5 py-2 text-right">{row.draw}</td>
                  <td className="tabnum px-1.5 py-2 text-right">{row.lose}</td>
                  <td className="tabnum hidden px-1.5 py-2 text-right sm:table-cell">{row.goalsFor}</td>
                  <td className="tabnum hidden px-1.5 py-2 text-right sm:table-cell">{row.goalsAgainst}</td>
                  <td className="tabnum px-1.5 py-2 text-right">
                    {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                  </td>
                  <td className="tabnum px-2 py-2 text-right font-bold">{row.points}</td>
                  <td className="hidden px-2 py-2 md:table-cell">
                    <div className="flex justify-end">
                      <FormPips form={row.form} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {zones.length > 0 ? (
        <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 border-t px-3 py-2 text-2xs">
          {zones.map((z) => {
            const zone = zoneClasses(z);
            return (
              <li key={z} className="flex items-center gap-1.5">
                <span aria-hidden className={cn("size-1.5 rounded-full", zone.dot)} />
                {z}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
