import React from "react";
import Link from "next/link";
import type { PlayerProfileVM, ValuationPoint, ValueChartProps } from "@/lib/data/playerProfile.types";
import { toValueChartProps } from "@/lib/data/playerProfile";
import { describeDelta, formatDateGB, formatMonthYear, formatValueEur } from "@/lib/format-value";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { ValueChartLazy } from "@/components/players/ValueChartLazy";
import { chartSlots } from "@/components/players/ChartSkeleton";
import { ValueFigure } from "@/components/players/ValueFigure";
import { TrendDelta } from "@/components/players/TrendDelta";
import { NotRecorded, ProfileDisclosure, ProfileSection, focusRing } from "@/components/players/ProfileSection";

/** Text alternative for the chart; server-rendered so it exists without JS. */
export function valueSummary(vm: PlayerProfileVM, chart: ValueChartProps): string {
  const { points, peak, first, current } = vm.valuation;
  const name = vm.identity.displayName;
  const last = points[points.length - 1];
  const parts = [
    `Market value history for ${name}: ${points.length} valuations from ${formatMonthYear(points[0].date)} to ${formatDateGB(last.date)}.`,
    `Latest valuation ${formatValueEur(last.valueEur)} on ${formatDateGB(last.date)}.`,
  ];
  if (peak) {
    parts.push(`Peak ${formatValueEur(peak.valueEur)} in ${formatMonthYear(peak.date)}.`);
    if (!peak.isCurrent && current && Math.round(peak.pctBelow) > 0) {
      parts.push(`The current value is ${Math.round(peak.pctBelow)}% below the peak.`);
    }
  }
  if (first) parts.push(`First on record ${formatValueEur(first.valueEur)} in ${formatMonthYear(first.date)}.`);
  if (chart.markers.length > 0) {
    const fees = chart.markers.map(([t, fee, to]) => {
      const amount = formatValueEur(fee);
      return `${amount}${to ? ` to ${to}` : ""} (${formatMonthYear(new Date(t))})`;
    });
    parts.push(`Transfers with a disclosed fee: ${fees.join(", ")}.`);
  }
  if (chartSlots(chart).chips) {
    parts.push(`Chart ranges count back from the latest valuation on ${formatDateGB(last.date)}.`);
  }
  return parts.join(" ");
}

function KeyNumber({ label, children, note }: { label: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium leading-4 text-text-muted">{label}</dt>
      <dd className="mt-1 min-w-0">
        <div className="truncate leading-5">{children}</div>
        {note ? <div className="mt-0.5 truncate text-xs leading-4 text-text-muted">{note}</div> : null}
      </dd>
    </div>
  );
}

function FigureWithMonth({ eur, date }: { eur: number; date: string }) {
  return (
    <>
      <ValueFigure eur={eur} size="md" />
      <span className="text-xs text-text-muted">{` · ${formatMonthYear(date)}`}</span>
    </>
  );
}

