"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueChartProps } from "@/lib/data/playerProfile.types";
import {
  describeDelta,
  formatAxisEur,
  formatDateGB,
  formatDateLong,
  formatValueEur,
  spokenEur,
} from "@/lib/format-value";
import {
  CHART_RANGES,
  CHART_TICKS_H,
  CHART_WIDE_MIN,
  availableRanges,
  chartCardClass,
  chartChipsClass,
  chartLegendClass,
  chartPlotClass,
  chartReadoutClass,
  chartSlots,
  markersInWindow,
  pointsInRange,
  type ChartRange,
} from "@/components/players/ChartSkeleton";

/* ------------------------------------------------------------------ scales */

const NICE = [1, 2, 2.5, 5];
const DAY = 86_400_000;
const MIN_TICK_GAP = 44;
const MARGIN = { top: 16, right: 8, bottom: 0, left: 8 };
// The default tooltip (latest point) is always "active" so keyboard navigation starts there;
// its cursor and active dot only show while the plot is hovered, touched or focused.
const PLOT_HOVER_ONLY =
  "[&_.recharts-active-dot]:opacity-0 [&_.recharts-tooltip-cursor]:opacity-0 [&:focus-within_.recharts-active-dot]:opacity-100 [&:focus-within_.recharts-tooltip-cursor]:opacity-100 [&:hover_.recharts-active-dot]:opacity-100 [&:hover_.recharts-tooltip-cursor]:opacity-100";
const TOOLTIP_CURSOR = { stroke: "var(--text-muted)", strokeWidth: 1 };

function niceAtMost(x: number): number {
  const base = 10 ** Math.floor(Math.log10(x));
  for (const s of [...NICE].reverse()) if (s * base <= x * (1 + 1e-9)) return s * base;
  return base;
}

/**
 * Y axis: domain [0, top] where top is max × 1.08 rounded up to a {1, 2, 2.5, 5}×10^k
 * unit no larger than an eighth of it (so top ≤ ~1.22 × max), and up to
 * `tickCount` evenly spaced ticks on the coarsest nice step that fits.
 */
export function valueAxis(maxValue: number, tickCount: number): { top: number; ticks: number[] } {
  if (!(maxValue > 0)) return { top: 1, ticks: [0] };
  const target = maxValue * 1.08;
  const unit = niceAtMost(target / 8);
  const top = Math.ceil(target / unit - 1e-9) * unit;
  const k0 = Math.floor(Math.log10(top / tickCount)) - 1;
  let step = top;
  outer: for (let k = k0; k <= k0 + 3; k++) {
    for (const s of NICE) {
      const candidate = s * 10 ** k;
      if (Math.floor(top / candidate + 1e-9) + 1 <= tickCount) {
        step = candidate;
        break outer;
      }
    }
  }
  const ticks: number[] = [];
  for (let i = 0; i * step <= top * (1 + 1e-9); i++) ticks.push(Math.round(i * step));
  return { top, ticks };
}

/**
 * X axis ticks on 1 January of each year (quarters for short spans), thinned so
 * labels sit at least 44px apart, and kept clear of the plot edges.
 */
export function timeTicks(
  t0: number,
  t1: number,
  plotPx: number,
  quarters: boolean
): { ticks: number[]; unit: "year" | "quarter" } {
  if (!(t1 > t0) || plotPx <= 0) return { ticks: [], unit: quarters ? "quarter" : "year" };
  const pxPerMs = plotPx / (t1 - t0);
  const y0 = new Date(t0).getUTCFullYear();
  const y1 = new Date(t1).getUTCFullYear();
  const edge = 14;
  const keep = (t: number) => {
    const x = (t - t0) * pxPerMs;
    return x >= edge && x <= plotPx - edge;
  };

  if (!quarters) {
    const stride = Math.max(1, Math.ceil(MIN_TICK_GAP / (365.25 * DAY * pxPerMs)));
    const ticks: number[] = [];
    for (let y = y0; y <= y1 + 1; y++) {
      const t = Date.UTC(y, 0, 1);
      if (t >= t0 && t <= t1 && y % stride === 0 && keep(t)) ticks.push(t);
    }
    if (ticks.length >= 2) return { ticks, unit: "year" };
  }

  const stride = Math.max(1, Math.ceil(MIN_TICK_GAP / (91.3 * DAY * pxPerMs)));
  const ticks: number[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let q = 0; q < 4; q++) {
      const t = Date.UTC(y, q * 3, 1);
      if (t >= t0 && t <= t1 && (y * 4 + q) % stride === 0 && keep(t)) ticks.push(t);
    }
  }
  return { ticks, unit: "quarter" };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function tickLabel(t: number, unit: "year" | "quarter", wide: boolean): string {
  const d = new Date(t);
  const month = d.getUTCMonth();
  if (unit === "quarter" && month !== 0) return MONTHS[month];
  const y = d.getUTCFullYear();
  return wide ? String(y) : `'${String(y).slice(-2)}`;
}

