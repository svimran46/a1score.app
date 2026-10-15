"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { moneyContext, type CurrencyCode, type FxRates } from "./currency";
import { ensureRates, getCurrency, getRates, getRatesStatus, subscribeCurrency, type RatesStatus } from "./currency-store";
import { bindMoney, type BoundMoney } from "./money";

const serverCurrency = (): CurrencyCode => "EUR";
const serverRates = (): FxRates | null => null;

/**
 * Money formatters in the visitor's display currency.
 * Server render and hydration use euros (matching the cached HTML); React
 * then re-renders with the stored currency before the browser paints.
 */
export function useMoney(): BoundMoney {
  const code = useSyncExternalStore(subscribeCurrency, getCurrency, serverCurrency);
  const fx = useSyncExternalStore(subscribeCurrency, getRates, serverRates);

  useEffect(() => {
    if (code !== "EUR") void ensureRates();
  }, [code]);

  return useMemo(() => bindMoney(moneyContext(code, fx)), [code, fx]);
}

/** The stored display currency, the rates and their load status, for Settings. */
export function useCurrencySetting(): { code: CurrencyCode; fx: FxRates | null; status: RatesStatus } {
  const code = useSyncExternalStore(subscribeCurrency, getCurrency, serverCurrency);
  const fx = useSyncExternalStore(subscribeCurrency, getRates, serverRates);
  const status = useSyncExternalStore(subscribeCurrency, getRatesStatus, () => "idle" as RatesStatus);
  return { code, fx, status };
}
