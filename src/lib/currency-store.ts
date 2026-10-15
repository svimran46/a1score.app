/**
 * Browser-side state for the display currency: the visitor's choice and the
 * cached ECB rates. Framework-free so it can back useSyncExternalStore.
 */
import {
  CURRENCY_CHANGE_EVENT,
  CURRENCY_STORAGE_KEY,
  RATES_STORAGE_KEY,
  isFxRates,
  parseCurrency,
  type CurrencyCode,
  type FxRates,
} from "./currency";

const RATES_MAX_AGE_MS = 12 * 60 * 60 * 1000;

let currency: CurrencyCode | null = null;
let rates: FxRates | null = null;
let ratesFetchedAt = 0;
let ratesLoaded = false;
let inflight: Promise<void> | null = null;
let ratesFailed = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function readCurrency(): CurrencyCode {
  try {
    return parseCurrency(window.localStorage.getItem(CURRENCY_STORAGE_KEY));
  } catch {
    return "EUR";
  }
}

function loadCachedRates() {
  if (ratesLoaded) return;
  ratesLoaded = true;
  try {
    const raw = window.localStorage.getItem(RATES_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (isFxRates(parsed.fx) && typeof parsed.fetchedAt === "number") {
      rates = parsed.fx;
      ratesFetchedAt = parsed.fetchedAt;
    }
  } catch {
    // Corrupt cache: refetch.
  }
}

export function subscribeCurrency(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function onStorage(e: StorageEvent) {
  if (e.key === CURRENCY_STORAGE_KEY) {
    currency = readCurrency();
    notify();
  }
}

export function getCurrency(): CurrencyCode {
  if (currency === null) currency = readCurrency();
  return currency;
}

export function getRates(): FxRates | null {
  loadCachedRates();
  return rates;
}

export type RatesStatus = "idle" | "loading" | "ready" | "failed";

/** Snapshot for UI that explains the conversion (e.g. Settings). */
export function getRatesStatus(): RatesStatus {
  loadCachedRates();
  if (rates) return "ready";
  if (inflight) return "loading";
  return ratesFailed ? "failed" : "idle";
}

export function setCurrency(code: CurrencyCode): void {
  currency = code;
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
  } catch {
    // Private mode: applies for this page view only.
  }
  window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: code }));
  notify();
  if (code !== "EUR") void ensureRates();
}

/** Loads rates once per 12 hours (shared across tabs via localStorage). */
export function ensureRates(): Promise<void> {
  loadCachedRates();
  if (rates && Date.now() - ratesFetchedAt < RATES_MAX_AGE_MS) return Promise.resolve();
  if (inflight) return inflight;
  const request = fetch("/api/fx")
    .then(async (res) => {
      const body = await res.json();
      if (!res.ok || !isFxRates(body)) throw new Error("rates unavailable");
      rates = { date: body.date, rates: body.rates };
      ratesFetchedAt = Date.now();
      ratesFailed = false;
      try {
        window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify({ fx: rates, fetchedAt: ratesFetchedAt }));
      } catch {
        // Not cached; we'll fetch again next visit.
      }
    })
    .catch(() => {
      // Keep any older cached rates; otherwise figures stay in euros.
      ratesFailed = true;
    })
    .finally(() => {
      inflight = null;
      notify();
    });
  inflight = request;
  notify();
  return request;
}
