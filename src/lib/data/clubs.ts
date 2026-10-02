import { supabase } from "@/lib/supabase";
import { tmGetClub } from "@/lib/transfermarkt/client";
import { getLeagueStandings } from "@/lib/fotmob/client";
import { sanitizeImageUrl } from "@/lib/image-sanitize";
import { getCanonicalPosition } from "@/lib/positions";

import { FOTMOB_TEAM_MAPPINGS } from "@/lib/league-mappings";

export const CLUB_DISPLAY_NAMES: Record<string, string> = {
  // Required standard common names
  "Associazione Sportiva Roma": "Roma",
  "AS Roma": "Roma",
  "Roma": "Roma",

  "Brighton and Hove Albion": "Brighton & Hove Albion",
  "Brighton & Hove Albion": "Brighton & Hove Albion",
  "Brighton &amp; Hove Albion": "Brighton & Hove Albion",
  "Brighton": "Brighton & Hove Albion",

  "Football Club Internazionale Milano": "Inter",
  "FC Internazionale Milano": "Inter",
  "Internazionale": "Inter",
  "Inter Milan": "Inter",
  "Inter": "Inter",

  "Wolverhampton Wanderers": "Wolves",
  "Wolverhampton": "Wolves",
  "Wolves": "Wolves",

  "Tottenham Hotspur": "Spurs",
  "Tottenham Hotspur FC": "Spurs",
  "Tottenham": "Spurs",
  "Spurs": "Spurs",

  "Manchester City": "Man City",
  "Manchester City FC": "Man City",
  "Man City": "Man City",

  "Manchester United": "Man Utd",
  "Manchester United FC": "Man Utd",
  "Man United": "Man Utd",
  "Man Utd": "Man Utd",

  "Club Atlético de Madrid": "Atletico Madrid",
  "Club Atlético de Madrid S.A.D.": "Atletico Madrid",
  "Atlético de Madrid": "Atletico Madrid",
  "Atlético Madrid": "Atletico Madrid",
  "Atletico Madrid": "Atletico Madrid",

  "Paris Saint-Germain": "PSG",
  "Paris Saint-Germain FC": "PSG",
  "Paris SG": "PSG",
  "PSG": "PSG",

  // Additional common short names
  "1. Fußballclub Heidenheim 1846": "1. FC Heidenheim",
  "Bologna Football Club 1909": "Bologna FC",
  "Borussia Mönchengladbach": "M'gladbach",
  "CF União Madeira (-2021)": "União Madeira",
  "De Graafschap Doetinchem": "De Graafschap",
  "Desportivo Aves (- 2020)": "Desportivo Aves",
  "Fortuna Sittardia Combinatie": "Fortuna Sittard",
  "Società Sportiva Lazio S.p.A.": "SS Lazio",
  "Società Sportiva Lazio": "SS Lazio",
  "Thonon Évian Grand Genève FC": "Thonon Évian",
};

