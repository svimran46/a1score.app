/**
 * Account sync for follows and settings (browser only).
 *
 * - First sign-in on a device: device + account are merged, then saved to the account.
 * - Later loads on that device: the account is the source of truth.
 * - While signed in: every local change is written to the account (debounced).
 *
 * The device stays usable signed out; signing out keeps its data.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { watchlistAdapter, type WatchlistItem } from "@/lib/watchlist/storage";
import { THEME_CHANGE_EVENT, readThemePreference, setThemePreference } from "@/lib/theme";
import { CURRENCY_CHANGE_EVENT } from "@/lib/currency";
import { getCurrency, setCurrency } from "@/lib/currency-store";
import { UNITS_CHANGE_EVENT, UNITS_STORAGE_KEY, parseMeasurementSystem } from "@/lib/units";
import { setMeasurementSystem } from "@/lib/useUnits";
import { TV_COUNTRY_CHANGE_EVENT, readTvCountry, saveTvCountry } from "@/lib/tv/countries";
import { diffFollows, fromRow, mergeFollows, toRow, type FollowRow } from "./follows";
import { cleanSettings, resolveSettings, sameSettings, type SyncedSettings } from "./settings";
import { setSyncStatus as setStatus } from "./status";

/** Which account this device's follows/settings were last synced with. */
const SYNCED_USER_KEY = "a1score_synced_user";
const DEBOUNCE_MS = 500;

function readDeviceSettings(): SyncedSettings {
  let units: string | null = null;
  try {
    units = window.localStorage.getItem(UNITS_STORAGE_KEY);
  } catch {
    // ignore
  }
  return cleanSettings({
    theme: readThemePreference(),
    currency: getCurrency(),
    units: units ? parseMeasurementSystem(units) : null,
    tv_country: readTvCountry(),
  });
}

function applyDeviceSettings(s: SyncedSettings) {
  const now = readDeviceSettings();
  if (s.theme && s.theme !== now.theme) setThemePreference(s.theme);
  if (s.currency && s.currency !== now.currency) setCurrency(s.currency);
  if (s.units && s.units !== now.units) setMeasurementSystem(s.units);
  if (s.tv_country && s.tv_country !== now.tv_country) saveTvCountry(s.tv_country);
}

function readSyncedUser(): string | null {
  try {
    return window.localStorage.getItem(SYNCED_USER_KEY);
  } catch {
    return null;
  }
}
function writeSyncedUser(id: string | null) {
  try {
    if (id) window.localStorage.setItem(SYNCED_USER_KEY, id);
    else window.localStorage.removeItem(SYNCED_USER_KEY);
  } catch {
    // ignore
  }
}

function debounce(fn: () => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  const run = () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn();
    }, ms);
  };
  run.cancel = () => t && clearTimeout(t);
  return run;
}

/** Starts syncing for a signed-in user; returns a stop function. */
export function startSync(supabase: SupabaseClient, userId: string): () => void {
  let stopped = false;
  let applying = false; // true while writing account data locally, so it isn't echoed back
  let lastFollows: WatchlistItem[] = [];
  let lastSettings: SyncedSettings | null = null;
  const cleanups: (() => void)[] = [];

  const fail = (where: string, err: unknown) => {
    console.warn(`[sync] ${where} failed:`, err);
    if (!stopped) setStatus("error");
  };

  async function pushFollows() {
    const next = watchlistAdapter.getFavorites();
    const { upserts, deletes } = diffFollows(lastFollows, next);
    if (upserts.length === 0 && deletes.length === 0) return;
    setStatus("syncing");
    try {
      if (upserts.length > 0) {
        const { error } = await supabase
          .from("user_follows")
          .upsert(upserts.map((f) => ({ user_id: userId, ...toRow(f) })), { onConflict: "user_id,type,entity_id" });
        if (error) throw error;
      }
      for (const type of ["player", "club", "league"] as const) {
        const ids = deletes.filter((d) => d.type === type).map((d) => d.id);
        if (ids.length === 0) continue;
        const { error } = await supabase.from("user_follows").delete().eq("user_id", userId).eq("type", type).in("entity_id", ids);
        if (error) throw error;
      }
      lastFollows = next;
      if (!stopped) setStatus("synced");
    } catch (err) {
      fail("saving follows", err);
    }
  }

  async function pushSettings() {
    const next = readDeviceSettings();
    if (lastSettings && sameSettings(lastSettings, next)) return;
    setStatus("syncing");
    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
      lastSettings = next;
      if (!stopped) setStatus("synced");
    } catch (err) {
      fail("saving settings", err);
    }
  }

  const schedulePushFollows = debounce(() => void pushFollows(), DEBOUNCE_MS);
  const schedulePushSettings = debounce(() => void pushSettings(), DEBOUNCE_MS);

  async function initialSync() {
    setStatus("syncing");
    const firstOnThisDevice = readSyncedUser() !== userId;
    try {
      const [followsRes, settingsRes] = await Promise.all([
        supabase.from("user_follows").select("type, entity_id, data, saved_at").eq("user_id", userId),
        supabase.from("user_settings").select("theme, currency, units, tv_country").eq("user_id", userId).maybeSingle(),
      ]);
      if (followsRes.error) throw followsRes.error;
      if (settingsRes.error) throw settingsRes.error;
      if (stopped) return;

      const remoteFollows = (followsRes.data as FollowRow[]).map(fromRow);
      const merged = firstOnThisDevice
        ? mergeFollows(watchlistAdapter.getFavorites(), remoteFollows)
        : mergeFollows([], remoteFollows);
      // On first sync the account gets everything; after that it already has it.
      lastFollows = firstOnThisDevice ? remoteFollows : merged;

      const accountSettings = settingsRes.data ? cleanSettings(settingsRes.data) : null;
      const resolved = resolveSettings(readDeviceSettings(), accountSettings);
      lastSettings = accountSettings;

      applying = true;
      try {
        watchlistAdapter.replaceFavorites(merged);
        applyDeviceSettings(resolved);
      } finally {
        applying = false;
      }

      await Promise.all([pushFollows(), pushSettings()]);
      if (stopped) return;
      writeSyncedUser(userId);
      setStatus("synced");
    } catch (err) {
      fail("loading your account", err);
    }
  }

  // Local changes → account.
  cleanups.push(
    watchlistAdapter.subscribe(() => {
      if (!applying && !stopped) schedulePushFollows();
    })
  );
  const onSetting = () => {
    if (!applying && !stopped) schedulePushSettings();
  };
  for (const ev of [THEME_CHANGE_EVENT, CURRENCY_CHANGE_EVENT, UNITS_CHANGE_EVENT, TV_COUNTRY_CHANGE_EVENT]) {
    window.addEventListener(ev, onSetting);
    cleanups.push(() => window.removeEventListener(ev, onSetting));
  }

  void initialSync();

  return () => {
    stopped = true;
    schedulePushFollows.cancel();
    schedulePushSettings.cancel();
    cleanups.forEach((c) => c());
    setStatus("idle");
  };
}

/** After sign-out the device keeps its data but is no longer tied to that account. */
export function forgetSyncedUser() {
  writeSyncedUser(null);
}
