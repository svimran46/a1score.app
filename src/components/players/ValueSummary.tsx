"use client";

import React from "react";

import type { ValueChartProps } from "@/lib/data/playerProfile.types";
import { useMoney } from "@/lib/useMoney";
import { valueSummary } from "@/components/players/valueSummaryText";

/** The chart's text alternative in the visitor's display currency. */
export function ValueSummary({ vm, chart }: { vm: Parameters<typeof valueSummary>[0]; chart: ValueChartProps }) {
  const money = useMoney();
  return <>{valueSummary(vm, chart, money.ctx)}</>;
}
