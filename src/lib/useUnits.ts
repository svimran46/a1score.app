"use client";

import { useSyncExternalStore } from "react";
import { UNITS_CHANGE_EVENT, UNITS_STORAGE_KEY, parseMeasurementSystem, type MeasurementSystem } from "./units";

function subscribe(listener: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === UNITS_STORAGE_KEY) listener();
  };
  window.addEventListener(UNITS_CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(UNITS_CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

function read(): MeasurementSystem {
  try {
    return parseMeasurementSystem(window.localStorage.getItem(UNITS_STORAGE_KEY));
  } catch {
    return "metric";
  }
}

/** The visitor's measurement system; metric during server render and hydration. */
export function useMeasurementSystem(): MeasurementSystem {
  return useSyncExternalStore(subscribe, read, () => "metric");
}

export function setMeasurementSystem(system: MeasurementSystem): void {
  try {
    window.localStorage.setItem(UNITS_STORAGE_KEY, system);
  } catch {
    // Private mode: not persisted.
  }
  window.dispatchEvent(new Event(UNITS_CHANGE_EVENT));
}