export const CLUB_SHORT_NAMES: Record<string, string> = {
  ...CLUB_DISPLAY_NAMES,
  "Arsenal Football Club": "Arsenal",
  "Arsenal FC": "Arsenal",
  "Arsenal": "Arsenal",
  "Futbol Club Barcelona": "Barcelona",
  "FC Barcelona": "Barcelona",
  "Barcelona": "Barcelona",
  "Chelsea Football Club": "Chelsea",
  "Chelsea FC": "Chelsea",
  "Chelsea": "Chelsea",
  "Manchester City": "Man City",
  "Manchester City FC": "Man City",
  "Man City": "Man City",
  "Paris Saint-Germain": "PSG",
  "Paris Saint-Germain FC": "PSG",
  "Paris SG": "PSG",
  "PSG": "PSG",
  "Real Madrid": "Real Madrid",
  "Real Madrid CF": "Real Madrid",
  "Real Madrid Club de Fútbol": "Real Madrid",
  "Liverpool FC": "Liverpool",
  "Liverpool Football Club": "Liverpool",
  "Liverpool": "Liverpool",
  "FC Bayern München": "Bayern Munich",
  "FC Bayern Munich": "Bayern Munich",
  "Bayern Munich": "Bayern Munich",
  "FC Bayern": "Bayern Munich",
  "Juventus FC": "Juventus",
  "Juventus Football Club": "Juventus",
  "Juventus": "Juventus",
  "AC Milan": "Milan",
  "Milan": "Milan",
  "FC Internazionale Milano": "Inter",
  "Inter Milan": "Inter",
  "Inter": "Inter",
  "Borussia Dortmund": "Dortmund",
  "BVB": "Dortmund",
  "Aston Villa FC": "Aston Villa",
  "Aston Villa": "Aston Villa",
  "Newcastle United FC": "Newcastle",
  "Newcastle United": "Newcastle",
  "Newcastle": "Newcastle",
  "Tottenham Hotspur FC": "Spurs",
  "Tottenham Hotspur": "Spurs",
  "Tottenham": "Spurs",
  "Spurs": "Spurs",
  "Manchester United FC": "Man Utd",
  "Manchester United": "Man Utd",
  "Man United": "Man Utd",
  "Man Utd": "Man Utd",
  "Club Atlético de Madrid": "Atletico Madrid",
  "Atletico Madrid": "Atletico Madrid",
  "Atlético Madrid": "Atletico Madrid",
  "Bayer 04 Leverkusen": "Leverkusen",
  "Bayer Leverkusen": "Leverkusen",
  "Leverkusen": "Leverkusen",
  "Sporting CP": "Sporting CP",
  "Sporting Clube de Portugal": "Sporting CP",
  "SL Benfica": "Benfica",
  "Benfica": "Benfica",
  "FC Porto": "Porto",
  "Porto": "Porto",
  "AFC Ajax": "Ajax",
  "Ajax Amsterdam": "Ajax",
  "Ajax": "Ajax",
  "PSV Eindhoven": "PSV",
  "PSV": "PSV",
  "Feyenoord Rotterdam": "Feyenoord",
  "Feyenoord": "Feyenoord",
  "Sevilla FC": "Sevilla",
  "Sevilla": "Sevilla",
  "Villarreal CF": "Villarreal",
  "Villarreal": "Villarreal",
  "Valencia CF": "Valencia",
  "Valencia": "Valencia",
  "Girona FC": "Girona",
  "Girona": "Girona",
  "Real Sociedad": "Real Sociedad",
  "Real Sociedad de Fútbol": "Real Sociedad",
  "Athletic Club": "Athletic Club",
  "Athletic Bilbao": "Athletic Club",
  "AS Monaco": "Monaco",
  "Monaco": "Monaco",
  "Olympique de Marseille": "Marseille",
  "Marseille": "Marseille",
  "Olympique Lyonnais": "Lyon",
  "Lyon": "Lyon",
  "Lille OSC": "Lille",
  "Lille": "Lille",
  "SSC Napoli": "Napoli",
  "Napoli": "Napoli",
  "Atalanta BC": "Atalanta",
  "Atalanta": "Atalanta",
  "SS Lazio": "Lazio",
  "Lazio": "Lazio",
  "ACF Fiorentina": "Fiorentina",
  "Fiorentina": "Fiorentina",
  "Torino FC": "Torino",
  "Torino": "Torino",
  "Bologna FC 1909": "Bologna",
  "Bologna": "Bologna",
};

export function getClubDisplayName(
  clubOrName: { name?: string | null; shortName?: string | null } | string | null | undefined
): string {
  if (!clubOrName) return "";
  const rawName =
    typeof clubOrName === "string"
      ? clubOrName
      : clubOrName.name || clubOrName.shortName || "";
  const trimmed = rawName.trim();
  if (!trimmed) return "";

  // Exact lookup in display names
  if (CLUB_DISPLAY_NAMES[trimmed]) return CLUB_DISPLAY_NAMES[trimmed];

  // Case-insensitive lookup
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(CLUB_DISPLAY_NAMES)) {
    if (key.toLowerCase() === lower) {
      return val;
    }
  }

  // Unescape any HTML entity artifacts
  let clean = trimmed.replace(/&amp;/g, "&");

  // Normalized patterns
  clean = clean
    .replace(/^Associazione Sportiva\s+/i, "AS ")
    .replace(/^Società Sportiva\s+/i, "SS ")
    .replace(/\s+S\.p\.A\.?$/i, "")
    .replace(/\s+S\.A\.D\.?$/i, "")
    .replace(/\s+Football Club(\s+|$)/i, " FC$1")
    .replace(/^1\.\s*Fußballclub\s+/i, "1. FC ");

  return clean;
}

