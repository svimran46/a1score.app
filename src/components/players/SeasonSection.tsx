import React from "react";
import type { PlayerProfileVM, SeasonStatRow } from "@/lib/data/playerProfile.types";
import { getProfileSeasonStats, seasonStartYear } from "@/lib/data/playerSeason";
import { getClubShortName } from "@/lib/data/clubs";
import { formatCount } from "@/lib/format-value";
import { StatsTable } from "@/components/StatsTable";
import { ProfileDisclosure, ProfileSection } from "@/components/players/ProfileSection";

/** Same footprint as the rendered section's first screen, so streaming in never shifts the page. */
export function SeasonSkeleton() {
  return (
    <div aria-hidden="true" className="h-[184px] rounded-[var(--card-radius)] bg-bg-card p-4 @[560px]/profile:p-5">
      <div className="flex h-11 items-center justify-between">
        <div className="h-[18px] w-36 rounded bg-bg-elevated motion-safe:animate-pulse" />
        <div className="h-4 w-16 rounded bg-bg-elevated motion-safe:animate-pulse" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-4 @[560px]/profile:grid-cols-4">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="h-3 w-12 rounded bg-bg-elevated motion-safe:animate-pulse" />
            <div className="mt-1.5 h-6 w-10 rounded bg-bg-elevated motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-5 w-3/4 rounded bg-bg-elevated motion-safe:animate-pulse" />
    </div>
  );
}

/** "2025/26" for split seasons; calendar-year leagues keep their single year. */
export function seasonLabel(startYear: number, calendarYear: boolean): string {
  return calendarYear ? String(startYear) : `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** Start year of the season in progress: split seasons roll over in July (UTC). */
export function currentSeasonStart(now: Date, calendarYear: boolean): number {
  const y = now.getUTCFullYear();
  return calendarYear || now.getUTCMonth() >= 6 ? y : y - 1;
}

type Totals = { apps: number | null; goals: number | null; assists: number | null; minutes: number | null };

/** Sums within one season. A stat no row records stays null; minutes need every row. */
export function seasonTotals(rows: SeasonStatRow[]): Totals {
  const sum = (key: "appearances" | "goals" | "assists") => {
    const vals = rows.map((r) => r[key]).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  };
  const minutes = rows.every((r) => r.minutesPlayed != null)
    ? rows.reduce((a, r) => a + (r.minutesPlayed as number), 0)
    : null;
  return { apps: sum("appearances"), goals: sum("goals"), assists: sum("assists"), minutes };
}

export interface SeasonModel {
  title: string;
  clubLabel: string | null;
  totals: Totals;
  competitions: SeasonStatRow[];
  career: SeasonStatRow[];
  seasonCount: number;
}

/** Pure shaping of verified rows; null when no row carries a usable season. */
export function buildSeasonModel(rows: SeasonStatRow[], opts: { retired: boolean; now?: Date }): SeasonModel | null {
  const dated = rows
    .map((r, i) => ({ r, i, y: seasonStartYear(r.season) }))
    .filter((x): x is { r: SeasonStatRow; i: number; y: number } => x.y != null);
  if (dated.length === 0) return null;

  const latest = Math.max(...dated.map((x) => x.y));
  const competitions = dated.filter((x) => x.y === latest).map((x) => x.r);
  const calendarYear = competitions.every((r) => /^\s*\d{4}\s*$/.test(r.season));
  const label = seasonLabel(latest, calendarYear);
  const current = currentSeasonStart(opts.now ?? new Date(), calendarYear);
  const title = opts.retired || latest < current ? `Last recorded season ${label}` : `Season ${label}`;

  const clubs = Array.from(new Set(competitions.map((r) => r.clubName).filter((c): c is string => !!c)));
  const clubLabel = clubs.length === 1 ? getClubShortName(clubs[0]) || clubs[0] : null;

  // Newest season first; rows within a season keep source order.
  const career = [...dated].sort((a, b) => b.y - a.y || a.i - b.i).map((x) => x.r);
  const seasonCount = new Set(dated.map((x) => x.y)).size;

  return { title, clubLabel, totals: seasonTotals(competitions), competitions, career, seasonCount };
}

function Stat({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium leading-4 text-text-muted">{label}</dt>
      <dd className="mt-1 text-xl font-semibold leading-6 tabular-nums text-text-primary">{formatCount(value)}</dd>
    </div>
  );
}

function competitionLine(r: SeasonStatRow): string {
  const plural = (n: number, one: string, many: string) => `${formatCount(n)} ${n === 1 ? one : many}`;
  return [
    r.appearances != null ? plural(r.appearances, "app", "apps") : null,
    r.goals != null ? plural(r.goals, "goal", "goals") : null,
    r.assists != null ? plural(r.assists, "assist", "assists") : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function SeasonView({ model }: { model: SeasonModel }) {
  const { title, clubLabel, totals, competitions, career, seasonCount } = model;
  const hasTotals = totals.apps != null || totals.goals != null || totals.assists != null || totals.minutes != null;

  return (
    <ProfileSection
      id="season"
      navLabel="Season"
      title={title}
      surface="card"
      meta={clubLabel ? <span className="text-text-muted">{clubLabel}</span> : null}
    >
      {hasTotals ? (
        <dl className="grid grid-cols-3 gap-x-4 gap-y-3 @[560px]/profile:grid-cols-4">
          <Stat label="Apps" value={totals.apps} />
          <Stat label="Goals" value={totals.goals} />
          <Stat label="Assists" value={totals.assists} />
          <Stat label="Minutes" value={totals.minutes} />
        </dl>
      ) : null}

      <ul className={`list-none ${hasTotals ? "mt-4" : ""}`}>
        {competitions.map((r, i) => {
          const line = competitionLine(r);
          return (
            <li
              key={`${r.competition ?? ""}-${i}`}
              className="flex min-h-11 items-center justify-between gap-3 border-t border-divider/60 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-5 text-text-primary">
                  {r.competition ?? "Competition not recorded"}
                </p>
                {line ? <p className="text-xs leading-4 tabular-nums text-text-secondary">{line}</p> : null}
              </div>
              {r.rating != null ? (
                <p className="shrink-0 text-xs leading-4 text-text-muted">
                  {"rating "}
                  <span className="text-sm font-semibold tabular-nums text-text-primary">{r.rating.toFixed(1)}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <ProfileDisclosure
        surface="card"
        summary={`Career stats (${seasonCount} ${seasonCount === 1 ? "season" : "seasons"})`}
        className="mt-1 border-t border-divider/60"
      >
        <StatsTable rows={career} surface="card" />
      </ProfileDisclosure>
    </ProfileSection>
  );
}

/**
 * Season (#season), streamed inside <Suspense fallback={<SeasonSkeleton />}>.
 * Optional by design: no verified rows, an error or a timeout renders nothing.
 */
export async function SeasonSection({ vm, now }: { vm: PlayerProfileVM; now?: Date }) {
  let rows: SeasonStatRow[] | null = null;
  try {
    rows = await getProfileSeasonStats(vm.season);
  } catch {
    rows = null;
  }
  if (!rows || rows.length === 0) return null;
  const model = buildSeasonModel(rows, { retired: vm.status.kind === "retired", now });
  return model ? <SeasonView model={model} /> : null;
}
