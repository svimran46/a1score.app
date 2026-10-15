/**
 * Display currency.
 *
 * Every value a1score stores is in euros (Transfermarkt valuations, fees).
 * Pages are rendered and cached in euros; in the browser, figures are
 * converted to the visitor's chosen currency with the latest ECB reference
 * rate. Without a rate we keep showing euros rather than guess.
 */

export type CurrencyCode = "EUR" | "GBP" | "USD";

export interface MoneyContext {
  code: CurrencyCode;
  symbol: string;
  /** Units of `code` per 1 EUR. */
  rate: number;
}

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string; spoken: string }[] = [
  { code: "EUR", symbol: "€", label: "Euro (EUR)", spoken: "euros" },
  { code: "GBP", symbol: "£", label: "British Pound (GBP)", spoken: "pounds" },
  { code: "USD", symbol: "$", label: "US Dollar (USD)", spoken: "dollars" },
];

export const EUR_CONTEXT: MoneyContext = { code: "EUR", symbol: "€", rate: 1 };

export const CURRENCY_STORAGE_KEY = "a1score_currency";
export const RATES_STORAGE_KEY = "a1score_fx_v1";
export const CURRENCY_CHANGE_EVENT = "a1score:currency-change";

export interface FxRates {
  /** ECB reference date (YYYY-MM-DD) the rates apply to. */
  date: string;
  rates: Partial<Record<CurrencyCode, number>>;
}

export function parseCurrency(raw: string | null | undefined): CurrencyCode {
  return raw === "GBP" || raw === "USD" || raw === "EUR" ? raw : "EUR";
}

export function currencyMeta(code: CurrencyCode) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** The context to format with: falls back to euros when no usable rate exists. */
export function moneyContext(code: CurrencyCode, fx: FxRates | null): MoneyContext {
  if (code === "EUR") return EUR_CONTEXT;
  const rate = fx?.rates[code];
  if (!rate || !Number.isFinite(rate) || rate <= 0) return EUR_CONTEXT;
  return { code, symbol: currencyMeta(code).symbol, rate };
}

/**
 * Parses the ECB daily reference XML
 * (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml).
 * Returns null unless it finds a date and both GBP and USD rates.
 */
export function parseEcbDailyXml(xml: string): FxRates | null {
  const date = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
  const rateFor = (code: string) => {
    const m = xml.match(new RegExp(`currency=['"]${code}['"]\\s+rate=['"]([0-9.]+)['"]`));
    const n = m ? Number(m[1]) : NaN;
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const GBP = rateFor("GBP");
  const USD = rateFor("USD");
  if (!date || !GBP || !USD) return null;
  return { date, rates: { EUR: 1, GBP, USD } };
}

export function isFxRates(v: unknown): v is FxRates {
  if (!v || typeof v !== "object") return false;
  const o = v as FxRates;
  return typeof o.date === "string" && !!o.rates && typeof o.rates === "object";
}
