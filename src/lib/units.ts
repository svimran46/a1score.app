/**
 * Measurement system for player height. Heights are stored in centimetres;
 * imperial is a display conversion only.
 */
export type MeasurementSystem = "metric" | "imperial";

export const UNITS_STORAGE_KEY = "a1score_units";
export const UNITS_CHANGE_EVENT = "a1score:units-change";

export const MEASUREMENT_OPTIONS: { value: MeasurementSystem; label: string }[] = [
  { value: "metric", label: "Metric (cm)" },
  { value: "imperial", label: "Imperial (ft, in)" },
];

export function parseMeasurementSystem(raw: string | null | undefined): MeasurementSystem {
  return raw === "imperial" ? "imperial" : "metric";
}

export function measurementLabel(system: MeasurementSystem): string {
  return MEASUREMENT_OPTIONS.find((o) => o.value === system)?.label ?? "Metric (cm)";
}

/** "183 cm" or "6 ft 0 in"; null for missing or non-positive heights. */
export function formatHeight(cm: number | null | undefined, system: MeasurementSystem): string | null {
  if (cm == null || !Number.isFinite(cm) || cm <= 0) return null;
  if (system === "metric") return `${Math.round(cm)} cm`;
  const totalInches = Math.round(cm / 2.54);
  return `${Math.floor(totalInches / 12)} ft ${totalInches % 12} in`;
}