/* ---------------------------------------------------------------- readout */

/** i: index within the range; g: index within all points. */
type Datum = { t: number; v: number; c: number; i: number; g: number };

/** Tooltip content that renders nothing and reports the active index to the readout. */
function ReadoutSync({
  active,
  payload,
  onIndex,
}: {
  active?: boolean;
  payload?: { payload?: Datum }[];
  onIndex: (i: number | null) => void;
}) {
  const index = active && payload && payload.length > 0 ? payload[0].payload?.i ?? null : null;
  useEffect(() => {
    onIndex(index);
  }, [index, onIndex]);
  return null;
}

/** Change vs the previous real point (which may sit before the range window). */
function deltaVsPrevious(cur: Datum, prev: [number, number, number] | undefined) {
  if (!prev) return null;
  const diffEur = cur.v - prev[1];
  return describeDelta({
    diffEur,
    pct: prev[1] > 0 ? (diffEur / prev[1]) * 100 : null,
    basisDate: new Date(prev[0]).toISOString(),
  });
}

/* ------------------------------------------------------------- annotations */

function shortName(name: string): string {
  return name.length > 16 ? `${name.slice(0, 15).trimEnd()}…` : name;
}

type Anchor = "start" | "middle" | "end";
type Box = { x0: number; x1: number; y0: number; y1: number };

/** Rough advance width of 12px Archivo; only used to keep labels apart. */
const textWidth = (s: string) => s.length * 6.8;
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const textBox = (x: number, baseline: number, w: number, anchor: Anchor): Box => {
  const x0 = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return { x0, x1: x0 + w, y0: baseline - 11, y1: baseline + 3 };
};

export interface AnnotationLayout {
  /** Peak label offset from the dot centre. */
  peak: { dx: number; dy: number; anchor: Anchor };
  /** Y tick values whose labels would collide with the peak label. */
  hiddenTicks: Set<number>;
  /** Marker label placement keyed by marker timestamp; absent means no label. */
  markers: Map<number, { dx: number; y: number; anchor: Anchor }>;
}

/**
 * Places the peak label away from the plot edges, hides any Y tick label it
 * would cover, then gives each fee label the first of three rows at the top of
 * the plot (either side of its line) that collides with nothing already placed,
 * or drops it. Markers are placed in the order given: pass the largest fee first.
 */
export function layoutAnnotations(g: {
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  peak: { x: number; y: number; label: string };
  ticks: { y: number; label: string; value: number }[];
  markers: { t: number; x: number; label: string }[];
}): AnnotationLayout {
  const { plotLeft, plotRight, plotTop, peak } = g;
  const pw = textWidth(peak.label);
  const anchor: Anchor =
    peak.x - plotLeft < pw / 2 + 4 ? "start" : plotRight - peak.x < pw / 2 + 4 ? "end" : "middle";
  const dx = anchor === "start" ? -4 : anchor === "end" ? 4 : 0;
  const dy = peak.y - plotTop < 22 ? 18 : -10;
  const peakBox = textBox(peak.x + dx, peak.y + dy, pw, anchor);
  const dotBox: Box = { x0: peak.x - 6, x1: peak.x + 6, y0: peak.y - 6, y1: peak.y + 6 };

  const hiddenTicks = new Set<number>();
  const obstacles: Box[] = [peakBox, dotBox];
  for (const t of g.ticks) {
    const box = textBox(plotRight, t.y - 4, textWidth(t.label), "end");
    if (overlaps(box, peakBox)) hiddenTicks.add(t.value);
    else obstacles.push(box);
  }

  const markers = new Map<number, { dx: number; y: number; anchor: Anchor }>();
  for (const m of g.markers) {
    const w = textWidth(m.label);
    const sides: Anchor[] = plotRight - m.x < w + 8 ? ["end", "start"] : ["start", "end"];
    place: for (let row = 0; row < 3; row++) {
      const y = plotTop + 12 + row * 14;
      for (const a of sides) {
        const mdx = a === "end" ? -4 : 4;
        const box = textBox(m.x + mdx, y, w, a);
        if (box.x0 < plotLeft || box.x1 > plotRight) continue;
        if (!obstacles.some((o) => overlaps(o, box))) {
          obstacles.push(box);
          markers.set(m.t, { dx: mdx, y, anchor: a });
          break place;
        }
      }
    }
  }
  return { peak: { dx, dy, anchor }, hiddenTicks, markers };
}