export function getClubShortName(
  clubOrName: { name?: string | null; shortName?: string | null } | string | null | undefined
): string {
  if (!clubOrName) return "";
  const rawName =
    typeof clubOrName === "string"
      ? clubOrName
      : clubOrName.shortName || clubOrName.name || "";
  const trimmed = rawName.trim();
  if (!trimmed) return "";

  if (CLUB_SHORT_NAMES[trimmed]) return CLUB_SHORT_NAMES[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(CLUB_SHORT_NAMES)) {
    if (key.toLowerCase() === lower) {
      return val;
    }
  }

  // Get base display name first
  const disp = getClubDisplayName(clubOrName);

  // Remove FC / CF suffixes and prefixes so no FC suffix variants exist
  let clean = disp
    .replace(/^FC\s+/i, "")
    .replace(/^CF\s+/i, "")
    .replace(/^AFC\s+/i, "")
    .replace(/^RCD\s+/i, "")
    .replace(/^RC\s+/i, "")
    .replace(/^SSC\s+/i, "")
    .replace(/^AS\s+/i, "")
    .replace(/^SS\s+/i, "")
    .replace(/\s+FC$/i, "")
    .replace(/\s+CF$/i, "")
    .replace(/\s+AFC$/i, "")
    .trim();

  return clean || disp || trimmed;
}

/**
 * Extracts possible identifiers (CUID, TM ID, FotMob ID, slug) from an input string.
 */
export function extractClubIdentifiers(idOrSlug: string) {
  const raw = (idOrSlug || "").trim();
  const cuidMatch = raw.match(/c[a-z0-9]{24}/i);
  const cuid = cuidMatch ? cuidMatch[0] : null;

  // Numeric ID
  const numMatch = raw.match(/\b\d+\b/);
  const numId = numMatch ? numMatch[0] : null;

  // Check FotMob mapping for numeric ID (e.g. 8456 for Man City, 9823 for Bayern)
  let tmId = numId;
  let fotmobCuid: string | null = null;
  if (numId && FOTMOB_TEAM_MAPPINGS[Number(numId)]) {
    const mapping = FOTMOB_TEAM_MAPPINGS[Number(numId)];
    if (mapping.tmId) tmId = mapping.tmId;
    if (mapping.clubId) fotmobCuid = mapping.clubId;
  }

  return { raw, cuid: cuid || fotmobCuid, tmId };
}

export function isFirstTeamPlayer(p: { status?: string | null; tier?: string | null } | null | undefined): boolean {
  if (!p) return false;
  if (
    p.status === "departed" ||
    p.status === "academy" ||
    p.status === "loan_out" ||
    p.tier === "academy" ||
    p.tier === "loan_out"
  ) {
    return false;
  }
  return p.status === "first_team" || p.status === "on_loan" || p.tier === "first_team" || p.tier === "on_loan";
}

/**
 * Canonical function for first-team squad, club total value, average age and player count.
 * Used consistently across club page, /clubs, league pages, /leagues, OG images and JSON-LD.
 * Definition:
 * - Active player: status !== "departed"
 * - First team tier: isFirstTeamPlayer(p) (status: first_team or on_loan)
 * - Excludes: departed players, academy/reserve youth, and players loaned out to other clubs
 * - Total squad valuation: sum of first team players' latestMarketValue
 * - Average age: arithmetic mean of first team players with known age/DOB, rounded to 1 decimal
 * - Squad size / player count: count of first team players
 */
