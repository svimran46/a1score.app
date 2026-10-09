/**
 * Builds the PlayerProfileVM: the one normalised, honest view of a player that
 * the profile page, its metadata and its share card render from.
 *
 * getPlayerProfile does the I/O (request-deduplicated with React cache);
 * buildPlayerProfile is pure and unit-tested against both data paths
 * (Transfermarkt proxy and Supabase). Nothing here is defaulted, guessed or
 * dated "now": a missing fact is null and the section that needs it hides.
 */

import * as React from "react";
import { getPlayerBySlugOrId, getDbPlayerByTransfermarktId } from "@/lib/data/players";
import { getRelatedNews } from "@/lib/data/news";
import { getPlayerAchievements, type PlayerAchievementsGrouped } from "@/lib/data/playerAchievements";
import { getClubShortName } from "@/lib/data/clubs";
import { toSeasonStatRow } from "@/lib/data/playerSeason";
import { getCanonicalPosition } from "@/lib/positions";
import { getClubSlug, getLeagueSlug, getPlayerSlug } from "@/lib/slugs";
import { sanitizeImageUrl } from "@/lib/image-sanitize";
import { formatDateGB } from "@/lib/format-value";
import { feeStatusFromDb, isFeeStatus, isYouthMove } from "@/lib/transfers";
import {
  ageOn,
  currentValuation,
  firstOnRecord,
  monthsUntil,
  parseContractUntil,
  peak,
  realPoints,
  sincePrevious,
  staleness,
  twelveMonth,
  valueAt,
} from "@/lib/valuation";
import type {
  PlayerProfileVM,
  ProfileClubRef,
  ProfileInjury,
  ProfileStatusKind,
  ProfileTransfer,
  SeasonStatRow,
  ValueChartProps,
} from "@/lib/data/playerProfile.types";
import type { NewsItem } from "@/types/news";

export interface BuildPlayerProfileContext {
  /** DB facts for a TM-path player (getDbPlayerByTransfermarktId); ignored on the DB path. */
  dbIdentity?: any;
  achievements?: PlayerAchievementsGrouped | null;
  news?: { items: NewsItem[]; scope: "player" | "club" } | null;
  now?: Date;
}

const CUID_RE = /^c[a-z0-9]{24}$/i;
// Transfermarkt player ids are numeric; any other player id is a Supabase row id.
const TM_PLAYER_ID_RE = /^\d+$/;
const NON_CLUB_RE = /^(unknown|unknown club|without club|retired|career break|free agent)$/i;

export function isDbCuid(id: unknown): id is string {
  return typeof id === "string" && CUID_RE.test(id);
}

function isDbPlayerId(id: unknown): id is string {
  return typeof id === "string" && id.trim() !== "" && !TM_PLAYER_ID_RE.test(id);
}

function text(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/&nbsp;/gi, " ").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  return s || null;
}

