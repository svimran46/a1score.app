"use client";

import React from "react";

import { formatHeight } from "@/lib/units";
import { useMeasurementSystem } from "@/lib/useUnits";

/** A player's height in the visitor's measurement system. */
export function Height({ cm }: { cm: number }) {
  return <>{formatHeight(cm, useMeasurementSystem())}</>;
}
