/**
 * src/lib/transfermarkt/client.ts
 *
 * High-Performance Direct Live Proxy for Transfermarkt
 * Fetches real-time, up-to-date football intelligence directly from Transfermarkt
 * using Edge-compatible fetch with Next.js revalidation caching.
 */

import { sanitizeImageUrl } from "@/lib/image-sanitize";
import {
  validateTmMarketValueGraph,
  validateTmTransferHistory,
} from "@/lib/validation/upstream-shapes";

const TM_BASE = "https://www.transfermarkt.com";

const TM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.transfermarkt.com/",
};

export function parseEurValue(str: string | null | undefined): number {
  if (!str) return 0;
  const m = str.match(/([\d\.,]+)\s*(bn|b|m|k|th\.)?/i);
  if (!m) return 0;
  const num = parseFloat(m[1].replace(/,/g, "."));
  if (isNaN(num)) return 0;
  const unit = (m[2] || "").toLowerCase();
  if (unit === "bn" || unit === "b") {
    return Math.round(num * 1_000_000_000);
  }
  if (unit === "m") {
    return Math.round(num * 1_000_000);
  }
  if (unit === "k" || unit === "th.") {
    return Math.round(num * 1_000);
  }
  return Math.round(num);
}

async function tmFetch(path: string, isJson = false, revalidate = 3600): Promise<any | null> {
  const url = path.startsWith("http") ? path : `${TM_BASE}${path}`;

  // Retry once on failure or timeout (2 attempts total)
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500); // 1.5s max edge timeout

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          ...TM_HEADERS,
          Accept: isJson
            ? "application/json"
            : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
        next: { revalidate },
      } as any);

      clearTimeout(timer);

      if (!res.ok) {
        if (attempt === 1 && (res.status === 429 || res.status >= 500)) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        console.warn(`[TM Proxy] ${url} returned status ${res.status}`);
        return null;
      }

      if (isJson) {
        return await res.json();
      }
      return await res.text();
    } catch (err: any) {
      clearTimeout(timer);
      if (attempt === 1) {
        // Retry once after brief pause
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }
      console.warn(`[TM Proxy Error] Failed fetching ${url} (attempts exhausted):`, err.message || err);
      return null;
    }
  }

  return null;
}

import { getCanonicalPosition } from "@/lib/positions";

/**
 * Fetch top most valuable players worldwide directly from Transfermarkt ranking table
 */