function PeakShape({
  cx,
  cy,
  label,
  place,
}: {
  cx?: number;
  cy?: number;
  label: string;
  place: AnnotationLayout["peak"];
}) {
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill="var(--value-text)" stroke="var(--bg-card)" strokeWidth={2} />
      <text
        x={cx + place.dx}
        y={cy + place.dy}
        textAnchor={place.anchor}
        fontSize={12}
        fill="var(--text-secondary)"
        stroke="var(--bg-card)"
        strokeWidth={3}
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  );
}

function MarkerLabel({
  viewBox,
  name,
  fee,
  place,
}: {
  viewBox?: { x: number; y: number };
  name: string | null;
  fee: string;
  place: { dx: number; y: number; anchor: Anchor };
}) {
  if (!viewBox) return null;
  return (
    <text
      x={viewBox.x + place.dx}
      y={place.y}
      textAnchor={place.anchor}
      fontSize={12}
      fill="var(--text-secondary)"
      stroke="var(--bg-card)"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {name ? `→ ${shortName(name)} ` : ""}
      <tspan className="figure" fontWeight={700}>
        {fee}
      </tspan>
    </text>
  );
}

function YTick({
  x,
  y,
  payload,
  hidden,
}: {
  x?: number;
  y?: number;
  payload?: { value: number };
  hidden?: Set<number>;
}) {
  if (x == null || y == null || !payload || hidden?.has(payload.value)) return null;
  return (
    <text
      x={x}
      y={y - 4}
      textAnchor="end"
      fontSize={12}
      fill="var(--text-muted)"
      stroke="var(--bg-card)"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {formatAxisEur(payload.value)}
    </text>
  );
}

/* ------------------------------------------------------------------- chart */