function isoOrNull(v: unknown): string | null {
  if (v == null || v === "") return null;
  const d = v instanceof Date ? v : new Date(v as string);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function knownPosition(raw: unknown): string | null {
  const s = text(raw);
  if (!s) return null;
  const canon = getCanonicalPosition(s);
  if (canon.order === 99 || /^unknown$/i.test(canon.detailed)) return null;
  return canon.detailed;
}

function clubRef(raw: any): ProfileClubRef | null {
  const name = text(raw?.name);
  if (!name || NON_CLUB_RE.test(name)) return null;
  const id = raw?.id != null ? String(raw.id) : null;
  const isDb = isDbCuid(id);
  const logoUrl = id && id !== "unknown" ? sanitizeImageUrl(raw?.logoUrl ?? null, "club", id) : sanitizeImageUrl(raw?.logoUrl ?? null, "club");
  return {
    name,
    shortName: getClubShortName(name) || name,
    logoUrl,
    href: isDb ? `/clubs/${getClubSlug({ id: id as string, name })}` : null,
  };
}

/** Current club name the profile can honestly show; null for TM "Without Club" / "Retired" pseudo clubs. */
export function resolveClubName(player: any): string | null {
  if (text(player?.clubStatusText)) return null;
  const name = text(one(player?.currentClub)?.name);
  return name && !NON_CLUB_RE.test(name) ? name : null;
}

function mapInjury(raw: any, i: number): ProfileInjury | null {
  const type = text(raw?.type);
  if (!type) return null;
  const id = raw?.id != null ? String(raw.id) : `injury-${i}`;
  const source: ProfileInjury["source"] = id.startsWith("fotmob") ? "fotmob" : "db";
  const isActive = String(raw?.status ?? "").toLowerCase() === "active";
  if (source === "fotmob") {
    // FotMob start dates are filled in by the loader; only the expected-return text is sourced.
    const expected = text(raw?.endDate);
    return { id, type, isActive, since: null, expectedReturn: expected, source };
  }
  const end = isoOrNull(raw?.endDate);
  return {
    id,
    type,
    isActive,
    since: isoOrNull(raw?.startDate),
    expectedReturn: isActive && end ? formatDateGB(end) : null,
    source,
  };
}

/** Pure: raw player (either data path) + context -> PlayerProfileVM. */
export function buildPlayerProfile(player: any, ctx: BuildPlayerProfileContext = {}): PlayerProfileVM {
  const now = ctx.now ?? new Date();
  const nowMs = now.getTime();
  const key = String(player?.id ?? "");
  const isDbPath = isDbPlayerId(key);
  const db = isDbPath ? null : ctx.dbIdentity ?? null;
  const dbId = isDbPath ? key : isDbPlayerId(db?.id) ? (db.id as string) : null;

  // Identity
  const fullName = text(player?.fullName) ?? text(player?.commonName) ?? "";
  const displayName = text(player?.commonName) ?? fullName;
  const dob = isoOrNull(player?.dateOfBirth);
  const nationalityRaw = Array.isArray(player?.nationality) ? player.nationality[0] : player?.nationality;
  const heightCm = Number(player?.heightCm);
  const foot = text(player?.preferredFoot);
  // TM: position = detailed role, subPosition = secondary role.
  // DB (dataset): position = broad group, subPosition = detailed role.
  const position = isDbPath
    ? knownPosition(player?.subPosition) ?? knownPosition(player?.position)
    : knownPosition(player?.position);
  const alsoPlaysRaw = isDbPath ? null : knownPosition(player?.subPosition);

  // Club
  const clubStatusText = text(player?.clubStatusText)?.toLowerCase() ?? null;
  const rawClub = one(player?.currentClub);
  const clubBase = clubStatusText ? null : clubRef(rawClub);
  const rawLeague = one(rawClub?.league);
  const leagueName = text(rawLeague?.name);
  const club: PlayerProfileVM["club"] = clubBase
    ? {
        ...clubBase,
        league: leagueName
          ? {
              name: leagueName,
              href: isDbCuid(rawLeague?.id) ? `/leagues/${getLeagueSlug({ id: rawLeague.id, name: leagueName })}` : null,
            }
          : null,
      }
    : null;
  const clubId = rawClub?.id != null ? String(rawClub.id) : null;

  // Status
  const parentRaw = one(isDbPath ? player?.parentClub : db?.parentClub);
  const parentClub = parentRaw && String(parentRaw.id ?? "") !== clubId ? clubRef(parentRaw) : null;
  const contractParsed = isDbPath ? null : parseContractUntil(player?.contractUntil ?? null);
  const contractFuture = contractParsed && new Date(contractParsed).getTime() > nowMs ? contractParsed : null;
  let kind: ProfileStatusKind = "unknown";
  if (clubStatusText === "retired") kind = "retired";
  else if (clubStatusText === "without club") kind = "free_agent";
  else if (parentClub) kind = "on_loan";
  else if (contractFuture) kind = "signed";
  const contractUntil = kind === "retired" || kind === "free_agent" ? null : contractFuture;

  // Injuries (DB rows; FotMob only if a loader attached one)
  const injuryRows: any[] = isDbPath ? player?.injuries ?? [] : db?.injuries ?? [];
  const injuries = (Array.isArray(injuryRows) ? injuryRows : [])
    .map(mapInjury)
    .filter((x): x is ProfileInjury => x !== null)
    .sort((a, b) => Number(b.isActive) - Number(a.isActive) || (b.since ?? "").localeCompare(a.since ?? ""));
  const activeDb = injuries.find((i) => i.isActive && i.source === "db") ?? null;

  // Valuation
  const points = realPoints(player?.marketValues);
  const current = currentValuation(Number(player?.latestMarketValue) || null, points);
  const fresh = staleness(current?.asOf ?? null, now);
  const ended = fresh === "stale" || kind === "retired";
  const valuation: PlayerProfileVM["valuation"] = {
    points,
    current,
    staleness: fresh,
    label: ended ? "Last market value" : "Market value",
    sincePrevious: ended ? null : sincePrevious(points, current),
    twelveMonth: ended ? null : twelveMonth(points, current, now),
    peak: peak(points, current),
    first: firstOnRecord(points, dob),
  };

  // Transfers: newest first; invalid and future dates dropped, never re-dated.
  const transfers: ProfileTransfer[] = [];
  const rawTransfers: any[] = Array.isArray(player?.transfers) ? player.transfers : [];
  rawTransfers.forEach((t, i) => {
    const date = isoOrNull(t?.date);
    if (!date || new Date(date).getTime() > nowMs) return;
    const fee = Number(t?.feeEur);
    const feeStatus = isFeeStatus(t?.feeStatus) ? t.feeStatus : feeStatusFromDb(t?.feeEur);
    const fromName = text(t?.fromClubName);
    const toName = text(t?.toClubName);
    const then = valueAt(points, date, 183);
    transfers.push({
      id: t?.id != null ? String(t.id) : `transfer-${i}`,
      date,
      fromName,
      toName,
      feeStatus,
      feeEur: (feeStatus === "disclosed" || feeStatus === "loan_fee") && Number.isFinite(fee) && fee > 0 ? fee : null,
      isYouth: isYouthMove(fromName, toName),
      valueThen: then ? { valueEur: then.valueEur, date: then.date } : null,
    });
  });
  transfers.sort((a, b) => b.date.localeCompare(a.date));

  const paid = transfers.filter((t) => t.feeStatus === "disclosed" && t.feeEur != null && t.feeEur > 0);
  let transferSummary: PlayerProfileVM["transferSummary"] = null;
  if (paid.length > 0) {
    const record = paid.reduce((best, t) => ((t.feeEur as number) > (best.feeEur as number) ? t : best), paid[0]);
    transferSummary = {
      totalEur: paid.reduce((sum, t) => sum + (t.feeEur as number), 0),
      count: paid.length,
      record: { feeEur: record.feeEur as number, toName: record.toName, date: record.date },
    };
  }

  // Season inputs (DB rows are never zero-filled; FotMob is verified later)
  const seasonRaw: any[] = isDbPath ? player?.seasonStats ?? [] : db?.seasonStats ?? [];
  const dbRows = (Array.isArray(seasonRaw) ? seasonRaw : [])
    .filter((r) => !String(r?.id ?? "").startsWith("fotmob"))
    .map(toSeasonStatRow)
    .filter((r): r is SeasonStatRow => r !== null);

  const honours = dbId && ctx.achievements && ctx.achievements.totalTitles > 0 ? ctx.achievements : null;
  const newsItems = ctx.news?.items?.slice(0, 3) ?? [];

  return {
    identity: {
      key,
      dbId,
      slug: getPlayerSlug(player ?? {}),
      displayName,
      fullName,
      photoUrl: text(player?.photoUrl),
      dob,
      age: dob ? ageOn(dob, now) : null,
      nationality: text(nationalityRaw),
      heightCm: Number.isFinite(heightCm) && heightCm > 0 ? heightCm : null,
      preferredFoot: foot,
      position,
      alsoPlays: alsoPlaysRaw && alsoPlaysRaw !== position ? alsoPlaysRaw : null,
    },
    club,
    status: {
      kind,
      contractUntil,
      contractMonthsLeft: contractUntil ? monthsUntil(contractUntil, now) : null,
      parentClub: kind === "on_loan" ? parentClub : null,
      activeInjury: activeDb ? { type: activeDb.type } : null,
    },
    valuation,
    transfers,
    transferSummary,
    honours,
    injuries,
    news: newsItems.length > 0 && ctx.news ? { items: newsItems, scope: ctx.news.scope } : null,
    season: {
      dbRows,
      lookupName: displayName,
      verifyClubName: club?.name ?? null,
    },
  };
}

/** Compact chart props; null when fewer than 2 real points. */
export function toValueChartProps(vm: PlayerProfileVM): ValueChartProps | null {
  const { points } = vm.valuation;
  if (points.length < 2) return null;
  const clubs: string[] = [];
  const clubIndex = new Map<string, number>();
  const tuples: ValueChartProps["points"] = points.map((p) => {
    let idx = -1;
    if (p.clubName) {
      idx = clubIndex.get(p.clubName) ?? -1;
      if (idx === -1) {
        idx = clubs.length;
        clubs.push(p.clubName);
        clubIndex.set(p.clubName, idx);
      }
    }
    return [new Date(p.date).getTime(), p.valueEur, idx];
  });
  const markers: ValueChartProps["markers"] = vm.transfers
    .filter(
      (t) =>
        !t.isYouth &&
        (t.feeStatus === "disclosed" || t.feeStatus === "loan_fee") &&
        t.feeEur != null &&
        t.feeEur > 0
    )
    .map((t): [number, number, string | null] => [new Date(t.date).getTime(), t.feeEur as number, t.toName])
    .sort((a, b) => a[0] - b[0]);
  return {
    points: tuples,
    clubs,
    markers,
    playerName: vm.identity.displayName,
    ended: vm.valuation.staleness === "stale" || vm.status.kind === "retired",
  };
}

// React's cache() exists in the server (RSC) build Next.js uses; plain React
// 18 (node tests) lacks it, so fall back to the identity function there.
const reactCache: <T extends (...args: any[]) => any>(fn: T) => T =
  (React as unknown as { cache?: <T>(fn: T) => T }).cache ?? ((fn) => fn);

/** Loads both data paths and returns the profile VM, or null when the player is not found. */
export const getPlayerProfile = reactCache(async (slug: string): Promise<PlayerProfileVM | null> => {
  const player: any = await getPlayerBySlugOrId(slug, { withFotmob: false });
  if (!player) return null;

  const key = String(player.id ?? "");
  const isDbPath = isDbPlayerId(key);
  const clubName = resolveClubName(player);
  const playerNames = [player.fullName, player.commonName].filter((n): n is string => typeof n === "string");

  const [dbIdentity, related, dbPathAchievements] = await Promise.all([
    isDbPath ? Promise.resolve(null) : getDbPlayerByTransfermarktId(key).catch(() => null),
    getRelatedNews({ player: playerNames, club: clubName ? [clubName] : [] }, 3).catch(() => []),
    isDbPath ? getPlayerAchievements(key).catch(() => null) : Promise.resolve(null),
  ]);

  const achievements =
    dbPathAchievements ??
    (dbIdentity?.id ? await getPlayerAchievements(dbIdentity.id).catch(() => null) : null);

  const news =
    related.length > 0
      ? {
          items: related as NewsItem[],
          scope: related.some((i) => i.matchedOn === "player") ? ("player" as const) : ("club" as const),
        }
      : null;

  return buildPlayerProfile(player, { dbIdentity, achievements, news, now: new Date() });
});
