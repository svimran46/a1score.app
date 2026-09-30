import { supabase } from "@/lib/supabase";
import {
  getLeagueStandings,
  FotmobStandingsRow,
  OFFICIAL_LEAGUE_CLUB_COUNTS,
} from "@/lib/fotmob/client";
import { sanitizeImageUrl } from "@/lib/image-sanitize";
import { FOTMOB_TEAM_MAPPINGS } from "@/lib/league-mappings";

export async function getLeagues() {
  try {
    const { data: leagues, error } = await supabase
      .from("League")
      .select(`
        id,
        name,
        country,
        tier,
        logoUrl,
        transfermarktId,
        clubCount,
        totalPlayers,
        totalMarketValue
      `)
      .order("totalMarketValue", { ascending: false });

    if (error || !leagues) {
      console.error("Error fetching leagues:", error);
      return [];
    }

    return leagues
      .filter((l) => l.transfermarktId !== "CL" || Number(l.totalMarketValue) > 0)
      .map((league) => {
        const officialClubCount =
          (league.transfermarktId && OFFICIAL_LEAGUE_CLUB_COUNTS[league.transfermarktId]) ||
          league.clubCount ||
          20;
        const totalMarketValue = league.totalMarketValue ? Number(league.totalMarketValue) : 0;
        const avgSquadValue = officialClubCount > 0 ? Math.round(totalMarketValue / officialClubCount) : 0;

        return {
          id: league.id,
          name: league.name,
          country: league.country,
          tier: league.tier || 1,
          logoUrl: sanitizeImageUrl(league.logoUrl, "league", league.id),
          clubCount: officialClubCount,
          totalPlayers: league.totalPlayers ?? 0,
          totalMarketValue,
          avgSquadValue,
        };
      });
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return [];
  }
}

export const LEAGUE_ALIAS_MAP: Record<string, { cuid: string; tmId: string }> = {
  // Premier League
  "premier-league": { cuid: "cmuihndux0003b23fizizm4a0", tmId: "GB1" },
  "premierleague": { cuid: "cmuihndux0003b23fizizm4a0", tmId: "GB1" },
  "epl": { cuid: "cmuihndux0003b23fizizm4a0", tmId: "GB1" },
  "gb1": { cuid: "cmuihndux0003b23fizizm4a0", tmId: "GB1" },
  // LaLiga
  "laliga": { cuid: "cmuihncv70001b23frvqgzdp6", tmId: "ES1" },
  "la-liga": { cuid: "cmuihncv70001b23frvqgzdp6", tmId: "ES1" },
  "es1": { cuid: "cmuihncv70001b23frvqgzdp6", tmId: "ES1" },
  "cmuihnet00007b23f2qf4z79i": { cuid: "cmuihncv70001b23frvqgzdp6", tmId: "ES1" },
  // Serie A
  "serie-a": { cuid: "cmuihnegb0004b23fhslrse6b", tmId: "IT1" },
  "seriea": { cuid: "cmuihnegb0004b23fhslrse6b", tmId: "IT1" },
  "it1": { cuid: "cmuihnegb0004b23fhslrse6b", tmId: "IT1" },
  "cmuihnf000008b23fghk99r1h": { cuid: "cmuihnegb0004b23fhslrse6b", tmId: "IT1" },
  // Bundesliga
  "bundesliga": { cuid: "cmuihneym0005b23fkpqbo0uj", tmId: "L1" },
  "l1": { cuid: "cmuihneym0005b23fkpqbo0uj", tmId: "L1" },
  "cmuihnfps0009b23fe6s9s949": { cuid: "cmuihneym0005b23fkpqbo0uj", tmId: "L1" },
  // Ligue 1
  "ligue-1": { cuid: "cmuihnddf0002b23fskdzdx29", tmId: "FR1" },
  "ligue1": { cuid: "cmuihnddf0002b23fskdzdx29", tmId: "FR1" },
  "fr1": { cuid: "cmuihnddf0002b23fskdzdx29", tmId: "FR1" },
  "cmuihnggh000ab23ftw5z9a34": { cuid: "cmuihnddf0002b23fskdzdx29", tmId: "FR1" },
  // Liga Portugal
  "liga-portugal": { cuid: "cmuihnfy10007b23f3j6km8jo", tmId: "PO1" },
  "ligaportugal": { cuid: "cmuihnfy10007b23f3j6km8jo", tmId: "PO1" },
  "primeira-liga": { cuid: "cmuihnfy10007b23f3j6km8jo", tmId: "PO1" },
  "po1": { cuid: "cmuihnfy10007b23f3j6km8jo", tmId: "PO1" },
  "cmuihnh71000bb23f7w76a380": { cuid: "cmuihnfy10007b23f3j6km8jo", tmId: "PO1" },
  // Eredivisie
  "eredivisie": { cuid: "cmuihnffm0006b23feq78bq1b", tmId: "NL1" },
  "nl1": { cuid: "cmuihnffm0006b23feq78bq1b", tmId: "NL1" },
  "cmuihnhvo000cb23f1m06d5s7": { cuid: "cmuihnffm0006b23feq78bq1b", tmId: "NL1" },
  // Champions League
  "champions-league": { cuid: "cmuihncd80000b23f6khust90", tmId: "CL" },
  "ucl": { cuid: "cmuihncd80000b23f6khust90", tmId: "CL" },
  "cl": { cuid: "cmuihncd80000b23f6khust90", tmId: "CL" },
};

