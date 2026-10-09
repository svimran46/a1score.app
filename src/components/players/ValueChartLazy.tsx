"use client";

import { createContext, useContext } from "react";
import dynamic from "next/dynamic";
import type { ValueChartProps } from "@/lib/data/playerProfile.types";
import { ChartSkeleton, chartSlots, type ChartSlots } from "@/components/players/ChartSkeleton";

// next/dynamic's loading component gets no props, so the slot set reaches it
// through context and the skeleton reserves exactly the rows the chart will render.
const SlotsContext = createContext<ChartSlots>({ chips: true, legend: true });

function SlotSkeleton() {
  return <ChartSkeleton {...useContext(SlotsContext)} />;
}

const MarketValueChart = dynamic(
  () => import("@/components/MarketValueChart").then((m) => m.MarketValueChart),
  { ssr: false, loading: () => <SlotSkeleton /> }
);

export function ValueChartLazy(props: ValueChartProps) {
  const slots = chartSlots(props);
  return (
    <SlotsContext.Provider value={slots}>
      <MarketValueChart {...props} />
    </SlotsContext.Provider>
  );
}