export function computeClubMetrics(rawPlayers: any[]) {
  // Exclude departed players
  const active = (rawPlayers || []).filter((p: any) => p.status !== "departed");

  const squadWithValues = active.map((p: any) => {
    const extId = p.transfermarktId || p.id || p.sourceId;
    const canonicalPos = getCanonicalPosition(p.subPosition || p.position);
    const birthYear = p.dateOfBirth ? new Date(p.dateOfBirth).getFullYear() : null;
    const age = birthYear ? 2026 - birthYear : (typeof p.age === "number" ? p.age : null);
    const val = p.latestMarketValue ? Number(p.latestMarketValue) : 0;
    
    // Explicit status determines tier: first_team, academy, loan_out, on_loan
    const tier = p.status === "academy"
      ? "academy"
      : p.status === "loan_out"
      ? "loan_out"
      : p.status === "on_loan"
      ? "on_loan"
      : "first_team";

    return {
      ...p,
      sourceId: extId,
      slug: `${(p.fullName || "player").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
      photoUrl: sanitizeImageUrl(p.photoUrl, "player", extId),
      position: canonicalPos.detailed,
      positionGroup: canonicalPos.group,
      canonicalPosition: canonicalPos,
      latestMarketValue: val,
      age,
      contractUntil: p.contractUntil || null,
      tier,
    };
  });

  const firstTeam = squadWithValues.filter(isFirstTeamPlayer);
  const academy = squadWithValues.filter((p: any) => p.tier === "academy");
  const squadToUse = firstTeam.length > 0 ? firstTeam : squadWithValues;

  const totalSquadValue = squadToUse.reduce(
    (acc: number, curr: any) => acc + curr.latestMarketValue,
    0
  );

  const ages = squadToUse.map((p: any) => p.age).filter((a: any): a is number => typeof a === "number" && a > 0);
  const averageAge = ages.length > 0 ? (ages.reduce((s: number, a: number) => s + a, 0) / ages.length).toFixed(1) : null;

  return {
    players: squadWithValues.sort((a: any, b: any) => b.latestMarketValue - a.latestMarketValue),
    firstTeamPlayers: squadToUse.sort((a: any, b: any) => b.latestMarketValue - a.latestMarketValue),
    academyPlayers: academy.sort((a: any, b: any) => b.latestMarketValue - a.latestMarketValue),
    totalSquadValue,
    totalMarketValue: totalSquadValue,
    squadSize: squadToUse.length,
    averageAge,
  };
}

export async function getClubById(idOrSlug: string) {
  if (!idOrSlug) return null;

  const { raw, cuid, tmId } = extractClubIdentifiers(idOrSlug);

  // 1. Resolve canonical club record from DB
  let dbClub: any = null;
  try {
    let query = supabase
      .from("Club")
      .select(`
        *,
        league:League ( * ),
        players:Player!Player_currentClubId_fkey (
          id,
          fullName,
          commonName,
          position,
          subPosition,
          photoUrl,
          transfermarktId,
          nationality,
          dateOfBirth,
          latestMarketValue,
          lastSeason,
          status,
          parentClubId,
          loanUntil,
          parentClub:Club!Player_parentClubId_fkey ( id, name )
        )
      `);

    if (cuid) {
      query = query.or(`id.eq.${cuid},transfermarktId.eq.${raw}`);
    } else if (tmId) {
      query = query.or(`transfermarktId.eq.${tmId},id.eq.${raw}`);
    } else {
      query = query.or(`id.eq.${raw},transfermarktId.eq.${raw}`);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      dbClub = data;
    } else if (!cuid && raw && raw.length >= 3) {
      // Fallback: search by name matching cleaned slug (e.g. "barcelona", "real-madrid")
      const cleanTerm = raw.replace(/-/g, " ").trim();
      const { data: fallbackClub } = await supabase
        .from("Club")
        .select(`
          *,
          league:League ( * ),
          players:Player!Player_currentClubId_fkey (
            id,
            fullName,
            commonName,
            position,
            subPosition,
            photoUrl,
            transfermarktId,
            nationality,
            dateOfBirth,
            latestMarketValue,
            lastSeason,
            status,
            parentClubId,
            loanUntil,
            parentClub:Club!Player_parentClubId_fkey ( id, name )
          )
        `)
        .ilike("name", `%${cleanTerm}%`)
        .order("totalMarketValue", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackClub) {
        dbClub = fallbackClub;
      }
    }
  } catch (dbErr) {
    console.warn(`[Data Layer] Error resolving club ${idOrSlug} from DB:`, dbErr);
  }

  const effectiveTmId = dbClub?.transfermarktId || tmId || (idOrSlug.match(/^\d+$/) ? idOrSlug : null);
  const canonicalId = dbClub?.id || idOrSlug;
  const canonicalName = dbClub?.name || "Club";
  const canonicalLogo = dbClub?.logoUrl
    ? sanitizeImageUrl(dbClub.logoUrl, "club", canonicalId)
    : effectiveTmId
    ? sanitizeImageUrl(`https://img.a.transfermarkt.technology/wappen/head/${effectiveTmId}.png`, "club", effectiveTmId)
    : null;

  // 2. Authoritative Database metrics (used if DB has active player roster)
  if (dbClub && dbClub.players && dbClub.players.length > 0) {
    const metrics = computeClubMetrics(dbClub.players);
    const finalVal = metrics.totalSquadValue > 0
      ? metrics.totalSquadValue
      : (dbClub.totalMarketValue ? Number(dbClub.totalMarketValue) : 0);
    const finalSize = metrics.squadSize > 0
      ? metrics.squadSize
      : (dbClub.squadSize || 0);

    return {
      ...dbClub,
      id: dbClub.id,
      name: dbClub.name,
      shortName: getClubShortName(dbClub.name),
      logoUrl: canonicalLogo,
      league: dbClub.league
        ? {
            ...dbClub.league,
            logoUrl: sanitizeImageUrl(dbClub.league.logoUrl, "league", dbClub.league.id),
          }
        : null,
      players: metrics.players,
      firstTeamPlayers: metrics.firstTeamPlayers,
      academyPlayers: metrics.academyPlayers,
      totalSquadValue: finalVal,
      totalMarketValue: finalVal,
      squadSize: finalSize,
      averageAge: metrics.averageAge,
    };
  }

  // 3. Fallback to Transfermarkt live squad proxy if club roster was not in DB
  if (effectiveTmId) {
    try {
      const liveClub = await tmGetClub(effectiveTmId);
      if (liveClub && liveClub.players && liveClub.players.length > 0) {
        const metrics = computeClubMetrics(liveClub.players);
        return {
          id: canonicalId,
          sourceId: effectiveTmId,
          transfermarktId: effectiveTmId,
          name: canonicalName,
          shortName: getClubShortName(canonicalName),
          logoUrl: canonicalLogo,
          country: dbClub?.country || null,
          league: dbClub?.league
            ? {
                ...dbClub.league,
                logoUrl: sanitizeImageUrl(dbClub.league.logoUrl, "league", dbClub.league.id),
              }
            : null,
          totalSquadValue: metrics.totalSquadValue,
          totalMarketValue: metrics.totalMarketValue,
          squadSize: metrics.squadSize,
          averageAge: metrics.averageAge,
          players: metrics.players,
          firstTeamPlayers: metrics.firstTeamPlayers,
          academyPlayers: metrics.academyPlayers,
        };
      }
    } catch (proxyErr) {
      console.warn(`[Data Layer] TM Live Club fetch failed for ${effectiveTmId}:`, proxyErr);
    }
  }

  if (!dbClub) {
    return null;
  }

  return {
    ...dbClub,
    id: dbClub.id,
    name: dbClub.name,
    shortName: getClubShortName(dbClub.name),
    logoUrl: canonicalLogo,
    league: dbClub.league
      ? {
          ...dbClub.league,
          logoUrl: sanitizeImageUrl(dbClub.league.logoUrl, "league", dbClub.league.id),
        }
      : null,
    players: [],
    firstTeamPlayers: [],
    academyPlayers: [],
    totalSquadValue: dbClub.totalMarketValue ? Number(dbClub.totalMarketValue) : 0,
    totalMarketValue: dbClub.totalMarketValue ? Number(dbClub.totalMarketValue) : 0,
    squadSize: dbClub.squadSize || 0,
    averageAge: null,
  };
}

export async function getAllClubs(options?: { all?: boolean }) {
  try {
    const { data: clubs, error } = await supabase
      .from("Club")
      .select(`
        id,
        name,
        logoUrl,
        country,
        squadSize,
        totalMarketValue,
        lastSeason,
        transfermarktId,
        league:League ( id, name, country ),
        players:Player!Player_currentClubId_fkey ( latestMarketValue, dateOfBirth, lastSeason, status )
      `)
      .order("totalMarketValue", { ascending: false, nullsFirst: false })
      .order("name", { ascending: true });

    if (error || !clubs) {
      console.error("Error fetching all clubs:", error);
      return [];
    }

    // Load league standings to attach domestic league rank by team ID
    const fotmobIds = [47, 87, 55, 54, 53, 61, 57];
    const teamRankByClubId = new Map<string, number>();
    const teamRankByTmId = new Map<string, number>();

    try {
      const standingsArrays = await Promise.all(
        fotmobIds.map((id) =>
          getLeagueStandings(id)
            .then((r) => r?.standings || [])
            .catch(() => [])
        )
      );

      standingsArrays.forEach((arr) => {
        arr.forEach((t: any) => {
          const mapping = FOTMOB_TEAM_MAPPINGS[t.id];
          if (mapping?.clubId) teamRankByClubId.set(mapping.clubId, t.idx);
          if (mapping?.tmId) teamRankByTmId.set(mapping.tmId, t.idx);
        });
      });
    } catch {
      // ignore
    }

    const mappedClubs = clubs.map((club: any) => {
      const metrics = computeClubMetrics(club.players || []);
      const finalSquadVal = metrics.totalSquadValue > 0
        ? metrics.totalSquadValue
        : (club.totalMarketValue ? Number(club.totalMarketValue) : 0);
      const finalSquadSize = metrics.squadSize > 0
        ? metrics.squadSize
        : (club.squadSize || null);

      const leagueRank =
        teamRankByClubId.get(club.id) ||
        (club.transfermarktId ? teamRankByTmId.get(club.transfermarktId) : null) ||
        null;

      return {
        id: club.id,
        name: club.name,
        shortName: getClubShortName(club.name),
        logoUrl: sanitizeImageUrl(club.logoUrl, "club", club.id),
        country: club.country || club.league?.country || null,
        leagueName: club.league?.name ?? null,
        leagueId: club.league?.id ?? null,
        playerCount: finalSquadSize,
        totalSquadValue: finalSquadVal,
        averageAge: metrics.averageAge,
        leagueRank,
      };
    });

    if (options?.all) {
      return mappedClubs;
    }

    // Default: Display only clubs with plausible first-team squads (15–45 players)
    return mappedClubs.filter(
      (club) => club.playerCount !== null && club.playerCount >= 15 && club.playerCount <= 45
    );
  } catch (error) {
    console.error("Error fetching all clubs:", error);
    return [];
  }
}

export async function getTopClubs(limit = 24) {
  const all = await getAllClubs();
  return all.slice(0, limit);
}

export async function getClubTransfers(clubName: string) {
  if (!clubName) {
    return { recordArrivals: [], recordDepartures: [] };
  }

  // Clean common club prefixes/suffixes to match transfer records
  const cleanName = clubName
    .replace(/^(FC|CF|AC|AS|SSC|AFC|BSC|RCD|RC)\s+/i, "")
    .replace(/\s+(FC|CF|AFC|BSC|SAD)$/i, "")
    .trim();

  try {
    const [arrivalsRes, departuresRes] = await Promise.all([
      supabase
        .from("Transfer")
        .select(`
          id,
          fromClubName,
          toClubName,
          date,
          feeEur,
          transferType,
          player:Player (
            id,
            fullName,
            commonName,
            photoUrl,
            position,
            transfermarktId
          )
        `)
        .ilike("toClubName", `%${cleanName}%`)
        .order("feeEur", { ascending: false, nullsFirst: false })
        .limit(8),

      supabase
        .from("Transfer")
        .select(`
          id,
          fromClubName,
          toClubName,
          date,
          feeEur,
          transferType,
          player:Player (
            id,
            fullName,
            commonName,
            photoUrl,
            position,
            transfermarktId
          )
        `)
        .ilike("fromClubName", `%${cleanName}%`)
        .order("feeEur", { ascending: false, nullsFirst: false })
        .limit(8),
    ]);

    const formatTransfers = (list: any[]) =>
      (list || []).map((t) => {
        const rawP = Array.isArray(t.player) ? t.player[0] : t.player;
        const extId = rawP ? (rawP.transfermarktId || rawP.id) : null;
        const player = rawP
          ? {
              ...rawP,
              sourceId: extId,
              slug: `${rawP.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`,
              photoUrl: sanitizeImageUrl(rawP.photoUrl, "player", extId),
            }
          : null;

        return {
          id: t.id,
          fromClubName: t.fromClubName,
          toClubName: t.toClubName,
          date: t.date,
          feeEur: t.feeEur !== null && t.feeEur !== undefined ? Number(t.feeEur) : null,
          transferType: t.transferType,
          player,
        };
      });

    return {
      recordArrivals: formatTransfers(arrivalsRes.data || []),
      recordDepartures: formatTransfers(departuresRes.data || []),
    };
  } catch (err) {
    console.error(`[Data Layer] Error fetching transfers for club ${clubName}:`, err);
    return { recordArrivals: [], recordDepartures: [] };
  }
}

export interface ClubHonourCompetition {
  key: string;
  label: string;
  note?: string | null;
  titles: number;
  source?: string | null;
  updatedDate?: string | null;
  seasons: Array<{
    season: string;
    seasonEndYear: number;
    note?: string | null;
  }>;
}

export async function getClubHonours(clubId: string, clubName: string): Promise<ClubHonourCompetition[]> {
  try {
    // 1. Fetch competitions
    const { data: competitions, error: compErr } = await supabase
      .from("Competition")
      .select("key, label, note");

    if (compErr || !competitions || competitions.length === 0) {
      return [];
    }

    // 2. Fetch winning seasons where clubId matches or clubName matches and not external
    // Match either clubId or canonical name
    const { data: winners, error: winErr } = await supabase
      .from("CompetitionWinner")
      .select("competitionKey, season, seasonEndYear, note, source, clubId, clubName, isExternal")
      .or(`clubId.eq.${clubId},clubName.eq.${clubName}`)
      .eq("isExternal", false)
      .order("seasonEndYear", { ascending: false });

    if (winErr || !winners || winners.length === 0) {
      return [];
    }

    const compMap = new Map(competitions.map((c) => [c.key, { label: c.label, note: c.note }]));
    const honoursByComp = new Map<
      string,
      {
        source?: string | null;
        seasons: Array<{ season: string; seasonEndYear: number; note?: string | null }>;
      }
    >();

    for (const w of winners) {
      if (!honoursByComp.has(w.competitionKey)) {
        honoursByComp.set(w.competitionKey, {
          source: w.source,
          seasons: [],
        });
      }
      const entry = honoursByComp.get(w.competitionKey)!;
      if (!entry.source && w.source) entry.source = w.source;
      entry.seasons.push({
        season: w.season,
        seasonEndYear: w.seasonEndYear,
        note: w.note,
      });
    }

    // Helper to format source update date (e.g. "updated 2026-06-18" -> "18 Jun 2026")
    const extractDate = (src?: string | null) => {
      if (!src) return "18 Jun 2026";
      const match = src.match(/updated\s+(\d{4})-(\d{2})-(\d{2})/i);
      if (match) {
        const [, y, m, d] = match;
        const dateObj = new Date(`${y}-${m}-${d}`);
        return dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      }
      return "18 Jun 2026";
    };

    // Sort order: domestic leagues (premier-league, la-liga, bundesliga), then champions-league, then others
    const priority = ["premier-league", "la-liga", "bundesliga", "champions-league"];
    const result: ClubHonourCompetition[] = [];

    for (const [compKey, data] of honoursByComp.entries()) {
      if (data.seasons.length > 0) {
        const compMeta = compMap.get(compKey);
        result.push({
          key: compKey,
          label: compMeta?.label || compKey,
          note: compMeta?.note || null,
          titles: data.seasons.length,
          source: data.source,
          updatedDate: extractDate(data.source),
          seasons: data.seasons.sort((a, b) => b.seasonEndYear - a.seasonEndYear),
        });
      }
    }

    result.sort((a, b) => {
      const idxA = priority.indexOf(a.key);
      const idxB = priority.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.titles - a.titles;
    });

    return result;
  } catch (err) {
    console.error(`[Data Layer] Error fetching honours for club ${clubName} (${clubId}):`, err);
    return [];
  }
}

/**
 * Fetch real historical squad valuation snapshots for a club.
 * Phase 15: Valuation history, comparison, and club value trends.
 */
export async function getClubSnapshots(clubId: string) {
  if (!clubId) return [];
  try {
    const { data, error } = await supabase
      .from("ClubValueSnapshot")
      .select("id, date, totalMarketValue, squadSize")
      .eq("clubId", clubId)
      .order("date", { ascending: true });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}


