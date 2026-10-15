/**
 * Theme preference: "dark" (brand default), "light", or "system" (follows the
 * OS setting). Stored in localStorage under "theme"; the inline script in the
 * root layout applies it before first paint, and this module keeps the header
 * toggle and the Settings page in sync afterwards.
 */

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const THEME_CHANGE_EVENT = "a1score:theme-change";
export const DEFAULT_THEME: ThemePreference = "dark";

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System default" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function parseThemePreference(raw: string | null | undefined): ThemePreference {
  return raw === "light" || raw === "dark" || raw === "system" ? raw : DEFAULT_THEME;
}

export function resolveTheme(pref: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (pref === "system") return systemPrefersDark ? "dark" : "light";
  return pref;
}

export function themeLabel(pref: ThemePreference): string {
  return THEME_OPTIONS.find((o) => o.value === pref)?.label ?? "Dark";
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : true;
}

export function readThemePreference(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

/** Persist and apply a preference, then notify every mounted theme control. */
export function setThemePreference(pref: ThemePreference): ResolvedTheme {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Storage blocked (private mode): still apply for this page view.
  }
  const resolved = resolveTheme(pref, systemPrefersDark());
  applyResolvedTheme(resolved);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: pref }));
  return resolved;
}

export function currentResolvedTheme(): ResolvedTheme {
  return resolveTheme(readThemePreference(), systemPrefersDark());
}

/**
 * Inline <head> script: runs before hydration so the first paint already has
 * the right theme. Kept as a string here so it stays next to the logic above.
 */
export const THEME_BOOT_SCRIPT = `
try {
  var p = localStorage.getItem('${THEME_STORAGE_KEY}');
  if (p !== 'light' && p !== 'dark' && p !== 'system') p = '${DEFAULT_THEME}';
  var t = p === 'system'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : p;
  var r = document.documentElement;
  r.setAttribute('data-theme', t);
  r.classList.toggle('dark', t === 'dark');
  r.classList.toggle('light', t === 'light');
} catch (_) {}
`;
