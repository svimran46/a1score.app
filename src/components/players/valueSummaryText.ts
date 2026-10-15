import type { PlayerProfileVM, ValueChartProps } from "@/lib/data/playerProfile.types";
import { formatDateGB, formatMonthYear, formatValueEur } from "@/lib/format-value";
import { EUR_CONTEXT, type MoneyContext } from "@/lib/currency";
import { chartSlots } from "@/components/players/ChartSkeleton";

/**
 * Text alternative for the chart. Server-rendered in euros so it exists
 * without JS; ValueSummary re-renders it in the display currency.
 */
export function valueSummary(
  vm: Pick<PlayerProfileVM, "valuation"> & { identity: Pick<PlayerProfileVM["identity"], "displayName"> },
  chart: ValueChartProps,
  ctx: MoneyContext = EUR_CONTEXT
): string {
  const { points, peak, first, current } = vm.valuation;
  const name = vm.identity.displayName;
  const last = points[points.length - 1];
  const parts = [
    `Market value history for ${name}: ${points.length} valuations from ${formatMonthYear(points[0].date)} to ${formatDateGB(last.date)}.`,
    `Latest valuation ${formatValueEur(last.valueEur, ctx)} on ${formatDateGB(last.date)}.`,
  ];
  if (peak) {
    parts.push(`Peak ${formatValueEur(peak.valueEur, ctx)} in ${formatMonthYear(peak.date)}.`);
    if (!peak.isCurrent && current && Math.round(peak.pctBelow) > 0) {
      parts.push(`The current value is ${Math.round(peak.pctBelow)}% below the peak.`);
    }
  }
  if (first) parts.push(`First on record ${formatValueEur(first.valueEur, ctx)} in ${formatMonthYear(first.date)}.`);
  if (chart.markers.length > 0) {
    const fees = chart.markers.map(([t, fee, to]) => {
      const amount = formatValueEur(fee, ctx);
      return `${amount}${to ? ` to ${to}` : ""} (${formatMonthYear(new Date(t))})`;
    });
    parts.push(`Transfers with a disclosed fee: ${fees.join(", ")}.`);
  }
  if (chartSlots(chart).chips) {
    parts.push(`Chart ranges count back from the latest valuation on ${formatDateGB(last.date)}.`);
  }
  return parts.join(" ");
}
