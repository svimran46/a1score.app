/**
 * scripts/audit-epl-read-only.ts
 *
 * Fresh, READ-ONLY audit of the 20 current Premier League clubs (2026-27).
 * Strictly SELECT queries only - ZERO mutations or writes to the database.
 *
 * Rules:
 * 1. Match players by transfermarktId first. If no ID, match by normalised name AND date of birth.
 *    Never match by name alone. If > 1 DB record fits, or only name fits, put in MANUAL REVIEW.
 * 2. Classify: MATCH, ATTACH, REASSIGN, DETACH, CREATE, CONFLICT.
 * 3. Duplicate check across whole database for EPL players: same TM ID, same name+DoB, or same name at same club.
 * 4. Sanity checks: flag position or DoB differences.
 * 5. Re-verify Arsenal & Manchester City against 2026-09-30 applied state & detached Rodri #1.
 * 6. Outputs:
 *    - audit_epl_summary.csv
 *    - audit_epl_changes.csv
 *    - audit_epl_manual_review.csv
 *    - audit_epl_duplicates.csv
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import { prisma } from "../src/lib/prisma";
import { fotmobFetch } from "../src/lib/fotmob/client";

const TM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.transfermarkt.com/",
};

export const EPL_CLUBS = [
  { name: "Arsenal FC", id: "cmuiho5do001hb23froc57owj", fmId: 9825, tmId: "11" },
  { name: "Aston Villa", id: "cmuihq8vi008xh29edz4vg4xw", fmId: 10252, tmId: "405" },
  { name: "AFC Bournemouth", id: "cmuihqh6y00dfh29eokvzxktp", fmId: 8678, tmId: "989" },
  { name: "Brentford FC", id: "cmuihocpq001vb23fu3cm5yh8", fmId: 9937, tmId: "1148" },
  { name: "Brighton & Hove Albion", id: "cmuihomne002bb23fq0sdhdrm", fmId: 10204, tmId: "1237" },
  { name: "Chelsea FC", id: "cmuihqcpo00b1h29edf8q9ksb", fmId: 8455, tmId: "631" },
  { name: "Coventry City", id: "cmundu5xu0001zjoe1l91im6d", fmId: 8669, tmId: "990" },
  { name: "Crystal Palace", id: "cmuihqfqr00cqh29e2077zt3y", fmId: 9826, tmId: "873" },
  { name: "Everton FC", id: "cmuihq4bo006fh29ef9sfod5p", fmId: 8668, tmId: "29" },
  { name: "Fulham FC", id: "cmuihqg9600cxh29echnkyx9e", fmId: 9879, tmId: "931" },
  { name: "Hull City", id: "cmuihq56p006vh29efww9bqgh", fmId: 8667, tmId: "3008" },
  { name: "Ipswich Town", id: "cmuihqdak00bdh29e51a0c9yd", fmId: 9902, tmId: "677" },
  { name: "Leeds United", id: "cmuihq8hv008ph29ejwdrv7xd", fmId: 8463, tmId: "399" },
  { name: "Liverpool FC", id: "cmuihq5k0006zh29erp4cykkk", fmId: 8650, tmId: "31" },
  { name: "Manchester City", id: "cmuihq3vs0069h29ebm5xqhye", fmId: 8456, tmId: "281" },
  { name: "Manchester United", id: "cmuihqgxr00ddh29e8cr2u808", fmId: 10260, tmId: "985" },
  { name: "Newcastle United", id: "cmuihqepp00c5h29e6dizfj3r", fmId: 10261, tmId: "762" },
  { name: "Nottingham Forest", id: "cmuihqdq000bkh29et7iwzrfd", fmId: 10203, tmId: "703" },
  { name: "Sunderland AFC", id: "cmuihq47i006bh29e3kejf8oh", fmId: 8472, tmId: "289" },
  { name: "Tottenham Hotspur", id: "cmuihpzs8003vh29eyrxt8nk5", fmId: 8586, tmId: "148" },
];

export function normalizeName(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Robust date formatting that correctly handles timezones:
 * If date is stored at 16:00 UTC (originating from midnight GMT+8 import),
 * adds 8 hours so that 16:00 UTC yields the true calendar birthday.
 */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())) {
    return d.trim();
  }
  try {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "";
    // Compensate for UTC+8 midnight stored as 16:00 UTC previous day
    const adjusted = new Date(dateObj.getTime() + 8 * 3600 * 1000);
    return adjusted.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function mapFotmobRoleToPosition(roleKey: string | null | undefined): string {
  const r = (roleKey || "").toLowerCase();
  if (r.includes("keeper") || r === "gk") return "Goalkeeper";
  if (r.includes("defen") || r === "cb" || r === "lb" || r === "rb") return "Defender";
  if (r.includes("midfield") || r === "cm" || r === "dm" || r === "am") return "Midfield";
  if (r.includes("attack") || r.includes("forward") || r === "cf" || r === "rw" || r === "lw" || r === "st") return "Attack";
  return "Midfield";
}

export async function fetchTmSquadWithTimeout(tmClubId: string): Promise<any[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const tmUrl = `https://www.transfermarkt.com/club/kader/verein/${tmClubId}/saison_id/2025/plus/1`;
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
      const valMatch =
        row.match(/class="rechts hauptlink">[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
        row.match(/class="rechts hauptlink">([^<]+)<\/td>/i);
      const numMatch = row.match(/class=["']?rn_nummer["']?>(\d+)<\/div>/i);
      const ageMatch = row.match(/<\/table>\s*<\/td>\s*<td class="zentriert">.*?\(?(\d{2})\)?<\/td>/i);
      const posMatch = row.match(/<td>(Goalkeeper|Defender|Centre-Back|Left-Back|Right-Back|Midfield|Central Midfield|Defensive Midfield|Attacking Midfield|Attack|Centre-Forward|Left Winger|Right Winger|Second Striker)<\/td>/i);
      if (pLink) {
        members.push({
          tmId: pLink[2],
          name: pLink[3].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim(),
          marketValue: valMatch ? valMatch[1].trim() : "N/A",
          number: numMatch ? numMatch[1] : null,
          age: ageMatch ? parseInt(ageMatch[1], 10) : null,
          pos: posMatch ? posMatch[1] : null,
        });
      }
    }
    return members;
  } catch {
    clearTimeout(timer);
    return [];
  }
}

async function runAudit() {
  console.log("==================================================================");
  console.log("=== FRESH READ-ONLY AUDIT: 20 PREMIER LEAGUE CLUBS (2026-27) ===");
  console.log("==================================================================");

  // Load all clubs from database
  const dbClubs = await prisma.club.findMany();
  const dbClubMap = new Map<string, any>(dbClubs.map((c) => [c.id, c]));

  // Load all players from database (read-only)
  console.log("Loading all database players into memory (read-only)...");
  const allDbPlayers = await prisma.player.findMany({
    select: {
      id: true,
      fullName: true,
      commonName: true,
      position: true,
      subPosition: true,
      dateOfBirth: true,
      transfermarktId: true,
      status: true,
      latestMarketValue: true,
      currentClubId: true,
    },
  });
  console.log(`Loaded ${allDbPlayers.length} total players from database.`);

  // Indexes for fast lookup
  const dbPlayersById = new Map<string, any>(allDbPlayers.map((p) => [p.id, p]));
  const dbPlayersByTmId = new Map<string, any[]>();
  const dbPlayersByNormName = new Map<string, any[]>();

  for (const p of allDbPlayers) {
    if (p.transfermarktId && p.transfermarktId !== "N/A" && p.transfermarktId.trim() !== "") {
      if (!dbPlayersByTmId.has(p.transfermarktId)) dbPlayersByTmId.set(p.transfermarktId, []);
      dbPlayersByTmId.get(p.transfermarktId)!.push(p);
    }
    const norm = normalizeName(p.fullName);
    if (!dbPlayersByNormName.has(norm)) dbPlayersByNormName.set(norm, []);
    dbPlayersByNormName.get(norm)!.push(p);
  }

  // -----------------------------------------------------------------
  // 3. DUPLICATE CHECKS ACROSS WHOLE DATABASE FOR EPL PLAYERS
  // -----------------------------------------------------------------
  console.log("\nRunning duplicate checks across database for Premier League players...");
  const duplicatesList: any[] = [];
  const eplClubIds = new Set(EPL_CLUBS.map((c) => c.id));

  // Check 1: Same Transfermarkt ID on multiple records
  for (const [tmId, players] of dbPlayersByTmId.entries()) {
    if (players.length > 1) {
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const p1 = players[i];
          const p2 = players[j];
          duplicatesList.push({
            duplicateType: "SAME_TM_ID",
            identifierOrKey: tmId,
            player1Id: p1.id,
            player1Name: p1.fullName,
            player1Club: p1.currentClubId ? dbClubMap.get(p1.currentClubId)?.name || p1.currentClubId : "Unassigned",
            player1DoB: formatDate(p1.dateOfBirth),
            player1TmId: p1.transfermarktId,
            player2Id: p2.id,
            player2Name: p2.fullName,
            player2Club: p2.currentClubId ? dbClubMap.get(p2.currentClubId)?.name || p2.currentClubId : "Unassigned",
            player2DoB: formatDate(p2.dateOfBirth),
            player2TmId: p2.transfermarktId,
            details: `Multiple players share Transfermarkt ID ${tmId}`,
          });
        }
      }
    }
  }

  // Check 2: Same Normalized Name + Date of Birth on multiple records
  const byNameAndDob = new Map<string, any[]>();
  for (const p of allDbPlayers) {
    if (!p.dateOfBirth) continue;
    const key = `${normalizeName(p.fullName)}|${formatDate(p.dateOfBirth)}`;
    if (!byNameAndDob.has(key)) byNameAndDob.set(key, []);
    byNameAndDob.get(key)!.push(p);
  }
  for (const [key, players] of byNameAndDob.entries()) {
    if (players.length > 1) {
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const p1 = players[i];
          const p2 = players[j];
          duplicatesList.push({
            duplicateType: "SAME_NAME_AND_DOB",
            identifierOrKey: key,
            player1Id: p1.id,
            player1Name: p1.fullName,
            player1Club: p1.currentClubId ? dbClubMap.get(p1.currentClubId)?.name || p1.currentClubId : "Unassigned",
            player1DoB: formatDate(p1.dateOfBirth),
            player1TmId: p1.transfermarktId || "",
            player2Id: p2.id,
            player2Name: p2.fullName,
            player2Club: p2.currentClubId ? dbClubMap.get(p2.currentClubId)?.name || p2.currentClubId : "Unassigned",
            player2DoB: formatDate(p2.dateOfBirth),
            player2TmId: p2.transfermarktId || "",
            details: `Multiple records share identical name and date of birth (${formatDate(p1.dateOfBirth)})`,
          });
        }
      }
    }
  }

  // Check 3: Same Name at the Same Club
  const byClubAndName = new Map<string, any[]>();
  for (const p of allDbPlayers) {
    if (!p.currentClubId || !eplClubIds.has(p.currentClubId)) continue;
    const key = `${p.currentClubId}|${normalizeName(p.fullName)}`;
    if (!byClubAndName.has(key)) byClubAndName.set(key, []);
    byClubAndName.get(key)!.push(p);
  }
  for (const [key, players] of byClubAndName.entries()) {
    if (players.length > 1) {
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const p1 = players[i];
          const p2 = players[j];
          duplicatesList.push({
            duplicateType: "SAME_NAME_AT_SAME_CLUB",
            identifierOrKey: key,
            player1Id: p1.id,
            player1Name: p1.fullName,
            player1Club: dbClubMap.get(p1.currentClubId)?.name || p1.currentClubId,
            player1DoB: formatDate(p1.dateOfBirth),
            player1TmId: p1.transfermarktId || "",
            player2Id: p2.id,
            player2Name: p2.fullName,
            player2Club: dbClubMap.get(p2.currentClubId)?.name || p2.currentClubId,
            player2DoB: formatDate(p2.dateOfBirth),
            player2TmId: p2.transfermarktId || "",
            details: `Multiple players with the same name at ${dbClubMap.get(p1.currentClubId)?.name || p1.currentClubId}`,
          });
        }
      }
    }
  }

  console.log(`Duplicate records found: ${duplicatesList.length}`);

  // Write audit_epl_duplicates.csv
  const dupHeader = "duplicateType,identifierOrKey,player1Id,player1Name,player1Club,player1DoB,player1TmId,player2Id,player2Name,player2Club,player2DoB,player2TmId,details\n";
  const dupLines = duplicatesList.map((d) =>
    `"${d.duplicateType}","${d.identifierOrKey}","${d.player1Id}","${d.player1Name.replace(/"/g, '""')}","${d.player1Club.replace(/"/g, '""')}","${d.player1DoB}","${d.player1TmId || ""}","${d.player2Id}","${d.player2Name.replace(/"/g, '""')}","${d.player2Club.replace(/"/g, '""')}","${d.player2DoB}","${d.player2TmId || ""}","${d.details.replace(/"/g, '""')}"`
  );
  fs.writeFileSync(path.resolve(process.cwd(), "audit_epl_duplicates.csv"), dupHeader + dupLines.join("\n"), "utf-8");
  console.log("Saved audit_epl_duplicates.csv");

  // -----------------------------------------------------------------
  // 1 & 2. PER-CLUB SQUAD FETCHING & COMPARISON
  // -----------------------------------------------------------------
  console.log("\nFetching live squads and running per-club comparisons...");

  const summaryRows: any[] = [];
  const proposedChanges: any[] = [];
  const manualReviewRows: any[] = [];

  for (const club of EPL_CLUBS) {
    const clubId = club.id;
    const clubName = club.name;
    const fmId = club.fmId;
    const tmId = club.tmId;

    // A. DB Roster for this club
    const dbRoster = allDbPlayers.filter((p) => p.currentClubId === clubId);

    // B. Fetch FotMob Squad
    let fotmobMembers: any[] = [];
    try {
      const fmData = await fotmobFetch<any>(`/api/data/teams?id=${fmId}`, 0);
      const squadGroups = fmData?.squad?.squad || [];
      fotmobMembers = squadGroups
        .filter((g: any) => g.title !== "coach")
        .flatMap((g: any) => g.members || []);
    } catch (err: any) {
      console.error(`Error fetching FotMob for ${clubName}:`, err.message);
    }

    // C. Fetch TM Squad (for cross-checking TM ID)
    let tmMembers: any[] = [];
    if (tmId) {
      tmMembers = await fetchTmSquadWithTimeout(tmId);
    }

    // Match TM ID onto FotMob players where possible
    for (const fm of fotmobMembers) {
      const normFm = normalizeName(fm.name);
      const tmMatch = tmMembers.find((t) => {
        const normT = normalizeName(t.name);
        if (normT === normFm) return true;
        const partsFm = normFm.split(" ");
        const partsT = normT.split(" ");
        if (partsFm.length >= 2 && partsT.length >= 2) {
          if (partsFm[0] === partsT[0] && partsFm[partsFm.length - 1] === partsT[partsT.length - 1]) return true;
        }
        if (fm.shirtNumber != null && t.number != null && String(fm.shirtNumber) === String(t.number) && (partsFm[partsFm.length - 1] === partsT[partsT.length - 1] || Math.abs((fm.age || 0) - (t.age || 0)) <= 1)) {
          return true;
        }
        return false;
      });
      if (tmMatch) {
        fm.transfermarktId = tmMatch.tmId;
        if (!fm.role?.key && tmMatch.pos) {
          fm.role = { key: tmMatch.pos, fallback: tmMatch.pos };
        }
      }
    }

    // Tracking for this club
    let matchCount = 0;
    let attachCount = 0;
    let reassignCount = 0;
    let detachCount = 0;
    let createCount = 0;
    let conflictCount = 0;
    let manualReviewCount = 0;

    const matchedDbPlayerIds = new Set<string>();
    const matchedFmPlayerIds = new Set<number>();

    // Process each player in the FotMob squad
    for (const fm of fotmobMembers) {
      const fmName = fm.name;
      const fmNorm = normalizeName(fmName);
      const fmDoB = formatDate(fm.dateOfBirth);
      const fmPos = mapFotmobRoleToPosition(fm.role?.key);
      const fmShirt = fm.shirtNumber != null ? String(fm.shirtNumber) : "";
      const fmVal = fm.transferValue || 0;
      const fmTmId = fm.transfermarktId || "";

      let matchedPlayer: any = null;
      let matchMethod = "";

      // Exact FM_ ID check (e.g. players created in DB with FM_<id> on 2026-09-30)
      const exactFmDbPlayer = dbPlayersById.get(`FM_${fm.id}`);
      if (exactFmDbPlayer) {
        matchedPlayer = exactFmDbPlayer;
        matchMethod = "EXACT_FM_ID";
      }

      // 1. Try match by transfermarktId first
      if (!matchedPlayer && fmTmId) {
        const tmMatches = dbPlayersByTmId.get(fmTmId) || [];
        if (tmMatches.length === 1) {
          matchedPlayer = tmMatches[0];
          matchMethod = "TM_ID";
        } else if (tmMatches.length > 1) {
          // Multiple DB records fit TM ID -> Manual review
          manualReviewCount++;
          manualReviewRows.push({
            clubId,
            clubName,
            sourceName: fmName,
            sourceDoB: fmDoB,
            sourcePosition: fmPos,
            sourceShirtNumber: fmShirt,
            sourceTmId: fmTmId,
            candidateCount: tmMatches.length,
            candidateDbIds: tmMatches.map((p) => p.id).join(" | "),
            candidateDbNames: tmMatches.map((p) => p.fullName).join(" | "),
            candidateDbDoBs: tmMatches.map((p) => formatDate(p.dateOfBirth)).join(" | "),
            candidateDbClubs: tmMatches.map((p) => p.currentClubId ? dbClubMap.get(p.currentClubId)?.name || p.currentClubId : "Unassigned").join(" | "),
            reviewReason: `Multiple database records (${tmMatches.length}) share Transfermarkt ID ${fmTmId}`,
          });
          continue;
        }
      }

      // 2. If no ID match, try match by normalised name AND date of birth
      if (!matchedPlayer) {
        const nameCandidates = dbPlayersByNormName.get(fmNorm) || [];
        if (nameCandidates.length > 0) {
          const dobMatches = nameCandidates.filter((p) => formatDate(p.dateOfBirth) === fmDoB && fmDoB !== "");
          if (dobMatches.length === 1) {
            matchedPlayer = dobMatches[0];
            matchMethod = "NAME_AND_DOB";
          } else if (dobMatches.length > 1) {
            // Multiple records fit name + DoB -> Manual review
            manualReviewCount++;
            manualReviewRows.push({
              clubId,
              clubName,
              sourceName: fmName,
              sourceDoB: fmDoB,
              sourcePosition: fmPos,
              sourceShirtNumber: fmShirt,
              sourceTmId: fmTmId,
              candidateCount: dobMatches.length,
              candidateDbIds: dobMatches.map((p) => p.id).join(" | "),
              candidateDbNames: dobMatches.map((p) => p.fullName).join(" | "),
              candidateDbDoBs: dobMatches.map((p) => formatDate(p.dateOfBirth)).join(" | "),
              candidateDbClubs: dobMatches.map((p) => p.currentClubId ? dbClubMap.get(p.currentClubId)?.name || p.currentClubId : "Unassigned").join(" | "),
              reviewReason: `Multiple database records (${dobMatches.length}) fit both normalized name and date of birth (${fmDoB})`,
            });
            continue;
          } else {
            // Only name fits (DoB differs or is missing): Rule 1:
            // "Never match by name alone. If more than one database record fits, or only the name fits, do not pick one: put the row in a MANUAL REVIEW list with all candidates."
            manualReviewCount++;
            manualReviewRows.push({
              clubId,
              clubName,
              sourceName: fmName,
              sourceDoB: fmDoB,
              sourcePosition: fmPos,
              sourceShirtNumber: fmShirt,
              sourceTmId: fmTmId,
              candidateCount: nameCandidates.length,
              candidateDbIds: nameCandidates.map((p) => p.id).join(" | "),
              candidateDbNames: nameCandidates.map((p) => p.fullName).join(" | "),
              candidateDbDoBs: nameCandidates.map((p) => formatDate(p.dateOfBirth)).join(" | "),
              candidateDbClubs: nameCandidates.map((p) => p.currentClubId ? dbClubMap.get(p.currentClubId)?.name || p.currentClubId : "Unassigned").join(" | "),
              reviewReason: `Name fits but date of birth differs or is missing (source DoB: ${fmDoB || "none"}, DB DoB(s): ${nameCandidates.map((p) => formatDate(p.dateOfBirth) || "none").join(", ")}). Never match by name alone.`,
            });
            continue;
          }
        }
      }

      // 3. Classify based on whether player exists and where they are assigned
      if (!matchedPlayer) {
        // Player in source not found in database -> CREATE
        createCount++;
        proposedChanges.push({
          clubId,
          clubName,
          playerId: `FM_${fm.id}`,
          fullName: fmName,
          action: "CREATE",
          currentClubId: "",
          currentClubName: "Unassigned / Not in DB",
          targetClubId: clubId,
          targetClubName: clubName,
          position: fmPos,
          dateOfBirth: fmDoB,
          shirtNumber: fmShirt,
          status: "first_team",
          marketValueEur: fmVal,
          transfermarktId: fmTmId,
          reason: `Ingest new senior player from FotMob squad (shirt #${fmShirt || "none"})`,
          sanityFlags: "",
        });
      } else {
        matchedDbPlayerIds.add(matchedPlayer.id);
        matchedFmPlayerIds.add(fm.id);

        const dbPos = matchedPlayer.position;
        const dbDoB = formatDate(matchedPlayer.dateOfBirth);
        const sanityFlagsArr: string[] = [];
        if (dbPos && fmPos && dbPos.toLowerCase() !== fmPos.toLowerCase()) {
          sanityFlagsArr.push(`POSITION_DIFF (DB: ${dbPos}, Source: ${fmPos})`);
        }
        if (dbDoB && fmDoB && dbDoB !== fmDoB) {
          sanityFlagsArr.push(`DOB_DIFF (DB: ${dbDoB}, Source: ${fmDoB})`);
        }
        const sanityFlags = sanityFlagsArr.join(" | ");

        if (matchedPlayer.currentClubId === clubId) {
          // Already at this club in database -> MATCH
          matchCount++;
        } else if (!matchedPlayer.currentClubId || matchedPlayer.status === "departed") {
          // Unassigned / detached in database -> ATTACH
          attachCount++;
          proposedChanges.push({
            clubId,
            clubName,
            playerId: matchedPlayer.id,
            fullName: matchedPlayer.fullName,
            action: "ATTACH",
            currentClubId: "",
            currentClubName: "Unassigned (Detached)",
            targetClubId: clubId,
            targetClubName: clubName,
            position: fmPos,
            dateOfBirth: dbDoB || fmDoB,
            shirtNumber: fmShirt,
            status: "first_team",
            marketValueEur: Number(matchedPlayer.latestMarketValue) || fmVal,
            transfermarktId: matchedPlayer.transfermarktId || fmTmId,
            reason: `Present in ${clubName} FotMob squad (shirt #${fmShirt || "none"}); attach detached player`,
            sanityFlags,
          });
        } else {
          // Assigned to another club in database -> REASSIGN
          reassignCount++;
          const fromClubName = dbClubMap.get(matchedPlayer.currentClubId)?.name || matchedPlayer.currentClubId;
          proposedChanges.push({
            clubId,
            clubName,
            playerId: matchedPlayer.id,
            fullName: matchedPlayer.fullName,
            action: "REASSIGN",
            currentClubId: matchedPlayer.currentClubId,
            currentClubName: fromClubName,
            targetClubId: clubId,
            targetClubName: clubName,
            position: fmPos,
            dateOfBirth: dbDoB || fmDoB,
            shirtNumber: fmShirt,
            status: "first_team",
            marketValueEur: Number(matchedPlayer.latestMarketValue) || fmVal,
            transfermarktId: matchedPlayer.transfermarktId || fmTmId,
            reason: `Present in ${clubName} FotMob senior squad (shirt #${fmShirt || "none"}); previously assigned to ${fromClubName}`,
            sanityFlags,
          });
        }
      }
    }

    // Process players currently in database at this club that were NOT in FotMob squad -> DETACH
    for (const p of dbRoster) {
      if (!matchedDbPlayerIds.has(p.id)) {
        detachCount++;
        proposedChanges.push({
          clubId,
          clubName,
          playerId: p.id,
          fullName: p.fullName,
          action: "DETACH",
          currentClubId: clubId,
          currentClubName: clubName,
          targetClubId: "",
          targetClubName: "Unassigned (Detached)",
          position: p.position,
          dateOfBirth: formatDate(p.dateOfBirth),
          shirtNumber: "",
          status: "departed",
          marketValueEur: Number(p.latestMarketValue) || 0,
          transfermarktId: p.transfermarktId || "",
          reason: `Absent from FotMob declared squad for ${clubName}`,
          sanityFlags: "",
        });
      }
    }

    // Post-change simulated squad size = matches + attaches + reassigns + creates
    const simulatedSquadSize = matchCount + attachCount + reassignCount + createCount;
    const netDiff = simulatedSquadSize - fotmobMembers.length;

    summaryRows.push({
      clubId,
      clubName,
      dbRosterSize: dbRoster.length,
      fotmobSquadSize: fotmobMembers.length,
      matchCount,
      attachCount,
      reassignCount,
      detachCount,
      createCount,
      conflictCount,
      manualReviewCount,
      netDiffAfterChanges: netDiff,
    });
  }

  // -----------------------------------------------------------------
  // WRITE CSV OUTPUTS
  // -----------------------------------------------------------------
  // 1. audit_epl_summary.csv
  const sumHeader = "clubId,clubName,dbRosterSize,fotmobSquadSize,matchCount,attachCount,reassignCount,detachCount,createCount,conflictCount,manualReviewCount,netDiffAfterChanges\n";
  const sumLines = summaryRows.map((s) =>
    `"${s.clubId}","${s.clubName.replace(/"/g, '""')}",${s.dbRosterSize},${s.fotmobSquadSize},${s.matchCount},${s.attachCount},${s.reassignCount},${s.detachCount},${s.createCount},${s.conflictCount},${s.manualReviewCount},${s.netDiffAfterChanges}`
  );
  fs.writeFileSync(path.resolve(process.cwd(), "audit_epl_summary.csv"), sumHeader + sumLines.join("\n"), "utf-8");
  console.log("Saved audit_epl_summary.csv");

  // 2. audit_epl_changes.csv
  const chgHeader = "clubId,clubName,playerId,fullName,action,currentClubId,currentClubName,targetClubId,targetClubName,position,dateOfBirth,shirtNumber,status,marketValueEur,transfermarktId,reason,sanityFlags\n";
  const chgLines = proposedChanges.map((c) =>
    `"${c.clubId}","${c.clubName.replace(/"/g, '""')}","${c.playerId}","${c.fullName.replace(/"/g, '""')}","${c.action}","${c.currentClubId}","${c.currentClubName.replace(/"/g, '""')}","${c.targetClubId}","${c.targetClubName.replace(/"/g, '""')}","${c.position}","${c.dateOfBirth}","${c.shirtNumber}","${c.status}",${c.marketValueEur},"${c.transfermarktId}","${c.reason.replace(/"/g, '""')}","${c.sanityFlags.replace(/"/g, '""')}"`
  );
  fs.writeFileSync(path.resolve(process.cwd(), "audit_epl_changes.csv"), chgHeader + chgLines.join("\n"), "utf-8");
  console.log("Saved audit_epl_changes.csv");

  // 3. audit_epl_manual_review.csv
  const mrHeader = "clubId,clubName,sourceName,sourceDoB,sourcePosition,sourceShirtNumber,sourceTmId,candidateCount,candidateDbIds,candidateDbNames,candidateDbDoBs,candidateDbClubs,reviewReason\n";
  const mrLines = manualReviewRows.map((m) =>
    `"${m.clubId}","${m.clubName.replace(/"/g, '""')}","${m.sourceName.replace(/"/g, '""')}","${m.sourceDoB}","${m.sourcePosition}","${m.sourceShirtNumber}","${m.sourceTmId}",${m.candidateCount},"${m.candidateDbIds.replace(/"/g, '""')}","${m.candidateDbNames.replace(/"/g, '""')}","${m.candidateDbDoBs}","${m.candidateDbClubs.replace(/"/g, '""')}","${m.reviewReason.replace(/"/g, '""')}"`
  );
  fs.writeFileSync(path.resolve(process.cwd(), "audit_epl_manual_review.csv"), mrHeader + mrLines.join("\n"), "utf-8");
  console.log("Saved audit_epl_manual_review.csv");

  // -----------------------------------------------------------------
  // 5. RE-VERIFY ARSENAL & MANCHESTER CITY
  // -----------------------------------------------------------------
  console.log("\n==================================================================");
  console.log("=== RE-VERIFY ARSENAL FC & MANCHESTER CITY ===");
  console.log("==================================================================");

  const arsenalSummary = summaryRows.find((s) => s.clubName === "Arsenal FC");
  console.log(`\nArsenal FC:`);
  console.log(`- Database Roster Size: ${arsenalSummary.dbRosterSize}`);
  console.log(`- FotMob Squad Size:   ${arsenalSummary.fotmobSquadSize}`);
  console.log(`- Direct Matches:      ${arsenalSummary.matchCount}`);
  console.log(`- Proposed Detaches:   ${arsenalSummary.detachCount}`);
  console.log(`- Proposed Incomings:  +${arsenalSummary.attachCount + arsenalSummary.reassignCount + arsenalSummary.createCount}`);
  console.log(`- Manual Review:       ${arsenalSummary.manualReviewCount}`);

  const mcfcSummary = summaryRows.find((s) => s.clubName === "Manchester City");
  console.log(`\nManchester City:`);
  console.log(`- Database Roster Size: ${mcfcSummary.dbRosterSize}`);
  console.log(`- FotMob Squad Size:   ${mcfcSummary.fotmobSquadSize}`);
  console.log(`- Direct Matches:      ${mcfcSummary.matchCount}`);
  console.log(`- Proposed Detaches:   ${mcfcSummary.detachCount}`);
  console.log(`- Proposed Incomings:  +${mcfcSummary.attachCount + mcfcSummary.reassignCount + mcfcSummary.createCount}`);
  console.log(`- Manual Review:       ${mcfcSummary.manualReviewCount}`);

  // Confirm Rodri #1 is detached
  const rodri1 = await prisma.player.findUnique({
    where: { id: "cmuihs1h00179h29eublo2l4q" },
  });
  console.log(`\nRodri #1 (cmuihs1h00179h29eublo2l4q) Status in DB: currentClubId=${rodri1?.currentClubId ?? "null (detached)"}, status=${rodri1?.status}`);

  console.log("\n==================================================================");
  console.log("=== AUDIT SUMMARY TOTALS ===");
  console.log("==================================================================");
  const totalDb = summaryRows.reduce((a, b) => a + b.dbRosterSize, 0);
  const totalFm = summaryRows.reduce((a, b) => a + b.fotmobSquadSize, 0);
  const totalMatch = summaryRows.reduce((a, b) => a + b.matchCount, 0);
  const totalAttach = summaryRows.reduce((a, b) => a + b.attachCount, 0);
  const totalReassign = summaryRows.reduce((a, b) => a + b.reassignCount, 0);
  const totalDetach = summaryRows.reduce((a, b) => a + b.detachCount, 0);
  const totalCreate = summaryRows.reduce((a, b) => a + b.createCount, 0);
  const totalConflict = summaryRows.reduce((a, b) => a + b.conflictCount, 0);
  const totalManualReview = summaryRows.reduce((a, b) => a + b.manualReviewCount, 0);

  console.log(`Total Database Roster Players across 20 EPL clubs: ${totalDb}`);
  console.log(`Total FotMob Squad Players across 20 EPL clubs:     ${totalFm}`);
  console.log(`Total MATCH:                                      ${totalMatch}`);
  console.log(`Total ATTACH:                                     ${totalAttach}`);
  console.log(`Total REASSIGN:                                   ${totalReassign}`);
  console.log(`Total DETACH:                                     ${totalDetach}`);
  console.log(`Total CREATE:                                     ${totalCreate}`);
  console.log(`Total CONFLICT:                                   ${totalConflict}`);
  console.log(`Total MANUAL REVIEW:                              ${totalManualReview}`);
  console.log(`Total DUPLICATE ISSUES:                           ${duplicatesList.length}`);
}

runAudit()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