export function MarketValueChart({ points, clubs, markers, playerName, ended }: ValueChartProps) {
  const figureRef = useRef<HTMLElement>(null);
  const [wide, setWide] = useState(false);
  const [plotSize, setPlotSize] = useState({ w: 0, h: 0 });
  const [range, setRange] = useState<ChartRange>("all");
  const [active, setActive] = useState<number | null>(null);
  const [keyboard, setKeyboard] = useState(false);
  const [spoken, setSpoken] = useState("");
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = figureRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.borderBoxSize?.[0]?.inlineSize ?? el.offsetWidth;
      setWide(w >= CHART_WIDE_MIN);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ranges = useMemo(() => availableRanges(points), [points]);
  const slots = useMemo(() => chartSlots({ points, markers }), [points, markers]);
  const effectiveRange: ChartRange = ranges.includes(range) ? range : "all";

  const data = useMemo<Datum[]>(() => {
    const inRange = pointsInRange(points, effectiveRange);
    const offset = points.length - inRange.length;
    return inRange.map(([t, v, c], i) => ({ t, v, c, i, g: offset + i }));
  }, [points, effectiveRange]);

  const model = useMemo(() => {
    if (data.length < 2) return null;
    const t0 = data[0].t;
    const t1 = data[data.length - 1].t;
    let peak = data[0];
    for (const d of data) if (d.v > peak.v) peak = d;
    const allTimeMax = Math.max(...points.map((p) => p[1]));
    const inRange = markersInWindow(markers, t0, t1);
    // Largest fees first: they get the first pick of label positions.
    const labelled = [...inRange].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { t0, t1, peak, allTimeMax, inRange, labelled };
  }, [data, points, markers]);

  // Stable element: Recharts re-shows the default tooltip whenever the Tooltip's props change.
  const readoutSync = useMemo(() => <ReadoutSync onIndex={setActive} />, []);

  // Reset the readout to the latest point whenever the range changes.
  useEffect(() => setActive(null), [effectiveRange]);

  const latest = data[data.length - 1];
  const shownIndex = active != null && data[active] ? active : data.length - 1;
  const shown = data[shownIndex];
  const delta = shown ? deltaVsPrevious(shown, points[shown.g - 1]) : null;
  const isOverallLast = shown != null && shown.g === points.length - 1;
  const clubOf = (d: Datum) => (d.c >= 0 && d.c < clubs.length ? clubs[d.c] || null : null);
  const shownClub = shown ? clubOf(shown) : null;

  const sentence = shown
    ? `${formatDateLong(new Date(shown.t))}${shownClub ? `, ${shownClub}` : ""}: ${spokenEur(shown.v)}. ${
        delta ? `${delta.spoken}.` : "First valuation on record."
      }`
    : "";

  // Announce the readout only after keyboard use, debounced so arrowing is not chatty.
  useEffect(() => {
    if (!keyboard) return;
    const id = window.setTimeout(() => setSpoken(sentence), 300);
    return () => window.clearTimeout(id);
  }, [keyboard, sentence]);

  if (!model || !shown || !latest) return null;

  const plotLeft = MARGIN.left;
  const plotRight = plotSize.w - MARGIN.right;
  const innerWidth = Math.max(0, plotRight - plotLeft);
  const { top, ticks: yTicks } = valueAxis(model.peak.v, wide ? 4 : 3);
  const { ticks: xTicks, unit } = timeTicks(model.t0, model.t1, innerWidth, effectiveRange === "1y");
  const peakLabel =
    effectiveRange !== "all" && model.peak.v < model.allTimeMax
      ? `Peak in range ${formatValueEur(model.peak.v) ?? ""}`
      : `Peak ${formatValueEur(model.peak.v) ?? ""}`;

  const plotTop = MARGIN.top;
  const plotBottom = plotSize.h - CHART_TICKS_H - MARGIN.bottom;
  const xOf = (t: number) => plotLeft + ((t - model.t0) / (model.t1 - model.t0)) * innerWidth;
  const yOf = (v: number) => plotTop + (1 - v / top) * (plotBottom - plotTop);
  const markerText = (m: [number, number, string | null]) =>
    `${m[2] ? `→ ${shortName(m[2])} ` : ""}${formatValueEur(m[1]) ?? ""}`;
  const layout = layoutAnnotations({
    plotLeft,
    plotRight,
    plotTop,
    peak: { x: xOf(model.peak.t), y: yOf(model.peak.v), label: peakLabel },
    ticks: yTicks.map((v) => ({ value: v, y: yOf(v), label: formatAxisEur(v) })),
    markers: wide && innerWidth > 0 ? model.labelled.map((m) => ({ t: m[0], x: xOf(m[0]), label: markerText(m) })) : [],
  });

  const onChipKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const n = ranges.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    setKeyboard(true);
    setRange(ranges[next]);
    chipRefs.current[next]?.focus();
  };

  const onPlotKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!keyboard && e.key.startsWith("Arrow")) setKeyboard(true);
  };

  return (
    <figure ref={figureRef} aria-label={`Market value chart for ${playerName}`} className={chartCardClass}>
      <div className={`${chartReadoutClass} flex min-w-0 flex-col justify-center`} aria-hidden="true">
        <p className="truncate text-xs leading-4 text-text-muted">
          {ended && isOverallLast ? "Last valuation " : ""}
          {formatDateGB(new Date(shown.t))}
          {shownClub ? ` · ${shownClub}` : ""}
        </p>
        <p className="flex min-w-0 items-baseline gap-2 whitespace-nowrap leading-6">
          <span className="figure text-[18px] font-extrabold text-value-text">{formatValueEur(shown.v)}</span>
          {delta ? (
            delta.direction === "flat" ? (
              <span className="truncate text-[13px] text-text-secondary">
                Unchanged <span className="text-text-muted">vs previous</span>
              </span>
            ) : (
              <span className="truncate text-[13px]">
                <span className={`figure font-bold ${delta.direction === "up" ? "text-trend-up" : "text-trend-down"}`}>
                  {delta.arrow} {delta.amount}
                  {delta.pct ? ` (${delta.pct})` : ""}
                </span>{" "}
                <span className="text-text-muted">vs previous</span>
              </span>
            )
          ) : (
            <span className="truncate text-[13px] text-text-muted">First valuation on record</span>
          )}
        </p>
      </div>
      {keyboard && (
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {spoken}
        </p>
      )}

      <div
        className={`${chartPlotClass} touch-pan-y ${PLOT_HOVER_ONLY}`}
        onKeyDown={onPlotKey}
        onBlur={() => setActive(null)}
      >
        <ResponsiveContainer width="100%" height="100%" onResize={(w, h) => setPlotSize({ w, h })}>
          <AreaChart
            data={data}
            margin={MARGIN}
            accessibilityLayer
            title="Market value over time. Use the left and right arrow keys to step through valuations."
            onMouseLeave={() => setActive(null)}
          >
            <CartesianGrid vertical={false} stroke="var(--divider)" strokeDasharray="2 3" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={[model.t0, model.t1]}
              ticks={xTicks}
              interval={0}
              tickFormatter={(t: number) => tickLabel(t, unit, wide)}
              height={20}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              allowDataOverflow
            />
            <YAxis
              type="number"
              orientation="right"
              mirror
              domain={[0, top]}
              ticks={yTicks}
              interval={0}
              allowDataOverflow
              tickLine={false}
              axisLine={false}
              tickMargin={0}
              tick={<YTick hidden={layout.hiddenTicks} />}
            />
            {model.inRange.map((m) => {
              const place = layout.markers.get(m[0]);
              const fee = formatValueEur(m[1]);
              return (
                <ReferenceLine
                  key={`m-${m[0]}-${m[1]}`}
                  x={m[0]}
                  stroke="var(--text-muted)"
                  strokeDasharray="2 3"
                  strokeOpacity={0.6}
                  label={
                    place && fee
                      ? ((<MarkerLabel name={m[2]} fee={fee} place={place} />) as ReactElement)
                      : undefined
                  }
                />
              );
            })}
            {/* defaultIndex starts keyboard navigation at the latest point, matching the readout. */}
            <Tooltip
              cursor={TOOLTIP_CURSOR}
              content={readoutSync}
              defaultIndex={data.length - 1}
              isAnimationActive={false}
            />
            <Area
              type="stepAfter"
              dataKey="v"
              stroke="var(--value-text)"
              strokeWidth={2}
              fill="var(--value-text)"
              fillOpacity={0.08}
              dot={false}
              activeDot={{ r: 4, fill: "var(--value-text)", stroke: "var(--bg-card)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {latest !== model.peak && (
              <ReferenceDot
                x={latest.t}
                y={latest.v}
                r={4}
                fill="var(--bg-card)"
                stroke="var(--value-text)"
                strokeWidth={2}
                ifOverflow="visible"
              />
            )}
            <ReferenceDot
              x={model.peak.t}
              y={model.peak.v}
              ifOverflow="visible"
              shape={(p: { cx?: number; cy?: number }) => (
                <PeakShape cx={p.cx} cy={p.cy} label={peakLabel} place={layout.peak} />
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {slots.legend && (
        <div className={`${chartLegendClass} flex items-center gap-2 text-xs leading-4 text-text-muted`}>
          {model.inRange.length > 0 && (
            <>
              <svg width="16" height="12" aria-hidden="true" className="shrink-0">
                <line x1="8" y1="0" x2="8" y2="12" stroke="var(--text-muted)" strokeDasharray="2 3" />
              </svg>
              <span className="truncate">Dashed lines: transfers with a disclosed fee</span>
            </>
          )}
        </div>
      )}

      {ranges.length > 0 && (
        <div role="radiogroup" aria-label="Chart range" className={`${chartChipsClass} flex items-center gap-2`}>
          {ranges.map((id, idx) => {
            const meta = CHART_RANGES.find((r) => r.id === id)!;
            const checked = id === effectiveRange;
            return (
              <button
                key={id}
                ref={(el) => {
                  chipRefs.current[idx] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                onClick={() => setRange(id)}
                onKeyDown={(e) => onChipKey(e, idx)}
                className={`inline-flex h-11 min-w-11 cursor-pointer select-none items-center justify-center rounded-full px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] ${
                  checked ? "bg-accent text-accent-contrast" : "bg-bg-chip text-text-primary hover:bg-bg-hover"
                }`}
              >
                <span aria-hidden="true">{meta.short}</span>
                <span className="sr-only">{meta.long}</span>
              </button>
            );
          })}
        </div>
      )}
    </figure>
  );
}