export async function getLeagueById(idOrSlug: string) {
  try {
    const raw = (idOrSlug || "").trim();
    const rawLower = raw.toLowerCase().replace(/\s+/g, "-");
    const cuidMatch = raw.match(/c[a-z0-9]{24}/i);
    const rawCuid = cuidMatch ? cuidMatch[0] : null;

    // Check alias map for legacy CUIDs, short aliases, or prefix matching
    const aliasKey = Object.keys(LEAGUE_ALIAS_MAP).find(
      (k) =>
        k === rawLower ||
        (rawCuid && k === rawCuid.toLowerCase()) ||
        rawLower.startsWith(`${k}-`) ||
        rawLower === k.replace(/-/g, "")
    );

    const aliasTarget = aliasKey ? LEAGUE_ALIAS_MAP[aliasKey] : null;
    const effectiveCuid = aliasTarget ? aliasTarget.cuid : rawCuid;
    const effectiveTmId = aliasTarget ? aliasTarget.tmId : raw.toUpperCase();

    let query = supabase
      .from("League")
      .select(`
        id,
        name,
        country,
        tier,
        logoUrl,
        transfermarktId,
        totalMarketValue,
        totalPlayers,
        clubCount,
        clubs:Club (
          id,
          name,
          logoUrl,
          country,
          squadSize,
          totalMarketValue,
          lastSeason,
          transfermarktId
        )
      `);

    if (effectiveCuid) {
      query = query.or(`id.eq.${effectiveCuid},transfermarktId.eq.${effectiveTmId},transfermarktId.eq.${raw}`);
    } else {
      query = query.or(`id.eq.${raw},transfermarktId.eq.${effectiveTmId},transfermarktId.eq.${raw}`);
    }

    let { data: league, error } = await query.maybeSingle();

    // Fallback: search by name ilike if not yet matched
    if (!league && rawLower.length >= 3) {
      const cleanTerm = rawLower.replace(/-/g, " ");
      const { data: fallbackLeague } = await supabase
        .from("League")
        .select(`
          id,
          name,
          country,
          tier,
          logoUrl,
          transfermarktId,
          totalMarketValue,
          totalPlayers,
          clubCount,
          clubs:Club (
            id,
            name,
            logoUrl,
            country,
            squadSize,
            totalMarketValue,
            lastSeason,
            transfermarktId
          )
        `)
        .ilike("name", `%${cleanTerm}%`)
        .limit(1)
        .maybeSingle();

      if (fallbackLeague) {
        league = fallbackLeague;
      }
    }

    if (error || !league) {
      console.error(`Error fetching league ${idOrSlug}:`, error);
      return null;
    }

    // 1. Fetch official standings from FotMob
    let fotmobData: Awaited<ReturnType<typeof getLeagueStandings>> = null;

    try {
      fotmobData = await getLeagueStandings(league.transfermarktId);
    } catch (e) {
      console.warn(`[Data Layer] FotMob standings fetch failed for league ${league.name}:`, e);
    }

    // 2. Fetch global clubs for fallback/promoted club resolution
    let allClubs = league.clubs || [];
    try {
      const { data: globalClubs } = await supabase
        .from("Club")
        .select("id, name, logoUrl, country, squadSize, totalMarketValue, lastSeason, transfermarktId");
      if (globalClubs && globalClubs.length > 0) {
        allClubs = globalClubs;
      }
    } catch (e) {
      console.warn("Could not fetch global clubs for league enrichment:", e);
    }

    // 3. Derive each league's club list and standings directly from the current season standings
    const enrichedStandings = (fotmobData?.standings || []).map((row) => {
      let matched: any = null;

      // Check explicit mapping table
      if (FOTMOB_TEAM_MAPPINGS[row.id]) {
        const target = FOTMOB_TEAM_MAPPINGS[row.id];
        matched = allClubs.find(
          (c: any) =>
            (target.tmId && c.transfermarktId === target.tmId) ||
            (target.name && c.name.toLowerCase() === target.name.toLowerCase())
        );
      }

      // Check fuzzy name matching if not resolved
      if (!matched) {
        const cleanT = row.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanShort = (row.shortName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        matched = allClubs.find((c: any) => {
          const cleanC = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          return (
            cleanC === cleanT ||
            cleanC.includes(cleanT) ||
            cleanT.includes(cleanC) ||
            (cleanShort && (cleanC.includes(cleanShort) || cleanShort.includes(cleanC)))
          );
        });
      }

      const squadValue = matched?.totalMarketValue ? Number(matched.totalMarketValue) : 0;
      const squadSize = matched?.squadSize || 25;
      const clubId = matched?.id || null;
      const canonicalName = matched?.name || row.name;

      return {
        ...row,
        name: canonicalName,
        shortName: row.shortName || canonicalName.replace(/ FC$| AFC$/, ""),
        clubId,
        totalSquadValue: squadValue,
        squadSize,
        imageUrl: matched?.logoUrl
          ? sanitizeImageUrl(matched.logoUrl, "club", matched.id)
          : sanitizeImageUrl(row.imageUrl, "club"),
      };
    });

    // 4. Derive active ranked clubs directly from current season standings
    const derivedClubs = enrichedStandings
      .filter((s) => s.clubId !== null)
      .map((s) => {
        const dbC = allClubs.find((c: any) => c.id === s.clubId);
        return {
          id: s.clubId!,
          name: dbC?.name || s.name,
          logoUrl: s.imageUrl,
          country: dbC?.country || league.country,
          squadSize: s.squadSize || 25,
          totalSquadValue: s.totalSquadValue,
          lastSeason: 2026,
        };
      })
      .sort((a, b) => b.totalSquadValue - a.totalSquadValue);

    const officialCount = enrichedStandings.length > 0 ? enrichedStandings.length : league.clubCount || 0;
    const computedTotalValue = derivedClubs.reduce((sum, c) => sum + c.totalSquadValue, 0);
    const computedTotalPlayers = derivedClubs.reduce((sum, c) => sum + c.squadSize, 0);

    // 5. Fetch quick-switch navigation for other European leagues
    let otherLeagues: Array<{ id: string; name: string; country: string; logoUrl: string | null }> = [];
    try {
      const { data: allLeaguesList } = await supabase
        .from("League")
        .select("id, name, country, logoUrl, transfermarktId, totalMarketValue")
        .order("totalMarketValue", { ascending: false });

      if (allLeaguesList) {
        otherLeagues = allLeaguesList
          .filter((l) => l.id !== league.id && l.transfermarktId !== "CL" && Number(l.totalMarketValue) > 0)
          .slice(0, 6)
          .map((l) => ({
            id: l.id,
            name: l.name,
            country: l.country,
            logoUrl: sanitizeImageUrl(l.logoUrl, "league", l.id),
          }));
      }
    } catch {
      // non-critical fallback
    }

    return {
      id: league.id,
      name: league.name,
      country: league.country,
      tier: league.tier,
      logoUrl: sanitizeImageUrl(league.logoUrl, "league", league.id),
      transfermarktId: league.transfermarktId,
      totalMarketValue: computedTotalValue > 0 ? computedTotalValue : Number(league.totalMarketValue || 0),
      totalPlayers: computedTotalPlayers > 0 ? computedTotalPlayers : league.totalPlayers ?? 0,
      clubCount: officialCount,
      clubs: derivedClubs,
      standings: enrichedStandings,
      legend: fotmobData?.legend || [],
      topScorers: fotmobData?.topScorers || [],
      topAssists: fotmobData?.topAssists || [],
      allAvailableSeasons: fotmobData?.allAvailableSeasons || [],
      otherLeagues,
      season: fotmobData?.season || "2026/2027",
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching league ${idOrSlug}:`, error);
    return null;
  }
}