export async function tmGetMostValuablePlayers(limit = 25, positionFilter?: string) {
  try {
    const totalPages = Math.min(Math.ceil(limit / 25), 4);
    const pagesToFetch = Array.from({ length: totalPages }, (_, i) => i + 1);
    const players: any[] = [];
    const seenIds = new Set<string>();

    for (const pageNum of pagesToFetch) {
      const pagePath =
        pageNum === 1
          ? "/spieler-statistik/wertvollstespieler/marktwertetop"
          : `/spieler-statistik/wertvollstespieler/marktwertetop?page=${pageNum}`;

      const html = await tmFetch(pagePath, false, 3600);
      if (!html) continue;

      const rowRegex = /<tr class="(?:odd|even)">([\s\S]*?<td class="rechts hauptlink">[\s\S]*?<\/tr>)/g;
      let match;

      while ((match = rowRegex.exec(html)) !== null && players.length < limit) {
        const row = match[1];
        const rankMatch = row.match(/^[\s\S]*?<td class="zentriert">(\d+)<\/td>/i);
        const playerLink = row.match(/href="\/([^\/]+)\/profil\/spieler\/(\d+)"[^>]*>([^<]+)<\/a>/i);
        const valueMatch =
          row.match(/class="rechts hauptlink">[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
          row.match(/class="rechts hauptlink">([^<]+)<\/td>/i);
        const clubIdMatch = row.match(/href="\/[^\/]+\/startseite\/verein\/(\d+)"/i);
        const clubNameMatch =
          row.match(/title="([^"]+)"[^>]*href="\/[^\/]+\/startseite\/verein/i) ||
          row.match(/href="\/[^\/]+\/startseite\/verein\/[^"]*"[^>]*title="([^"]+)"/i);
        const photoMatch =
          row.match(/<img[^>]*data-src="([^"]+)"[^>]*class="[^"]*bilderrahmen/i) ||
          row.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*bilderrahmen/i);
        const posMatch = row.match(/<tr><td>([^<]+)<\/td><\/tr><\/table>/i);
        const ageMatch = row.match(/<\/table><\/td><td class="zentriert">(\d+)<\/td>/i);
        const natRegex = /<img[^>]*class="flaggenrahmen"[^>]*title="([^"]+)"|<img[^>]*title="([^"]+)"[^>]*class="flaggenrahmen"/gi;
        const nats: string[] = [];
        let nMatch;
        while ((nMatch = natRegex.exec(row)) !== null) {
          const val = (nMatch[1] || nMatch[2])?.trim();
          if (val && !nats.includes(val)) nats.push(val);
        }

        if (playerLink && !seenIds.has(playerLink[2])) {
          const pId = playerLink[2];
          seenIds.add(pId);
          const valStr = valueMatch ? valueMatch[1].trim() : "";
          const valEur = parseEurValue(valStr);
          const rawPos = posMatch ? posMatch[1].trim() : "Unknown";
          const canonical = getCanonicalPosition(rawPos);
          const clubName = clubNameMatch ? clubNameMatch[1].trim() : "Unknown";
          const clubId = clubIdMatch ? clubIdMatch[1] : null;
          const rank = rankMatch ? parseInt(rankMatch[1], 10) : players.length + 1;
          const age = ageMatch ? parseInt(ageMatch[1], 10) : null;

          if (
            positionFilter &&
            !rawPos.toLowerCase().includes(positionFilter.toLowerCase()) &&
            canonical.group !== positionFilter.toUpperCase()
          ) {
            continue;
          }

          players.push({
            id: pId,
            sourceId: pId,
            rank,
            fullName: playerLink[3].trim(),
            commonName: playerLink[3].trim(),
            position: canonical.detailed,
            subPosition: null,
            positionGroup: canonical.group,
            age,
            photoUrl: photoMatch ? sanitizeImageUrl(photoMatch[1].replace("small", "medium"), "player", pId) : null,
            nationality: nats,
            dateOfBirth: null,
            latestMarketValue: valEur,
            currentClub: {
              id: clubId || "unknown",
              transfermarktId: clubId,
              name: clubName,
              logoUrl: clubId
                ? sanitizeImageUrl(`https://img.a.transfermarkt.technology/wappen/tiny/${clubId}.png`, "club", clubId)
                : null,
              league: null,
            },
            marketValues: [
              {
                valueEur: valEur,
                date: new Date().toISOString(),
              },
            ],
          });

          if (players.length >= limit) break;
        }
      }
    }

    return players.length > 0 ? players : null;
  } catch (err) {
    console.error("[TM Proxy] Error in tmGetMostValuablePlayers:", err);
    return null;
  }
}

/**
 * Fetch full player profile, valuation timeline, and transfer history
 */
