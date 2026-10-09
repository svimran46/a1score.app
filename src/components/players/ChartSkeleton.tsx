import type { ValueChartProps } from "@/lib/data/playerProfile.types";

/**
 * Shared geometry for the value chart card and its skeleton. Both render the
 * same fixed-height blocks in the same order, so swapping the skeleton for the
 * lazily loaded chart never shifts layout (CLS 0).
 *
 *   readout 44 · gap 8 · plot 200|240 + x ticks 20 · [gap 8 · legend 16] · [gap 8 · chips 44]
 *
 * "wide" means the @container/profile is at least 560px.
 */
export const CHART_READOUT_H = 44;
export const CHART_PLOT_H = { narrow: 200, wide: 240 } as const;
export const CHART_TICKS_H = 20;
export const CHART_LEGEND_H = 16;
export const CHART_CHIPS_H = 44;
export const CHART_GAP = 8;
export const CHART_PAD = { narrow: 16, wide: 20 } as const;
export const CHART_WIDE_MIN = 560;

// Literal class strings so Tailwind's JIT sees them; heights mirror the constants above.
export const chartCardClass =
  "flex flex-col gap-2 bg-bg-card rounded-[var(--card-radius)] p-4 @[560px]/profile:p-5";
export const chartReadoutClass = "h-11 shrink-0";
export const chartPlotClass = "h-[220px] @[560px]/profile:h-[260px] shrink-0";
export const chartLegendClass = "h-4 shrink-0";
export const chartChipsClass = "h-11 shrink-0";

export type ChartRange = "all" | "5y" | "3y" | "1y";

/** Largest to smallest; each window is measured back from the last real point. */
export const CHART_RANGES: { id: ChartRange; years: number | null; short: string; long: string }[] = [
  { id: "all", years: null, short: "All", long: "All time" },
  { id: "5y", years: 5, short: "5Y", long: "5 years" },
  { id: "3y", years: 3, short: "3Y", long: "3 years" },
  { id: "1y", years: 1, short: "1Y", long: "1 year" },
];

/** Start of a range window: the last point's date minus N calendar years (UTC). */
export function rangeStart(lastT: number, years: number | null): number {
  if (years == null) return -Infinity;
  const d = new Date(lastT);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.getTime();
}

/** Points inside a range window (no synthetic start point is ever added). */
export function pointsInRange<T extends [number, ...unknown[]]>(points: T[], range: ChartRange): T[] {
  if (points.length === 0) return points;
  const years = CHART_RANGES.find((r) => r.id === range)?.years ?? null;
  const start = rangeStart(points[points.length - 1][0], years);
  return points.filter((p) => p[0] >= start);
}

/** With 2-3 valuations the whole history is already on screen; no chips. */
export const CHART_MIN_POINTS_FOR_RANGES = 4;

/**
 * Honest range chips: a range is offered only when its window holds at least
 * 2 points and a different count from the next larger range. Returns [] when
 * only "All" qualifies, in which case no chip row renders.
 */
export function availableRanges(points: ValueChartProps["points"]): ChartRange[] {
  if (points.length < CHART_MIN_POINTS_FOR_RANGES) return [];
  const counts = CHART_RANGES.map((r) => pointsInRange(points, r.id).length);
  const out: ChartRange[] = [];
  CHART_RANGES.forEach((r, i) => {
    if (i === 0) return;
    if (counts[i] >= 2 && counts[i] !== counts[i - 1]) out.push(r.id);
  });
  return out.length > 0 ? ["all", ...out] : [];
}

/** Markers that fall inside a [t0, t1] window. */
export function markersInWindow(markers: ValueChartProps["markers"], t0: number, t1: number): ValueChartProps["markers"] {
  return markers.filter((m) => m[0] >= t0 && m[0] <= t1);
}

export interface ChartSlots {
  /** The range chip row renders. */
  chips: boolean;
  /** The marker legend slot is reserved (its text shows only when the active range has markers). */
  legend: boolean;
}

/** Which optional rows the card reserves; derived from props alone so the skeleton can match. */
export function chartSlots(props: Pick<ValueChartProps, "points" | "markers">): ChartSlots {
  const { points, markers } = props;
  const legend =
    points.length >= 2 && markersInWindow(markers, points[0][0], points[points.length - 1][0]).length > 0;
  return { chips: availableRanges(points).length > 0, legend };
}

/** Total card height in px (border box) for a given slot set and width class. */
export function chartCardHeight(slots: ChartSlots, wide: boolean): number {
  const pad = wide ? CHART_PAD.wide : CHART_PAD.narrow;
  let h = CHART_READOUT_H + CHART_GAP + (wide ? CHART_PLOT_H.wide : CHART_PLOT_H.narrow) + CHART_TICKS_H;
  if (slots.legend) h += CHART_GAP + CHART_LEGEND_H;
  if (slots.chips) h += CHART_GAP + CHART_CHIPS_H;
  return h + pad * 2;
}

/** Placeholder with the exact box of the loaded chart. Server-safe. */
export function ChartSkeleton({ chips = true, legend = true }: Partial<ChartSlots> = {}) {
  return (
    <div aria-hidden="true" className={`${chartCardClass} motion-safe:animate-pulse`}>
      <div className={`${chartReadoutClass} flex flex-col justify-center gap-1.5`}>
        <div className="h-3 w-36 rounded bg-bg-elevated" />
        <div className="h-5 w-48 rounded bg-bg-elevated" />
      </div>
      <div className={`${chartPlotClass} rounded-lg bg-bg-elevated`} />
      {legend && (
        <div className={`${chartLegendClass} flex items-center`}>
          <div className="h-3 w-56 max-w-full rounded bg-bg-elevated" />
        </div>
      )}
      {chips && (
        <div className={`${chartChipsClass} flex items-center gap-2`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 w-14 rounded-full bg-bg-elevated" />
          ))}
        </div>
      )}
    </div>
  );
}
