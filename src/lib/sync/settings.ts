/** Pure helpers for syncing settings between this device and public.user_settings. */
import { parseThemePreference, type ThemePreference } from "@/lib/theme";
import { parseCurrency, type CurrencyCode } from "@/lib/currency";
import { parseMeasurementSystem, type MeasurementSystem } from "@/lib/units";
import { isTvCountry } from "@/lib/tv/countries";

export interface SyncedSettings {
  theme: ThemePreference | null;
  currency: CurrencyCode | null;
  units: MeasurementSystem | null;
  tv_country: string | null;
}

export const SETTING_KEYS: (keyof SyncedSettings)[] = ["theme", "currency", "units", "tv_country"];

/** Drops anything the database would reject, so a stray value can't fail the upsert. */
export function cleanSettings(raw: Partial<Record<keyof SyncedSettings, unknown>> | null | undefined): SyncedSettings {
  const s = raw ?? {};
  const pick = <T,>(v: unknown, parse: (x: string) => T, ok: (x: string) => boolean): T | null =>
    typeof v === "string" && ok(v) ? parse(v) : null;
  return {
    theme: pick(s.theme, parseThemePreference, (v) => ["system", "light", "dark"].includes(v)),
    currency: pick(s.currency, parseCurrency, (v) => ["EUR", "GBP", "USD"].includes(v)),
    units: pick(s.units, parseMeasurementSystem, (v) => ["metric", "imperial"].includes(v)),
    tv_country: pick(s.tv_country, (v) => v, isTvCountry),
  };
}

/** Account values win; the device fills in anything the account has never had. */
export function resolveSettings(device: SyncedSettings, account: SyncedSettings | null): SyncedSettings {
  if (!account) return device;
  return {
    theme: account.theme ?? device.theme,
    currency: account.currency ?? device.currency,
    units: account.units ?? device.units,
    tv_country: account.tv_country ?? device.tv_country,
  };
}

export function sameSettings(a: SyncedSettings, b: SyncedSettings): boolean {
  return SETTING_KEYS.every((k) => a[k] === b[k]);
}
