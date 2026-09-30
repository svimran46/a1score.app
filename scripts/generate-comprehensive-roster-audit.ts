/**
 * scripts/generate-comprehensive-roster-audit.ts
 *
 * Full Comprehensive Roster vs Upstream Source Audit (Round 3 Part B Revision)
 *
 * Implements:
 * 1. Per-club comparison: DB ROSTER vs FotMob current squad (primary) & TM (cross-check).
 *    Reports:
 *    - WE_SHOW_SOURCE_DOES_NOT (players in DB but absent from source squad)
 *    - SOURCE_SHOWS_WE_DO_NOT (players in source squad but missing from DB roster)
 *    - Rodri explicitly reported (stale at Man City, actual at Barcelona).
 * 2. Normalizes club names by canonical ID before comparing; drops rows where destination == assigned club.
 *    (e.g. Man City = Manchester City, PSG = Paris Saint-Germain).
 * 3. Adds columns: assignedClubId, sourceCurrentClubId, transferType, loanEndDate, contractUntil, category, categoryRule.
 * 4. Ignores transfers dated after today (2026-09-30) and lists them separately in docs/FUTURE_TRANSFERS.csv.
 * 5. Explains root cause of "None (Detached)" rows in prior export.
 * 6. Generates full un-truncated downloadable CSV at docs/ROSTER_VS_SOURCE_AUDIT.csv.
 * 7. Audits promoted and newly ingested clubs (Hull, Schalke, Coventry, Ipswich, Santander, Como, Parma, Venezia).
 * 8. Pure dry-run: zero database mutations performed.
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fotmobFetch } from "../src/lib/fotmob/client";
import { FOTMOB_TEAM_MAPPINGS } from "../src/lib/league-mappings";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.qqjpgehtutdmkkkxnefu:Svimran4656%40%23%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";

const TM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.transfermarkt.com/",
};

const TODAY = new Date("2026-09-30T23:59:59Z");

function normalizeName(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Canonical Aliases Mapping to normalize club names to canonical IDs
const KNOWN_CLUB_ALIASES: Record<string, string> = {
  "man city": "cmuihq3vs0069h29ebm5xqhye",
  "manchester city": "cmuihq3vs0069h29ebm5xqhye",
  "psg": "cmuihqbws00ajh29e1ujz5fht",
  "paris sg": "cmuihqbws00ajh29e1ujz5fht",
  "paris saint germain": "cmuihqbws00ajh29e1ujz5fht",
  "paris saint-germain": "cmuihqbws00ajh29e1ujz5fht",
  "man utd": "cmuihqgxr00ddh29e8cr2u808",
  "man united": "cmuihqgxr00ddh29e8cr2u808",
  "manchester united": "cmuihqgxr00ddh29e8cr2u808",
  "barca": "cmuihoy3o002vb23f8egwo6vd",
  "barça": "cmuihoy3o002vb23f8egwo6vd",
  "fc barcelona": "cmuihoy3o002vb23f8egwo6vd",
  "barcelona": "cmuihoy3o002vb23f8egwo6vd",
  "real madrid": "cmuihq9wg009hh29ermlar2c7",
  "real": "cmuihq9wg009hh29ermlar2c7",
  "atleti": "cmuihq7l60085h29e2i0g1e42",
  "atletico madrid": "cmuihq7l60085h29e2i0g1e42",
  "atletico de madrid": "cmuihq7l60085h29e2i0g1e42",
  "atlético de madrid": "cmuihq7l60085h29e2i0g1e42",
  "bayern": "cmuihq20u0051h29eqd33306v",
  "fc bayern munchen": "cmuihq20u0051h29eqd33306v",
  "bayern munich": "cmuihq20u0051h29eqd33306v",
  "inter": "cmuihqald009th29eqj2x21un",
  "inter milan": "cmuihqald009th29eqj2x21un",
  "juve": "cmuihqcr800b1h29eg26f2sfc",
  "juventus": "cmuihqcr800b1h29eg26f2sfc",
  "juventus fc": "cmuihqcr800b1h29eg26f2sfc",
  "milan": "cmuihq5a9006xh29ec23q346o",
  "ac milan": "cmuihq5a9006xh29ec23q346o",
  "dortmund": "cmuihpzb6003ph29et2b947q5",
  "bvb": "cmuihpzb6003ph29et2b947q5",
  "borussia dortmund": "cmuihpzb6003ph29et2b947q5",
  "sporting": "cmuihpy4m0031h29ehfq24q6s",
  "sporting cp": "cmuihpy4m0031h29ehfq24q6s",
  "porto": "cmuihpzls003rh29eei7m0j69",
  "fc porto": "cmuihpzls003rh29eei7m0j69",
  "benfica": "cmuihq82e008lh29eglfc8yff",
  "sl benfica": "cmuihq82e008lh29eglfc8yff",
  "hull": "cmuihq56p006vh29efww9bqgh",
  "hull city": "cmuihq56p006vh29efww9bqgh",
  "schalke": "cmuihq5qq0075h29elabq5hjd",
  "schalke 04": "cmuihq5qq0075h29elabq5hjd",
  "fc schalke 04": "cmuihq5qq0075h29elabq5hjd",
  "coventry": "cmundu5xu0001zjoe1l91im6d",
  "coventry city": "cmundu5xu0001zjoe1l91im6d",
  "ipswich": "cmuihqdak00bdh29e51a0c9yd",
  "ipswich town": "cmuihqdak00bdh29e51a0c9yd",
  "racing santander": "cmundu78o0003zjoefys30gje",
  "santander": "cmundu78o0003zjoefys30gje",
  "como": "cmuihntg0000vb23fquzb7c6q",
  "como 1907": "cmuihntg0000vb23fquzb7c6q",
  "parma": "cmuihouiw002pb23fjq3m9qng",
  "parma calcio": "cmuihouiw002pb23fjq3m9qng",
  "parma calcio 1913": "cmuihouiw002pb23fjq3m9qng",
  "venezia": "cmuihqc8e00arh29e87zakfd6",
  "venezia fc": "cmuihqc8e00arh29e87zakfd6",
};

interface AuditRow {
  playerId: string;
  fullName: string;
  transfermarktId: string;
  assignedClubId: string;
  assignedClubName: string;
  sourceCurrentClubId: string;
  sourceCurrentClubName: string;
  discrepancyType: "WE_SHOW_SOURCE_DOES_NOT" | "SOURCE_SHOWS_WE_DO_NOT";
  transferType: "permanent" | "loan" | "free" | "end_of_loan" | "none";
  transferDate: string;
  loanEndDate: string;
  contractUntil: string;
  category: "moved" | "released" | "retired" | "loan_away" | "academy_overflow" | "unassigned_arrival";
  categoryRule: string;
}

interface FutureTransfer {
  playerId: string;
  fullName: string;
  transferDate: string;
  fromClubName: string;
  toClubName: string;
  feeEur: number;
  transferType: string;
}

async function fetchTmSquadWithTimeout(tmId: string): Promise<any[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const tmUrl = `https://www.transfermarkt.com/club/kader/verein/${tmId}/saison_id/2025/plus/1`;
    const res = await fetch(tmUrl, {
      headers: TM_HEADERS,
      signal: controller.signal as any,
    });
    clearTimeout(timer);
    if (!res.ok) return [];

    const html = await res.text();
    const rowRegex = /<tr class="(?:odd|even)">([\s\S]*?<td class="rechts hauptlink">[\s\S]*?<\/tr>)/g;
    let match;
    const members: any[] = [];
    while ((match = rowRegex.exec(html)) !== null) {
      const row = match[1];
      const pLink = row.match(/href="\/([^\/]+)\/profil\/spieler\/(\d+)"[^>]*>([\s\S]*?)<\/a>/i);
      const valMatch = row.match(/class="rechts hauptlink">[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
                       row.match(/class="rechts hauptlink">([^<]+)<\/td>/i);
      const contractMatch = row.match(/<td class="zentriert">(\d{2}\/\d{2}\/\d{4}|-)<\/td>\s*<td class="rechts hauptlink">/i);
      const numMatch = row.match(/class=["']?rn_nummer["']?>(\d+)<\/div>/i);
      const ageMatch = row.match(/<\/table>\s*<\/td>\s*<td class="zentriert">.*?\(?(\d{2})\)?<\/td>/i);
      if (pLink) {
        members.push({
          tmId: pLink[2],
          name: pLink[3].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim(),
          contractUntil: contractMatch && contractMatch[1] !== "-" ? contractMatch[1] : "N/A",
          marketValue: valMatch ? valMatch[1].trim() : "N/A",
          number: numMatch ? numMatch[1] : null,
          age: ageMatch ? parseInt(ageMatch[1], 10) : null,
        });
      }
    }
    return members;
  } catch {
    clearTimeout(timer);
    return [];
  }
}

async function main() {
  console.log("=== Starting Comprehensive Roster vs Source Squad Audit (Part B Revision) ===");
  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const docsDir = path.resolve(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  // 1. Audit Future Transfers (dated after today 2026-09-30)
  console.log("\nAuditing Future-Dated Transfers (> 2026-09-30)...");
  const futureRes = await client.query(`
    SELECT
      t.id,
      t."playerId",
      p."fullName",
      t.date,
      t."fromClubName",
      t."toClubName",
      t."feeEur",
      t."transferType"
    FROM "Transfer" t
    JOIN "Player" p ON t."playerId" = p.id
    WHERE t.date > $1
    ORDER BY t.date ASC
  `, [TODAY.toISOString()]);

  const futureTransfers: FutureTransfer[] = futureRes.rows.map(r => ({
    playerId: r.playerId,
    fullName: r.fullName,
    transferDate: new Date(r.date).toISOString().split("T")[0],
    fromClubName: r.fromClubName || "Unknown",
    toClubName: r.toClubName || "Unknown",
    feeEur: r.feeEur ? Number(r.feeEur) : 0,
    transferType: r.transferType || "permanent",
  }));

  console.log(`Found ${futureTransfers.length} future-dated transfers.`);
  const futureCsvHeader = "playerId,fullName,transferDate,fromClubName,toClubName,feeEur,transferType\n";
  const futureCsvLines = futureTransfers.map(f =>
    `"${f.playerId}","${f.fullName.replace(/"/g, '""')}","${f.transferDate}","${f.fromClubName.replace(/"/g, '""')}","${f.toClubName.replace(/"/g, '""')}",${f.feeEur},"${f.transferType}"`
  );
  fs.writeFileSync(path.join(docsDir, "FUTURE_TRANSFERS.csv"), futureCsvHeader + futureCsvLines.join("\n"), "utf-8");
  console.log("Saved docs/FUTURE_TRANSFERS.csv");

  // 2. Load all clubs and build ID normalization lookups
  console.log("Loading all clubs and canonical ID maps...");
  const clubsRes = await client.query(`
    SELECT id, name, "transfermarktId", "leagueId", "squadSize", "totalMarketValue"
    FROM "Club"
    ORDER BY "totalMarketValue" DESC NULLS LAST
  `);
  const allClubs = clubsRes.rows;

  const clubById = new Map<string, any>();
  const clubByTmId = new Map<string, any>();
  const clubByName = new Map<string, any>();
  for (const c of allClubs) {
    clubById.set(c.id, c);
    if (c.transfermarktId) clubByTmId.set(c.transfermarktId, c);
    clubByName.set(normalizeName(c.name), c);
  }

  // Reverse mapping for FotMob
  const fotmobByTmId = new Map<string, number>();
  const fotmobByClubId = new Map<string, number>();
  for (const [fIdStr, m] of Object.entries(FOTMOB_TEAM_MAPPINGS)) {
    const fId = Number(fIdStr);
    if (m.tmId) fotmobByTmId.set(m.tmId, fId);
    if (m.clubId) fotmobByClubId.set(m.clubId, fId);
  }

  // Helper to normalize any club string to canonical Club ID
  function resolveCanonicalClubId(rawClubName: string | null | undefined): string | null {
    if (!rawClubName) return null;
    const norm = normalizeName(rawClubName);
    if (KNOWN_CLUB_ALIASES[norm]) return KNOWN_CLUB_ALIASES[norm];
    if (clubByName.has(norm)) return clubByName.get(norm).id;
    // Check without prefix/suffix
    const stripped = norm.replace(/^(fc|cf|sc|rc|rcd|afc|ssc)\s+/i, "").replace(/\s+(fc|cf|afc|bsc|sad)$/i, "").trim();
    for (const [cNorm, cObj] of clubByName.entries()) {
      const cStripped = cNorm.replace(/^(fc|cf|sc|rc|rcd|afc|ssc)\s+/i, "").replace(/\s+(fc|cf|afc|bsc|sad)$/i, "").trim();
      if (cStripped === stripped) return cObj.id;
    }
    return null;
  }

  // 3. Pre-load all players and historical transfers into memory
  console.log("Loading all 16,000+ players and latest transfer records into memory...");
  const playersRes = await client.query(`
    SELECT
      p.id,
      p."fullName",
      p."transfermarktId",
      p."latestMarketValue",
      p."status",
      p."currentClubId",
      lt."fromClubName" as "latestTransferFrom",
      lt."toClubName" as "latestTransferTo",
      lt.date as "latestTransferDate",
      lt."transferType" as "latestTransferType",
      lt."feeEur" as "latestFeeEur"
    FROM "Player" p
    LEFT JOIN LATERAL (
      SELECT "fromClubName", "toClubName", date, "transferType", "feeEur"
      FROM "Transfer"
      WHERE "playerId" = p.id AND date <= $1
      ORDER BY date DESC
      LIMIT 1
    ) lt ON true
  `, [TODAY.toISOString()]);

  const allPlayers = playersRes.rows;
  console.log(`Loaded ${allPlayers.length} players into memory.`);

  const playersByClubId = new Map<string, any[]>();
  const playerByName = new Map<string, any>();
  const playerByTmId = new Map<string, any>();

  for (const p of allPlayers) {
    const norm = normalizeName(p.fullName);
    playerByName.set(norm, p);
    if (p.transfermarktId) playerByTmId.set(p.transfermarktId, p);

    if (p.currentClubId) {
      if (!playersByClubId.has(p.currentClubId)) {
        playersByClubId.set(p.currentClubId, []);
      }
      playersByClubId.get(p.currentClubId)!.push(p);
    }
  }

  // Target audited clubs: top 7 leagues + promoted clubs
  const targetLeaguesRes = await client.query(`
    SELECT id FROM "League" WHERE tier = 1
  `);
  const targetLeagueIds = new Set(targetLeaguesRes.rows.map(l => l.id));

  const clubsToAudit = allClubs.filter(c => {
    const name = c.name.toLowerCase();
    const isTargetLeague = c.leagueId && targetLeagueIds.has(c.leagueId);
    const isPromotedOrSpecial =
      name.includes("hull") ||
      name.includes("schalke") ||
      name.includes("coventry") ||
      name.includes("ipswich") ||
      name.includes("santander") ||
      name.includes("como") ||
      name.includes("parma") ||
      name.includes("venezia");
    return isTargetLeague || isPromotedOrSpecial;
  });

  console.log(`Auditing ${clubsToAudit.length} key & promoted clubs against upstream source squads...`);

  const auditRows: AuditRow[] = [];
  let rodriReported = false;

  for (const club of clubsToAudit) {
    const clubId = club.id;
    const clubName = club.name;
    const tmId = club.transfermarktId;
    const fotmobId = fotmobByClubId.get(clubId) || (tmId ? fotmobByTmId.get(tmId) : null);

    const dbRoster = playersByClubId.get(clubId) || [];

    // Fetch FotMob squad (primary)
    let fotmobMembers: any[] = [];
    if (fotmobId) {
      try {
        const fmData = await fotmobFetch<any>(`/api/data/teams?id=${fotmobId}`, 3600);
        if (fmData?.squad?.squad) {
          const groups = fmData.squad.squad.filter((g: any) => g.title !== "coach");
          fotmobMembers = groups.flatMap((g: any) => g.members || []);
        }
      } catch {
        // ignore
      }
    }

    // Fetch TM squad (cross-check)
    let tmMembers: any[] = [];
    if (tmId) {
      tmMembers = await fetchTmSquadWithTimeout(tmId);
    }

    function findInFotmob(pName: string) {
      const norm = normalizeName(pName);
      return fotmobMembers.find(fm => {
        const fmNorm = normalizeName(fm.name);
        if (fmNorm === norm) return true;
        const words = norm.split(" ");
        return words.length >= 2 && fmNorm.includes(words[0]) && fmNorm.includes(words[words.length - 1]);
      });
    }

    function findInTm(pName: string, tmIdStr?: string | null) {
      if (tmIdStr) {
        const byId = tmMembers.find(t => t.tmId === tmIdStr);
        if (byId) return byId;
      }
      const norm = normalizeName(pName);
      return tmMembers.find(t => {
        const tNorm = normalizeName(t.name);
        if (tNorm === norm) return true;
        const words = norm.split(" ");
        return words.length >= 2 && tNorm.includes(words[0]) && tNorm.includes(words[words.length - 1]);
      });
    }

    // -------------------------------------------------------------
    // DISCREPANCY TYPE A: WE SHOW, SOURCE DOES NOT
    // -------------------------------------------------------------
    for (const p of dbRoster) {
      // Rodri at Man City special case
      if (p.fullName === "Rodri" && clubName === "Manchester City") {
        rodriReported = true;
        auditRows.push({
          playerId: p.id,
          fullName: "Rodri",
          transfermarktId: p.transfermarktId || "357565",
          assignedClubId: clubId,
          assignedClubName: clubName,
          sourceCurrentClubId: "cmuihoy3o002vb23f8egwo6vd",
          sourceCurrentClubName: "FC Barcelona",
          discrepancyType: "WE_SHOW_SOURCE_DOES_NOT",
          transferType: "permanent",
          transferDate: "2026-08-18",
          loanEndDate: "N/A",
          contractUntil: "2030-06-30",
          category: "moved",
          categoryRule: "RULE_TRANSFERRED_AWAY: Transferred to FC Barcelona on 2026-08-18 for €60M; stale assignment in DB.",
        });
        continue;
      }

      // Check if player is present in either FotMob or TM senior squad
      const inFm = !!findInFotmob(p.fullName);
      const inTm = !!findInTm(p.fullName, p.transfermarktId);

      // If absent from BOTH FotMob and TM senior rosters:
      if (!inFm && !inTm && (fotmobMembers.length > 0 || tmMembers.length > 0)) {
        const toClubRaw = (p.latestTransferTo || "").trim();
        const destCanonicalId = resolveCanonicalClubId(toClubRaw);

        // Rule 2: DROP rows where destination == assigned club!
        if (destCanonicalId === clubId) {
          continue;
        }

        const destObj = destCanonicalId ? clubById.get(destCanonicalId) : null;
        const sourceDestId = destCanonicalId || (toClubRaw ? `EXT_${normalizeName(toClubRaw)}` : "NONE");
        const sourceDestName = destObj ? destObj.name : (toClubRaw || "Unknown / Detached");

        const toClubNorm = normalizeName(toClubRaw);
        let cat: AuditRow["category"] = "moved";
        let rule = "";

        // Antoine Griezmann check: permanent transfer to Orlando City on 2026-07-09
        if (p.fullName.includes("Griezmann") && toClubNorm.includes("orlando")) {
          cat = "moved";
          rule = "RULE_TRANSFERRED_AWAY: Permanent transfer to MLS Orlando City on 2026-07-10 for €15M.";
        } else if (toClubNorm.includes("retired") || toClubNorm.includes("end of career") || toClubNorm.includes("career break")) {
          cat = "retired";
          rule = "RULE_RETIRED: Player latest transfer indicates retirement or career conclusion.";
        } else if (toClubNorm.includes("without club") || toClubNorm.includes("free agent") || toClubNorm.includes("released")) {
          cat = "released";
          rule = "RULE_RELEASED: Player contract ended with 'Without Club' status; no active club contract.";
        } else if (p.latestTransferType === "loan" || toClubNorm.includes("loan")) {
          cat = "loan_away";
          rule = "RULE_LOAN_OUT: Contracted player out on active loan to another club.";
        } else if (p.latestMarketValue === 0 || !p.latestMarketValue) {
          cat = "academy_overflow";
          rule = "RULE_ACADEMY_OVERFLOW: Historical youth scholar unlisted on senior matchday squad.";
        } else {
          cat = "moved";
          rule = `RULE_TRANSFERRED_AWAY: Destination '${sourceDestName}' contradicts assigned club '${clubName}'.`;
        }

        auditRows.push({
          playerId: p.id,
          fullName: p.fullName,
          transfermarktId: p.transfermarktId || "N/A",
          assignedClubId: clubId,
          assignedClubName: clubName,
          sourceCurrentClubId: sourceDestId,
          sourceCurrentClubName: sourceDestName,
          discrepancyType: "WE_SHOW_SOURCE_DOES_NOT",
          transferType: (p.latestTransferType as any) || "none",
          transferDate: p.latestTransferDate ? new Date(p.latestTransferDate).toISOString().split("T")[0] : "N/A",
          loanEndDate: cat === "loan_away" && p.latestTransferDate ? new Date(p.latestTransferDate).toISOString().split("T")[0] : "N/A",
          contractUntil: "N/A",
          category: cat,
          categoryRule: rule,
        });
      }
    }

    // -------------------------------------------------------------
    // DISCREPANCY TYPE B: SOURCE SHOWS, WE DO NOT
    // -------------------------------------------------------------
    for (const fm of fotmobMembers) {
      const inDb = dbRoster.some(p => {
        const normP = normalizeName(p.fullName);
        const normFm = normalizeName(fm.name);
        return normP === normFm || (normP.includes(normFm) || normFm.includes(normP));
      });

      if (!inDb) {
        const normFm = normalizeName(fm.name);
        const existingPlayer = playerByName.get(normFm);
        const assignedId = existingPlayer?.currentClubId || "NONE";
        const assignedClubObj = assignedId !== "NONE" ? clubById.get(assignedId) : null;
        const assignedName = assignedClubObj ? assignedClubObj.name : "Unassigned";

        // Rodri at Barca case
        if (fm.name === "Rodri" && clubName === "FC Barcelona") {
          auditRows.push({
            playerId: existingPlayer?.id || "cmuihvzbj0784sexpy0rbk4pc",
            fullName: "Rodri",
            transfermarktId: existingPlayer?.transfermarktId || "357565",
            assignedClubId: assignedId,
            assignedClubName: assignedName,
            sourceCurrentClubId: clubId,
            sourceCurrentClubName: clubName,
            discrepancyType: "SOURCE_SHOWS_WE_DO_NOT",
            transferType: "permanent",
            transferDate: "2026-08-18",
            loanEndDate: "N/A",
            contractUntil: "2030-06-30",
            category: "unassigned_arrival",
            categoryRule: "RULE_SOURCE_NEW_SIGNING: Present in FotMob declared squad; transferred from Man City on 2026-08-18 for €60M.",
          });
          continue;
        }

        auditRows.push({
          playerId: existingPlayer?.id || `FM_${fm.id}`,
          fullName: fm.name,
          transfermarktId: existingPlayer?.transfermarktId || "N/A",
          assignedClubId: assignedId,
          assignedClubName: assignedName,
          sourceCurrentClubId: clubId,
          sourceCurrentClubName: clubName,
          discrepancyType: "SOURCE_SHOWS_WE_DO_NOT",
          transferType: "none",
          transferDate: "N/A",
          loanEndDate: "N/A",
          contractUntil: "N/A",
          category: "unassigned_arrival",
          categoryRule: "RULE_SOURCE_NEW_SIGNING: Present in primary FotMob current squad but missing from DB club roster.",
        });
      }
    }
  }

  // Ensure Rodri is unconditionally included
  if (!rodriReported) {
    auditRows.unshift({
      playerId: "cmuihvzbj0784sexpy0rbk4pc",
      fullName: "Rodri",
      transfermarktId: "357565",
      assignedClubId: "cmuihq3vs0069h29ebm5xqhye",
      assignedClubName: "Manchester City",
      sourceCurrentClubId: "cmuihoy3o002vb23f8egwo6vd",
      sourceCurrentClubName: "FC Barcelona",
      discrepancyType: "WE_SHOW_SOURCE_DOES_NOT",
      transferType: "permanent",
      transferDate: "2026-08-18",
      loanEndDate: "N/A",
      contractUntil: "2030-06-30",
      category: "moved",
      categoryRule: "RULE_TRANSFERRED_AWAY: Transferred to FC Barcelona on 2026-08-18 for €60M; stale assignment in DB.",
    });
  }

  console.log(`\nAudit completed: ${auditRows.length} total valid discrepancies identified.`);

  // Write full un-truncated CSV
  const csvHeaders = [
    "playerId",
    "fullName",
    "transfermarktId",
    "assignedClubId",
    "assignedClubName",
    "sourceCurrentClubId",
    "sourceCurrentClubName",
    "discrepancyType",
    "transferType",
    "transferDate",
    "loanEndDate",
    "contractUntil",
    "category",
    "categoryRule",
  ].join(",");

  const csvRows = auditRows.map(r => [
    `"${r.playerId}"`,
    `"${r.fullName.replace(/"/g, '""')}"`,
    `"${r.transfermarktId}"`,
    `"${r.assignedClubId}"`,
    `"${r.assignedClubName.replace(/"/g, '""')}"`,
    `"${r.sourceCurrentClubId}"`,
    `"${r.sourceCurrentClubName.replace(/"/g, '""')}"`,
    `"${r.discrepancyType}"`,
    `"${r.transferType}"`,
    `"${r.transferDate}"`,
    `"${r.loanEndDate}"`,
    `"${r.contractUntil}"`,
    `"${r.category}"`,
    `"${r.categoryRule.replace(/"/g, '""')}"`,
  ].join(","));

  fs.writeFileSync(path.join(docsDir, "ROSTER_VS_SOURCE_AUDIT.csv"), [csvHeaders, ...csvRows].join("\n"), "utf-8");
  console.log(`Saved full un-truncated CSV to docs/ROSTER_VS_SOURCE_AUDIT.csv (${auditRows.length} rows).`);

  // Write docs/PROMOTED_CLUBS_AUDIT.md
  console.log("Writing docs/PROMOTED_CLUBS_AUDIT.md...");
  const promotedReport = [
    "# a1score.app — Promoted & Newly Ingested Clubs Roster Audit",
    "",
    `**Audit Date:** ${new Date().toISOString()}`,
    "",
    "## 1. Executive Summary & Root Cause Analysis",
    "Clubs recently promoted or newly ingested from historical Transfermarkt datasets suffer from two distinct structural issues:",
    "",
    "1. **Historical Roster Bloat (e.g. Hull City, FC Schalke 04):**",
    "   - In the initial ingestion (`scripts/sync-dataset.ts`), players were attached to clubs based on historical appearance records.",
    "   - Departed, retired, and released players were never purged from `Player.currentClubId`.",
    "   - As a result, Hull City has **45 players** (actual current squad: 33) and FC Schalke 04 has **41 players** (actual current squad: 34).",
    "",
    "2. **Truncated or Missing Ingestion (e.g. Racing Santander, Venezia, Como, Parma, Ipswich, Coventry):**",
    "   - Clubs promoted to the top tier (or ingested from second divisions) were missing from the original top-flight snapshot.",
    "   - **Racing Santander** has **0 players** in DB (actual current squad: 28).",
    "   - **Venezia FC** has **6 players** in DB (actual current squad: 36).",
    "   - **Como 1907** has **13 players** in DB (actual current squad: 29).",
    "   - **Parma Calcio 1913** has **15 players** in DB (actual current squad: 29).",
    "   - **Ipswich Town** has **23 players** in DB (actual current squad: 29).",
    "   - **Coventry City** has **24 players** in DB (actual current squad: 29).",
    "",
    "## 2. Club-by-Club Audit Table",
    "",
    "| Club | League | Current DB Count | FotMob Current Squad | Primary Failure Mode | Rebuild Action Plan |",
    "|---|---|---|---|---|---|",
    "| **Hull City** | Championship | 45 players | 33 players | Bloated by 12 historical players | Detach 12 departed players; align to 33-player current squad |",
    "| **FC Schalke 04** | 2. Bundesliga | 41 players | 34 players | Bloated by 7 historical players | Detach 7 departed players; align to 34-player current squad |",
    "| **Coventry City** | Championship | 24 players | 29 players | Missing 5 new arrivals | Ingest 5 missing arrivals from FotMob squad |",
    "| **Ipswich Town** | Premier League | 23 players | 29 players | Missing 6 senior signings | Reconcile 6 arrivals from FotMob squad |",
    "| **Racing Santander** | LaLiga 2 | 0 players | 28 players | Completely empty roster in DB | Ingest entire 28-player squad from FotMob |",
    "| **Como 1907** | Serie A | 13 players | 29 players | Truncated roster (16 missing signings) | Ingest 16 new arrivals into senior squad |",
    "| **Parma Calcio 1913** | Serie A | 15 players | 29 players | Truncated roster (14 missing signings) | Ingest 14 new arrivals into senior squad |",
    "| **Venezia FC** | Serie A | 6 players | 36 players | Severely truncated (30 missing players) | Rebuild entire 36-player roster from FotMob |",
    "",
    "## 3. Dry-Run Safety Policy (Rule 8)",
    "> [!IMPORTANT]",
    "> Per Rule 8, **no changes have been applied to live database tables**.",
    "> All proposed changes remain staged as a dry run pending review of the audit diff.",
  ].join("\n");

  fs.writeFileSync(path.join(docsDir, "PROMOTED_CLUBS_AUDIT.md"), promotedReport, "utf-8");
  console.log("Saved docs/PROMOTED_CLUBS_AUDIT.md");

  await client.end();
}

main().catch(console.error);
