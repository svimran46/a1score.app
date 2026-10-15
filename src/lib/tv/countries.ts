/** Countries the current TV listings source returns schedules for. */
export const TV_COUNTRIES: { code: string; name: string }[] = [
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Türkiye" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
];

export const DEFAULT_TV_COUNTRY = "GB";
export const TV_COUNTRY_STORAGE_KEY = "a1score_tv_country";
export const TV_COUNTRY_CHANGE_EVENT = "a1score:tv-country-change";

/** Saved TV schedules country on this device, or null. */
export function readTvCountry(): string | null {
  try {
    const code = window.localStorage.getItem(TV_COUNTRY_STORAGE_KEY);
    return isTvCountry(code) ? code : null;
  } catch {
    return null;
  }
}

/** Saves the TV schedules country and tells listeners (account sync). */
export function saveTvCountry(code: string): void {
  if (!isTvCountry(code) || readTvCountry() === code) return;
  try {
    window.localStorage.setItem(TV_COUNTRY_STORAGE_KEY, code);
  } catch {
    // Storage blocked: the URL still carries the country.
  }
  window.dispatchEvent(new Event(TV_COUNTRY_CHANGE_EVENT));
}

export function isTvCountry(code: string | null | undefined): code is string {
  return !!code && TV_COUNTRIES.some((c) => c.code === code);
}

export function tvCountryName(code: string): string {
  return TV_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

/** Best guess from browser locales ("en-GB" → GB, "ms-MY" → MY), else the default. */
export function countryFromLocales(locales: readonly string[]): string {
  for (const locale of locales) {
    const region = locale.split(/[-_]/)[1]?.toUpperCase();
    if (isTvCountry(region)) return region;
  }
  return DEFAULT_TV_COUNTRY;
}