function ValuationsTable({ points }: { points: ValuationPoint[] }) {
  const rows = points
    .map((p, i) => ({ p, prev: i > 0 ? points[i - 1] : null }))
    .reverse();

  return (
    <div
      role="region"
      aria-label="Market value history"
      tabIndex={0}
      className={`overflow-x-auto overscroll-x-contain rounded-md ${focusRing}`}
    >
      <table className="w-full min-w-[420px] border-collapse text-left text-sm">
        <caption className="sr-only">Market value history, newest first</caption>
        <thead>
          <tr className="border-b border-divider/60 text-xs font-medium text-text-muted">
            <th scope="col" className="py-2 pr-3 font-medium">Date</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Market value</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Change vs previous</th>
            <th scope="col" className="py-2 font-medium">Club</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ p, prev }) => {
            const diff = prev ? p.valueEur - prev.valueEur : null;
            const d =
              prev && diff != null
                ? describeDelta({
                    diffEur: diff,
                    pct: prev.valueEur > 0 ? (diff / prev.valueEur) * 100 : null,
                    basisDate: prev.date,
                  })
                : null;
            return (
              <tr key={p.date} className="border-b border-divider/60 last:border-b-0">
                <th scope="row" className="whitespace-nowrap py-2 pr-3 font-normal tabular-nums text-text-secondary">
                  {formatDateGB(p.date)}
                </th>
                <td className="whitespace-nowrap py-2 pr-3 text-right">
                  <ValueFigure eur={p.valueEur} size="sm" />
                </td>
                <td className="whitespace-nowrap py-2 pr-3 text-right">
                  {!d ? (
                    <span className="text-xs text-text-muted">First on record</span>
                  ) : d.direction === "flat" ? (
                    <span className="text-text-secondary">
                      <span aria-hidden="true">Unchanged</span>
                      <span className="sr-only">{d.spoken}</span>
                    </span>
                  ) : (
                    <>
                      <span
                        aria-hidden="true"
                        className={`figure font-bold ${d.direction === "up" ? "text-trend-up" : "text-trend-down"}`}
                      >
                        {`${d.arrow} ${d.amount}${d.pct ? ` ${d.pct}` : ""}`}
                      </span>
                      <span className="sr-only">{d.spoken}</span>
                    </>
                  )}
                </td>
                <td className="max-w-[12rem] truncate py-2 text-text-secondary">
                  {p.clubName ?? <NotRecorded />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Value (#value): key numbers, the lazily loaded chart and the full
 * valuations table. Everything but the chart is server-rendered.
 */
export function ValueSection({ vm }: { vm: PlayerProfileVM }) {
  const { points, current, sincePrevious, twelveMonth, peak, first } = vm.valuation;
  if (points.length === 0) return null;

  const chart = toValueChartProps(vm);
  const single = points.length === 1 ? points[0] : null;
  const showUndatedNote = !!chart && !!current && current.asOf == null;
  const currentLabel = formatValueEur(current?.valueEur);

  const compare = (
    <Link
      href={`/compare?players=${encodeURIComponent(vm.identity.slug)}`}
      className={`-mr-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm text-text-secondary hover:text-text-primary ${focusRing}`}
    >
      Compare<span aria-hidden="true">{" ›"}</span>
      <span className="sr-only">{` ${vm.identity.displayName} with other players`}</span>
    </Link>
  );

  const cells: React.ReactNode[] = [];
  if (!single && sincePrevious) {
    cells.push(
      <KeyNumber key="prev" label="Since previous" note={`vs ${formatDateGB(sincePrevious.basisDate)}`}>
        <TrendDelta delta={sincePrevious} size="md" basis="none" />
      </KeyNumber>
    );
  }
  if (!single && twelveMonth) {
    cells.push(
      <KeyNumber key="12m" label="12 months" note={`vs ${formatDateGB(twelveMonth.basisDate)}`}>
        <TrendDelta delta={twelveMonth} size="md" basis="none" />
      </KeyNumber>
    );
  }
  if (!single && peak) {
    const below = Math.round(peak.pctBelow);
    const note = peak.isCurrent
      ? current?.asOf
        ? "Current value is the highest on record"
        : undefined
      : below > 0
        ? `${below}% below peak`
        : "Less than 1% below peak";
    cells.push(
      <KeyNumber key="peak" label="Peak" note={note}>
        <FigureWithMonth eur={peak.valueEur} date={peak.date} />
      </KeyNumber>
    );
  }
  if (first) {
    cells.push(
      <KeyNumber key="first" label="First on record" note={first.ageAtDate != null ? `age ${first.ageAtDate}` : undefined}>
        <FigureWithMonth eur={first.valueEur} date={first.date} />
      </KeyNumber>
    );
  }

  return (
    <ProfileSection id="value" navLabel="Value" divider={false} meta={compare}>
      {single ? (
        <p className="mb-3 text-sm text-text-secondary">
          {"One valuation on record: "}
          <ValueFigure eur={single.valueEur} size="sm" />
          {` on ${formatDateGB(single.date)}.`}
        </p>
      ) : null}

      {cells.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 @[560px]/profile:grid-cols-4">{cells}</dl>
      ) : null}

      {chart ? (
        <>
          <p className="sr-only">{valueSummary(vm, chart)}</p>
          <div className="mt-4">
            <SectionErrorBoundary sectionName="value chart" fallbackMessage="Couldn't load the chart right now.">
              <ValueChartLazy {...chart} />
            </SectionErrorBoundary>
          </div>
        </>
      ) : null}

      {showUndatedNote && currentLabel ? (
        <p className="mt-2 text-xs leading-4 text-text-muted">
          {`The current value of ${currentLabel} has no recorded valuation date, so it isn't plotted.`}
        </p>
      ) : null}

      {points.length >= 2 ? (
        <ProfileDisclosure id="valuations" summary={`All ${points.length} valuations`} className="mt-3">
          <ValuationsTable points={points} />
        </ProfileDisclosure>
      ) : null}
    </ProfileSection>
  );
}
