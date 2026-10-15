/**
 * UNOFFICIAL TV listings source: FotMob's public web endpoint. It is not a
 * licensed feed and may change without notice; replace with an official
 * provider (see ./types.ts TvProvider) before relying on it commercially.
 */
import { fotmobFetch } from "@/lib/fotmob/client";
import { sanitizeImageUrl } from "@/lib/image-sanitize";
import type { TvChannel, TvListing, TvProvider, TvTeam } from "./types";

/** Listings change a few times a day; refetch at most every 30 minutes per country. */
const REVALIDATE_SECONDS = 1800;

interface RawStation {
  name?: unknown;
  type?: unknown;
}
interface RawListing {
  startTime?: unknown;
  qualifiers?: unknown;
  station?: RawStation | null;
  matchId?: unknown;
  program?: { teams?: { name?: unknown; isHome?: unknown; teamBrandId?: unknown }[] } | null;
}

/** "/Date(1792623600000)/" → epoch ms (null for missing or pre-1970 placeholders). */
export function parseDotNetDate(raw: unknown): number | null {
  const ms = Number(String(raw ?? "").match(/-?\d+/)?.[0]);
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

function channelKind(type: unknown): TvChannel["kind"] {
  const t = String(type ?? "").toLowerCase();
  return t === "tv" ? "tv" : t === "stream" ? "stream" : "other";
}

function team(raw: { name?: unknown; teamBrandId?: unknown } | undefined): TvTeam | null {
  const name = typeof raw?.name === "string" ? raw.name.trim() : "";
  if (!name) return null;
  const id = raw?.teamBrandId != null && /^\d+$/.test(String(raw.teamBrandId)) ? String(raw.teamBrandId) : null;
  return {
    name,
    id,
    logoUrl: id ? sanitizeImageUrl(`https://images.fotmob.com/image_resources/logo/teamlogo/${id}_small.png`) : null,
  };
}

/**
 * Turns the endpoint's { [matchId]: RawListing[] } into one TvListing per
 * match (channels merged and de-duplicated), sorted by start time. Rows
 * without a start time or both team names are dropped.
 */
export function normalizeFotmobTvListings(payload: unknown): TvListing[] {
  if (!payload || typeof payload !== "object") return [];
  const out: TvListing[] = [];
  for (const [key, rows] of Object.entries(payload as Record<string, unknown>)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const listings = rows as RawListing[];
    const starts = listings.map((r) => parseDotNetDate(r.startTime)).filter((t): t is number => t != null);
    const teams = listings[0]?.program?.teams ?? [];
    const home = team(teams.find((t) => t?.isHome === true) ?? teams[0]);
    const away = team(teams.find((t) => t?.isHome === false) ?? teams[1]);
    if (starts.length === 0 || !home || !away) continue;

    const seen = new Set<string>();
    const channels: TvChannel[] = [];
    for (const r of listings) {
      const name = typeof r.station?.name === "string" ? r.station.name.trim() : "";
      if (!name || seen.has(name)) continue;
      seen.add(name);
      channels.push({ name, kind: channelKind(r.station?.type) });
    }
    if (channels.length === 0) continue;

    out.push({
      matchId: String(listings[0]?.matchId ?? key),
      startTime: new Date(Math.min(...starts)).toISOString(),
      home,
      away,
      live: listings.some((r) => Array.isArray(r.qualifiers) && r.qualifiers.includes("Live")),
      channels,
    });
  }
  return out.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export const fotmobTvProvider: TvProvider = {
  sourceLabel: "FotMob (unofficial)",
  async getListings(countryCode) {
    const data = await fotmobFetch(`/api/data/tvlistings?countryCode=${encodeURIComponent(countryCode)}`, REVALIDATE_SECONDS);
    // fotmobFetch returns null on failure; tell "unavailable" apart from "no broadcasts".
    if (data == null) throw new Error("TV listings request failed");
    return normalizeFotmobTvListings(data);
  },
};