export async function tmGetPlayer(slugOrId: string) {
  try {
    let pId = "";
    const numMatch = slugOrId.match(/\d+$/);
    if (numMatch) {
      pId = numMatch[0];
    } else {
      // Search to resolve ID
      const searchRes = await tmSearchPlayers(slugOrId, { limit: 1 });
      if (searchRes && searchRes.length > 0) {
        pId = searchRes[0].id;
      } else {
        return null;
      }
    }

    // Parallel fetch: HTML profile + CEAPI market values graph + CEAPI transfers
    const [html, rawMvData, rawTransferData] = await Promise.all([
      tmFetch(`/spieler/profil/spieler/${pId}`, false, 3600),
      tmFetch(`/ceapi/marketValueDevelopment/graph/${pId}`, true, 3600),
      tmFetch(`/ceapi/transferHistory/list/${pId}`, true, 3600),
    ]);

    let mvData = rawMvData;
    if (rawMvData) {
      const val = validateTmMarketValueGraph(rawMvData, `/ceapi/marketValueDevelopment/graph/${pId}`);
      if (!val.success) {
        console.warn(`[TM Schema Drift] Market value graph drifted for player ${pId}: ${val.error}`);
        if (!rawMvData || typeof rawMvData !== "object" || !Array.isArray(rawMvData.list)) {
          mvData = null;
        }
      }
    }

    let transferData = rawTransferData;
    if (rawTransferData) {
      const val = validateTmTransferHistory(rawTransferData, `/ceapi/transferHistory/list/${pId}`);
      if (!val.success) {
        console.warn(`[TM Schema Drift] Transfer history drifted for player ${pId}: ${val.error}`);
        if (!rawTransferData || typeof rawTransferData !== "object" || !Array.isArray(rawTransferData.transfers)) {
          transferData = null;
        }
      }
    }

    if (!html && !mvData) return null;

    // 1. Extract Biographical Details from HTML or fallback to Meta
    let fullName = slugOrId;
    let photoUrl: string | null = null;
    let currentClubName = "Unknown";
    let currentClubId: string | null = null;
    let position = "Unknown";
    let subPosition: string | null = null;
    let dateOfBirth: Date | null = null;
    let nationalities: string[] = [];
    let heightCm: number | null = null;
    let preferredFoot: string | null = null;
    let leagueInfo: any = null;

    if (html) {
      // Name
      const h1Match = html.match(/<h1 class="data-header__headline-wrapper"[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match) {
        fullName = h1Match[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/#\d+/, "")
          .replace(/\s+/g, " ")
          .trim();
      }

      // Club
      const clubAnchor =
        html.match(/class="data-header__club"[^>]*>[\s\S]*?<a[^>]*href="\/[^\/]+\/startseite\/verein\/(\d+)"[^>]*>([^<]+)<\/a>/i);
      if (clubAnchor) {
        currentClubId = clubAnchor[1];
        currentClubName = clubAnchor[2].trim();
      }

      // League
      const leagueAnchor = html.match(/class="data-header__league"[^>]*>[\s\S]*?<a[^>]*href="\/[^\/]+\/startseite\/wettbewerb\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (leagueAnchor) {
        leagueInfo = {
          id: leagueAnchor[1],
          name: leagueAnchor[2].replace(/<[^>]+>/g, "").trim(),
        };
      }

      // Photo
      const photoMatch =
        html.match(/<div class="data-header__profile-container">[\s\S]*?<img[^>]*src="([^"]+)"/i) ||
        html.match(/class="data-header__profile-image"[^>]*src="([^"]+)"/i);
      if (photoMatch) {
        photoUrl = photoMatch[1].replace("header", "medium").replace("small", "medium");
      }

      // Position
      const mainPosMatch = html.match(/Main position:[\s\S]*?<dd class="detail-position__position">([^<]+)<\/dd>/i);
      if (mainPosMatch) position = mainPosMatch[1].trim();

      const otherPosMatch = html.match(/Other position:[\s\S]*?<dd class="detail-position__position">([^<]+)<\/dd>/i);
      if (otherPosMatch) subPosition = otherPosMatch[1].trim();

      // DOB
      const dobMatch = html.match(/Date of birth\/Age:[\s\S]*?<span itemprop="birthDate"[^>]*>([^<]+)<\/span>/i);
      if (dobMatch) {
        const rawDate = dobMatch[1].split("(")[0].trim();
        const parts = rawDate.split("/");
        if (parts.length === 3) {
          dateOfBirth = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }

      // Nationality
      const natMatch = html.match(/Citizenship:[\s\S]*?<span itemprop="nationality"[^>]*>([\s\S]*?)<\/span>/i);
      if (natMatch) {
        const cText = natMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (cText) {
          nationalities = cText.split(/\s{2,}/).map((s: string) => s.trim()).filter(Boolean);
        }
      }

      // Foot
      const footMatch = html.match(/Foot:<\/span>\s*<span class="info-table__content[^"]*--bold">([^<]+)<\/span>/i);
      if (footMatch) preferredFoot = footMatch[1].trim();

      // Height
      const heightMatch = html.match(/Height:[\s\S]*?<span itemprop="height"[^>]*>([^<]+)<\/span>/i);
      if (heightMatch) {
        const hMatch = heightMatch[1].match(/(\d+)[,\.](\d+)\s*m/i);
        if (hMatch) {
          heightCm = parseInt(hMatch[1], 10) * 100 + parseInt(hMatch[2], 10);
        }
      }
    }

    // 2. Map Market Value History safely
    const marketValues: any[] = [];
    if (mvData && Array.isArray(mvData.list)) {
      for (const item of mvData.list) {
        if (!item) continue;
        const d = new Date(item.x);
        if (isNaN(d.getTime())) continue; // Skip invalid date points
        const val = Number(item.y);
        if (isNaN(val)) continue;

        marketValues.push({
          id: `tm-val-${pId}-${item.x}`,
          playerId: pId,
          date: d.toISOString(),
          valueEur: val,
          clubName: item.verein || null,
        });
      }
    }

    // Latest valuation
    const latestValuation =
      marketValues.length > 0 ? marketValues[marketValues.length - 1].valueEur : 0;

    // 3. Map Transfers safely
    const transfers: any[] = [];
    if (transferData && Array.isArray(transferData.transfers)) {
      for (let i = 0; i < transferData.transfers.length; i++) {
        const t = transferData.transfers[i];
        if (!t) continue;
        const dateStr = t.dateUnformatted || t.date;
        let d = dateStr ? new Date(dateStr) : null;
        if (!d || isNaN(d.getTime())) {
          d = new Date();
        }
        const feeVal = parseEurValue(t.fee);

        transfers.push({
          id: `tm-tf-${pId}-${i}`,
          playerId: pId,
          date: d.toISOString(),
          fromClubName: t.from?.clubName || null,
          toClubName: t.to?.clubName || null,
          feeEur: feeVal > 0 ? feeVal : null,
          transferType: t.fee?.toLowerCase()?.includes("loan")
            ? "loan"
            : feeVal === 0
            ? "free"
            : "permanent",
        });
      }
    }

    // Validate that profile was actually parsed and has meaningful data
    if ((fullName === slugOrId && marketValues.length === 0) || (latestValuation === 0 && marketValues.length === 0)) {
      console.warn(`[TM Proxy] Incomplete profile/valuation for ${slugOrId}, falling back to DB`);
      return null;
    }

    // Validate DOB
    const safeDob = dateOfBirth && !isNaN(dateOfBirth.getTime()) ? dateOfBirth : null;

    return {
      id: pId,
      sourceId: pId,
      fullName: fullName || "Player Profile",
      commonName: fullName || "Player Profile",
      dateOfBirth: safeDob,
      nationality: Array.isArray(nationalities) ? nationalities : [],
      position: position || "Unknown",
      subPosition,
      preferredFoot,
      heightCm,
      photoUrl: sanitizeImageUrl(photoUrl, "player", pId),
      currentClubId,
      currentClub: currentClubName
        ? {
            id: currentClubId || "unknown",
            name: currentClubName,
            logoUrl: currentClubId
              ? sanitizeImageUrl(null, "club", currentClubId)
              : null,
            league: leagueInfo,
          }
        : null,
      marketValues,
      transfers,
      seasonStats: [] as any[],
      injuries: [] as any[],
      latestMarketValue: latestValuation,
    };
  } catch (err) {
    console.error(`[TM Proxy] Error fetching player ${slugOrId}:`, err);
    return null;
  }
}

/**
 * Search players live on Transfermarkt
 */
export async function tmSearchPlayers(
  query: string,
  options: { limit?: number; position?: string } = {}
) {
  try {
    const { limit = 20, position } = options;
    const html = await tmFetch(
      `/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(query)}`,
      false,
      1800
    );
    if (!html) return [];

    const rowRegex = /<tr class="(?:odd|even)">([\s\S]*?)<\/tr>/g;
    let match;
    const results: any[] = [];

    while ((match = rowRegex.exec(html)) !== null && results.length < 50) {
      const row = match[1];
      const playerLink = row.match(/href="\/([^\/]+)\/profil\/spieler\/(\d+)"[^>]*>([^<]+)<\/a>/i);
      const clubMatch = row.match(/href="\/[^\/]+\/startseite\/verein\/(\d+)" title="([^"]+)"/i);
      const photoMatch = row.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*bilderrahmen[^"]*"/i);
      const posMatch = row.match(/<td class="zentriert">([A-Z]{1,3})<\/td>/i);
      const valueMatch = row.match(/<td class="rechts hauptlink">([^<]+)<\/td>/i);

      if (playerLink) {
        const pId = playerLink[2];
        const valStr = valueMatch ? valueMatch[1].trim() : "";
        const valEur = parseEurValue(valStr);
        const pos = posMatch ? posMatch[1].trim() : "Unknown";

        if (position && !pos.toLowerCase().includes(position.toLowerCase())) {
          continue;
        }

        results.push({
          id: pId,
          sourceId: pId,
          fullName: playerLink[3].trim(),
          commonName: playerLink[3].trim(),
          position: pos,
          subPosition: null,
          photoUrl: photoMatch ? sanitizeImageUrl(photoMatch[1].replace("small", "medium"), "player") : null,
          currentClub: clubMatch
            ? {
                id: clubMatch[1],
                name: clubMatch[2].trim(),
                logoUrl: sanitizeImageUrl(`https://img.a.transfermarkt.technology/wappen/tiny/${clubMatch[1]}.png`, "club", clubMatch[1]),
              }
            : null,
          latestMarketValue: valEur,
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  } catch (err) {
    console.error("[TM Proxy] Error searching players:", err);
    return [];
  }
}

/**
 * Fetch club squad and current total valuation from Transfermarkt
 */
export async function tmGetClub(clubId: string) {
  try {
    const html = await tmFetch(`/verein/kader/verein/${clubId}/plus/1`, false, 3600);
    if (!html) return null;

    // Club Name
    const nameMatch =
      html.match(/<h1 class="data-header__headline-wrapper"[^>]*>([\s\S]*?)<\/h1>/i) ||
      html.match(/<meta property="og:title" content="([^"]+)"/i);
    const rawName = nameMatch
      ? nameMatch[1].replace(/<[^>]+>/g, "").replace(/Overview|Squad/i, "").trim()
      : "Club";
    const clubName = rawName.replace(/-?\s*Detailed\s*\d+\/\d+/i, "").replace(/-?\s*\d+\/\d+/i, "").trim();

    // Club Logo
    const logoUrl = sanitizeImageUrl(`https://img.a.transfermarkt.technology/wappen/head/${clubId}.png`, "club", clubId);

    // Total Market Value
    const totalValMatch = html.match(/class="data-header__market-value-wrapper"[^>]*>([\s\S]*?)<\/div>/i);
    let totalSquadValue = 0;
    if (totalValMatch) {
      const raw = totalValMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      totalSquadValue = parseEurValue(raw);
    }

    // Squad Roster
    const rowRegex = /<tr class="(?:odd|even)">([\s\S]*?<td class="rechts hauptlink">[\s\S]*?<\/tr>)/g;
    let match;
    const players: any[] = [];

    while ((match = rowRegex.exec(html)) !== null) {
      const row = match[1];
      const playerLink = row.match(/href="\/([^\/]+)\/profil\/spieler\/(\d+)"[^>]*>([\s\S]*?)<\/a>/i);
      const injuryMatch = row.match(/class="verletzt-table[^"]*"[^>]*title="([^"]+)"|title="([^"]+)"[^>]*class="verletzt-table/i);
      const valueMatch =
        row.match(/class="rechts hauptlink">[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
        row.match(/class="rechts hauptlink">([^<]+)<\/td>/i);
      const posMatch =
        row.match(/<tr>\s*<td>\s*([^<]+)\s*<\/td>\s*<\/tr>\s*<\/table>/i) ||
        row.match(/title="(Goalkeeper|Centre-Back|Left-Back|Right-Back|Defensive Midfield|Central Midfield|Attacking Midfield|Left Winger|Right Winger|Second Striker|Centre-Forward)"/i);
      const numMatch = row.match(/class=["']?rn_nummer["']?>(\d+)<\/div>/i);
      const photoMatch =
        row.match(/data-src="([^"]+)"/i) ||
        row.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*bilderrahmen/i);
      const ageMatch = row.match(/<\/table>\s*<\/td>\s*<td class="zentriert">.*?\(?(\d{2})\)?<\/td>/i);
      const dobMatch = row.match(/<td class="zentriert">(\d{2}\/\d{2}\/\d{4})\s*\(\d+\)<\/td>/i);
      const contractMatch = row.match(/<td class="zentriert">(\d{2}\/\d{2}\/\d{4}|-)<\/td>\s*<td class="rechts hauptlink">/i);
      const natRegex = /<img[^>]*class="flaggenrahmen"[^>]*title="([^"]+)"|<img[^>]*title="([^"]+)"[^>]*class="flaggenrahmen"/gi;
      const nats: string[] = [];
      let nMatch;
      while ((nMatch = natRegex.exec(row)) !== null) {
        const val = (nMatch[1] || nMatch[2])?.trim();
        if (val && !nats.includes(val)) nats.push(val);
      }

      if (playerLink && !players.some((p) => p.id === playerLink[2])) {
        const valStr = valueMatch ? valueMatch[1].trim() : "";
        const valEur = parseEurValue(valStr);
        const rawPos = posMatch ? posMatch[1].trim() : "Unknown";
        const canonical = getCanonicalPosition(rawPos);
        const age = ageMatch ? parseInt(ageMatch[1], 10) : null;
        const contractUntil = contractMatch && contractMatch[1] !== "-" ? contractMatch[1] : null;
        const tier = (valEur > 0 || (age !== null && age >= 20)) ? "first_team" : "academy";

        const cleanFullName = playerLink[3].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
        const injury = injuryMatch ? (injuryMatch[1] || injuryMatch[2])?.trim() : null;

        players.push({
          id: playerLink[2],
          sourceId: playerLink[2],
          fullName: cleanFullName,
          commonName: cleanFullName,
          number: numMatch ? parseInt(numMatch[1], 10) : null,
          position: canonical.detailed,
          positionGroup: canonical.group,
          subPosition: null,
          age,
          dateOfBirth: dobMatch ? dobMatch[1] : null,
          contractUntil,
          injury,
          tier,
          nationality: nats,
          photoUrl: photoMatch ? sanitizeImageUrl(photoMatch[1].replace("small", "medium"), "player", playerLink[2]) : null,
          latestMarketValue: valEur,
          marketValues: [
            {
              valueEur: valEur,
              date: new Date().toISOString(),
            },
          ],
        });
      }
    }

    const firstTeamPlayers = players.filter((p) => p.tier === "first_team");
    if (firstTeamPlayers.length > 40) {
      console.warn(`[Sanity Guard] Club ${clubName} (${clubId}) first-team roster exceeds 40 players (${firstTeamPlayers.length}).`);
    }

    // If total squad value wasn't found in header, sum up first team players
    if (totalSquadValue === 0 && players.length > 0) {
      totalSquadValue = firstTeamPlayers.reduce((sum, p) => sum + (p.latestMarketValue || 0), 0);
    }

    return {
      id: clubId,
      sourceId: clubId,
      name: clubName,
      logoUrl,
      country: null,
      league: null,
      totalSquadValue,
      totalMarketValue: totalSquadValue,
      players: players.sort((a, b) => b.latestMarketValue - a.latestMarketValue),
    };
  } catch (err) {
    console.error(`[TM Proxy] Error fetching club ${clubId}:`, err);
    return null;
  }
}
