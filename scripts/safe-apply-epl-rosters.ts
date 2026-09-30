/**
 * scripts/safe-apply-epl-rosters.ts
 *
 * Safely applies roster audit changes to the database one club at a time.
 * Default is DRY-RUN. Database writes only happen when --apply is provided.
 *
 * Rules:
 * 1. Process one club at a time (--club="<name or id>").
 * 2. Guarded writes: verify player current club matches CSV expectation.
 * 3. Never match by name alone.
 * 4. Check for duplicates before CREATE (same TM ID or same DoB + similar name).
 * 5. Generate real CUIDs for CREATE (never reuse FM_ as PK).
 * 6. Explicit exclusions:
 *    - Lewis Koumas (Hull row skipped; Liverpool ATTACH kept).
 *    - Name-variant duplicate pairs (both CREATE and DETACH skipped).
 *    - Savinho, Marmoush, Iliman Ndiaye, Mandas skipped.
 *    - Manual review rows skipped.
 *    - Detaches with MV >= 10M or age <= 21 skipped into detaches_to_verify.csv.
 * 7. Reassignments from clubs outside the 20 EPL clubs are listed separately.
 * 8. On --apply: backup affected players, execute in one prisma.$transaction,
 *    verify post-apply count, rollback if mismatch, and log to applied_epl_changes.csv.
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!directUrl) {
  throw new Error("No DIRECT_URL or DATABASE_URL found in environment");
}

const cleanUrl = directUrl.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ["error"],
});

export const EPL_CLUBS: Record<string, string> = {
  "cmuiho5do001hb23froc57owj": "Arsenal FC",
  "cmuihq8vi008xh29edz4vg4xw": "Aston Villa",
  "cmuihqh6y00dfh29eokvzxktp": "AFC Bournemouth",
  "cmuihocpq001vb23fu3cm5yh8": "Brentford FC",
  "cmuihomne002bb23fq0sdhdrm": "Brighton & Hove Albion",
  "cmuihqcpo00b1h29edf8q9ksb": "Chelsea FC",
  "cmundu5xu0001zjoe1l91im6d": "Coventry City",
  "cmuihqfqr00cqh29e2077zt3y": "Crystal Palace",
  "cmuihq4bo006fh29ef9sfod5p": "Everton FC",
  "cmuihqg9600cxh29echnkyx9e": "Fulham FC",
  "cmuihq56p006vh29efww9bqgh": "Hull City",
  "cmuihqdak00bdh29e51a0c9yd": "Ipswich Town",
  "cmuihq8hv008ph29ejwdrv7xd": "Leeds United",
  "cmuihq5k0006zh29erp4cykkk": "Liverpool FC",
  "cmuihq3vs0069h29ebm5xqhye": "Manchester City",
  "cmuihqgxr00ddh29e8cr2u808": "Manchester United",
  "cmuihqepp00c5h29e6dizfj3r": "Newcastle United",
  "cmuihqdq000bkh29et7iwzrfd": "Nottingham Forest",
  "cmuihq47i006bh29e3kejf8oh": "Sunderland AFC",
  "cmuihpzs8003vh29eyrxt8nk5": "Tottenham Hotspur",
};

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

export function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim().replace(/^"|"$/g, ""));
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    for (let h = 0; h < header.length; h++) {
      obj[header[h]] = cols[h] || "";
    }
    rows.push(obj);
  }
  return rows;
}

export function getAge(dobStr: string | null | undefined, refDate = new Date("2026-09-30")): number | null {
  if (!dobStr) return null;
  const d = new Date(dobStr);
  if (isNaN(d.getTime())) return null;
  let age = refDate.getFullYear() - d.getFullYear();
  const m = refDate.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

export interface PlannedAction {
  clubId: string;
  clubName: string;
  playerId: string;
  fullName: string;
  action: "ATTACH" | "REASSIGN" | "DETACH" | "CREATE";
  currentClubId: string;
  currentClubName: string;
  targetClubId: string;
  targetClubName: string;
  position: string;
  dateOfBirth: string;
  shirtNumber: string;
  marketValueEur: string;
  transfermarktId: string;
  willApply: boolean;
  skipReason?: string;
  isFromOutsideClub?: boolean;
}

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const clubArg = args.find((a) => a.startsWith("--club="))?.split("=")[1]?.replace(/^"|"$/g, "").trim();

  if (!clubArg) {
    console.error("Error: --club argument is required. Example: --club=\"Arsenal FC\" or --club=Arsenal");
    console.error("\nAvailable Premier League Clubs:");
    for (const [id, name] of Object.entries(EPL_CLUBS)) {
      console.error(`- ${name} (ID: ${id})`);
    }
    process.exit(1);
  }

  // Resolve target club
  let targetClubId = "";
  let targetClubName = "";
  for (const [id, name] of Object.entries(EPL_CLUBS)) {
    if (
      id.toLowerCase() === clubArg.toLowerCase() ||
      name.toLowerCase() === clubArg.toLowerCase() ||
      normalizeName(name) === normalizeName(clubArg) ||
      normalizeName(name).includes(normalizeName(clubArg))
    ) {
      targetClubId = id;
      targetClubName = name;
      break;
    }
  }

  if (!targetClubId) {
    console.error(`Error: Could not find Premier League club matching '${clubArg}'`);
    process.exit(1);
  }

  console.log("==================================================================");
  console.log(`=== PREMIER LEAGUE ROSTER AUDIT: ${targetClubName.toUpperCase()} ===`);
  console.log(`=== Mode: ${isApply ? "🔴 LIVE APPLY (WRITING TO DATABASE)" : "🟢 DRY RUN (READ ONLY)"} ===`);
  console.log("==================================================================");

  // Load audit CSVs
  const changesPath = path.resolve(process.cwd(), "audit_epl_changes.csv");
  const manualReviewPath = path.resolve(process.cwd(), "audit_epl_manual_review.csv");

  if (!fs.existsSync(changesPath)) {
    throw new Error("audit_epl_changes.csv not found");
  }
  const allChanges = parseCsv(fs.readFileSync(changesPath, "utf-8"));
  const manualReviewRows = fs.existsSync(manualReviewPath)
    ? parseCsv(fs.readFileSync(manualReviewPath, "utf-8"))
    : [];

  const manualReviewKeys = new Set(
    manualReviewRows.map((m) => `${m.clubId}|${normalizeName(m.sourceName)}`)
  );

  // Set of players with REASSIGN row
  const reassignPlayerIds = new Set(
    allChanges.filter((r) => r.action === "REASSIGN").map((r) => r.playerId)
  );

  // Build / update detaches_to_verify.csv
  const detachesToVerifyMap = new Map<string, any>();
  const allDetachesToVerify: any[] = [];
  for (const row of allChanges) {
    if (row.action === "DETACH") {
      const mv = parseInt(row.marketValueEur || "0", 10);
      const age = getAge(row.dateOfBirth);
      const isHighValue = mv >= 10_000_000;
      const isYoung = age !== null && age <= 21;
      const hasReassign = reassignPlayerIds.has(row.playerId);

      if ((isHighValue || isYoung) && !hasReassign) {
        const verifyReason = isHighValue && isYoung
          ? `High market value (EUR ${mv.toLocaleString()}) and young age (${age})`
          : isHighValue
          ? `High market value (EUR ${mv.toLocaleString()}) >= 10M`
          : `Young age (${age}) <= 21`;
        const entry = {
          clubId: row.clubId,
          clubName: row.clubName,
          playerId: row.playerId,
          fullName: row.fullName,
          marketValueEur: row.marketValueEur,
          dateOfBirth: row.dateOfBirth,
          age: age ?? "unknown",
          verifyReason,
        };
        detachesToVerifyMap.set(`${row.clubId}|${row.playerId}`, entry);
        allDetachesToVerify.push(entry);
      }
    }
  }

  // Write detaches_to_verify.csv
  const dvHeader = "clubId,clubName,playerId,fullName,marketValueEur,dateOfBirth,age,verifyReason\n";
  const dvLines = allDetachesToVerify.map(
    (r) => `"${r.clubId}","${r.clubName}","${r.playerId}","${r.fullName.replace(/"/g, '""')}",${r.marketValueEur},"${r.dateOfBirth}",${r.age},"${r.verifyReason}"`
  );
  fs.writeFileSync(path.resolve(process.cwd(), "detaches_to_verify.csv"), dvHeader + dvLines.join("\n"), "utf-8");

  // Query live DB players for this club and all potential candidates
  const currentClubPlayers = await prisma.player.findMany({
    where: { currentClubId: targetClubId },
  });
  const currentRosterCount = currentClubPlayers.length;

  console.log(`Current DB Roster for ${targetClubName}: ${currentRosterCount} players`);

  // Filter changes relevant to this club:
  // 1. Incomings: targetClubId === targetClubId (ATTACH, REASSIGN to here, CREATE for here)
  // 2. Outgoings: clubId === targetClubId (DETACH from here)
  const relevantRows = allChanges.filter(
    (r) =>
      (r.targetClubId === targetClubId && (r.action === "ATTACH" || r.action === "REASSIGN" || r.action === "CREATE")) ||
      (r.clubId === targetClubId && r.action === "DETACH")
  );

  console.log(`Total candidate change rows in audit_epl_changes.csv for this club: ${relevantRows.length}`);

  // Fetch all players involved in relevant rows to check their live state
  const involvedPlayerIds = relevantRows
    .map((r) => r.playerId)
    .filter((id) => id && !id.startsWith("FM_"));
  const dbPlayers = await prisma.player.findMany({
    where: { id: { in: involvedPlayerIds } },
  });
  const dbPlayerMap = new Map(dbPlayers.map((p) => [p.id, p]));

  // Also fetch all DB players in memory to check CREATE duplicates by TM ID or DoB + similar name
  const allDbPlayers = await prisma.player.findMany({
    select: {
      id: true,
      fullName: true,
      dateOfBirth: true,
      transfermarktId: true,
      currentClubId: true,
    },
  });

  // Name variant duplicate pairs rule:
  // Emanuel Emegha / Emmanuel Emegha (Chelsea)
  // Yehor Yarmoliuk / Yegor Yarmolyuk (Brentford)
  // Charly Alcaraz / Carlos Alcaraz (Everton)
  // Valentino Livramento / Tino Livramento (Newcastle)
  // Daniel Burn / Dan Burn (Newcastle)
  // Joseph Willock / Joe Willock (Newcastle)
  const isNameVariantDuplicate = (fullName: string, clubName: string): boolean => {
    const norm = normalizeName(fullName);
    if (clubName === "Chelsea FC" && (norm.includes("emegha") || norm.includes("emmanuel emegha") || norm.includes("emanuel emegha"))) return true;
    if (clubName === "Brentford FC" && (norm.includes("yarmoliuk") || norm.includes("yarmolyuk"))) return true;
    if (clubName === "Everton FC" && (norm.includes("alcaraz") || norm.includes("charly alcaraz") || norm.includes("carlos alcaraz"))) return true;
    if (clubName === "Newcastle United" && (
      norm.includes("livramento") ||
      norm === "daniel burn" || norm === "dan burn" ||
      norm === "joseph willock" || norm === "joe willock"
    )) return true;
    return false;
  };

  const plannedActions: PlannedAction[] = [];
  const outsideClubReassigns: PlannedAction[] = [];

  for (const row of relevantRows) {
    const action = row.action as "ATTACH" | "REASSIGN" | "DETACH" | "CREATE";
    const playerId = row.playerId;
    const fullName = row.fullName;
    const clubId = row.clubId;
    const clubName = row.clubName;
    const currentClubId = row.currentClubId;
    const currentClubName = row.currentClubName;
    const rowTargetClubId = row.targetClubId;
    const rowTargetClubName = row.targetClubName;
    const position = row.position;
    const dateOfBirth = row.dateOfBirth;
    const shirtNumber = row.shirtNumber;
    const marketValueEur = row.marketValueEur;
    const transfermarktId = row.transfermarktId;

    let willApply = true;
    let skipReason: string | undefined;

    // Check manual review exclusions
    if (manualReviewKeys.has(`${clubId}|${normalizeName(fullName)}`)) {
      willApply = false;
      skipReason = "Player is in audit_epl_manual_review.csv (held for manual review)";
    }

    // Check Lewis Koumas exclusion
    if (normalizeName(fullName).includes("koumas")) {
      if (clubName === "Hull City") {
        willApply = false;
        skipReason = "Lewis Koumas Hull City row excluded by rule (Liverpool ATTACH is authoritative)";
      }
    }

    // Check name-variant duplicate pairs (skip both CREATE and DETACH)
    if (isNameVariantDuplicate(fullName, clubName)) {
      willApply = false;
      skipReason = "Name-variant duplicate pair excluded by rule (same person, handle by hand later)";
    }

    // Check explicit single skips
    if (fullName.includes("Savinho") && clubName === "Manchester City" && action === "DETACH") {
      willApply = false;
      skipReason = "Savinho Man City DETACH excluded by rule (potential move to Tottenham)";
    }
    if (fullName.includes("Omar Marmoush") && action === "REASSIGN" && rowTargetClubName === "Manchester City") {
      willApply = false;
      skipReason = "Omar Marmoush Man City REASSIGN excluded by rule";
    }
    if (fullName.includes("Iliman Ndiaye") && clubName === "Manchester City" && action === "DETACH") {
      willApply = false;
      skipReason = "Iliman Ndiaye Man City DETACH excluded by rule";
    }
    if (fullName.includes("Christos Mandas") && action === "ATTACH" && rowTargetClubName === "AFC Bournemouth") {
      willApply = false;
      skipReason = "Christos Mandas Bournemouth ATTACH excluded by rule";
    }

    // Check DETACH protection rule: MV >= 10M or age <= 21 unless REASSIGN exists
    if (action === "DETACH" && willApply) {
      if (detachesToVerifyMap.has(`${clubId}|${playerId}`)) {
        const verifyEntry = detachesToVerifyMap.get(`${clubId}|${playerId}`);
        willApply = false;
        skipReason = `DETACH excluded by rule: ${verifyEntry.verifyReason} (placed in detaches_to_verify.csv)`;
      }
    }

    // Guard Checks against live DB state
    if (willApply) {
      if (action === "ATTACH") {
        const livePlayer = dbPlayerMap.get(playerId);
        if (!livePlayer) {
          willApply = false;
          skipReason = `Player ID ${playerId} not found in database`;
        } else if (livePlayer.currentClubId !== null) {
          willApply = false;
          skipReason = `State changed: Player is not unassigned (currently at club ID ${livePlayer.currentClubId})`;
        }
      } else if (action === "REASSIGN") {
        const livePlayer = dbPlayerMap.get(playerId);
        if (!livePlayer) {
          willApply = false;
          skipReason = `Player ID ${playerId} not found in database`;
        } else if (livePlayer.currentClubId !== currentClubId) {
          willApply = false;
          skipReason = `State changed: Player current club in DB (${livePlayer.currentClubId || "null"}) does not match expected source club (${currentClubId})`;
        }
      } else if (action === "DETACH") {
        const livePlayer = dbPlayerMap.get(playerId);
        if (!livePlayer) {
          willApply = false;
          skipReason = `Player ID ${playerId} not found in database`;
        } else if (livePlayer.currentClubId !== clubId) {
          willApply = false;
          skipReason = `State changed: Player current club in DB (${livePlayer.currentClubId || "null"}) does not match expected club (${clubId})`;
        }
      } else if (action === "CREATE") {
        // Check for existing player with same transfermarktId
        if (transfermarktId && transfermarktId !== "N/A" && transfermarktId !== "") {
          const matchTm = allDbPlayers.find((p) => p.transfermarktId === transfermarktId);
          if (matchTm) {
            willApply = false;
            skipReason = `Pre-create check failed: Player with transfermarktId ${transfermarktId} already exists in DB (${matchTm.fullName}, ID: ${matchTm.id})`;
          }
        }
        // Check for existing player with same dateOfBirth and similar name
        if (willApply && dateOfBirth) {
          const targetNormName = normalizeName(fullName);
          const matchDobName = allDbPlayers.find((p) => {
            if (!p.dateOfBirth) return false;
            // Format DB dateOfBirth accounting for +8h offset
            const pDob = new Date(p.dateOfBirth.getTime() + 8 * 3600 * 1000).toISOString().split("T")[0];
            if (pDob !== dateOfBirth) return false;
            const pNorm = normalizeName(p.fullName);
            return (
              pNorm === targetNormName ||
              pNorm.includes(targetNormName) ||
              targetNormName.includes(pNorm)
            );
          });
          if (matchDobName) {
            willApply = false;
            skipReason = `Pre-create check failed: Player with same DoB (${dateOfBirth}) and similar name already exists (${matchDobName.fullName}, ID: ${matchDobName.id})`;
          }
        }
      }
    }

    // Check outside club source for REASSIGN
    const isFromOutsideClub = action === "REASSIGN" && !EPL_CLUBS[currentClubId];

    const planned: PlannedAction = {
      clubId,
      clubName,
      playerId,
      fullName,
      action,
      currentClubId,
      currentClubName,
      targetClubId: rowTargetClubId,
      targetClubName: rowTargetClubName,
      position,
      dateOfBirth,
      shirtNumber,
      marketValueEur,
      transfermarktId,
      willApply,
      skipReason,
      isFromOutsideClub,
    };

    plannedActions.push(planned);
    if (isFromOutsideClub && willApply) {
      outsideClubReassigns.push(planned);
    }
  }

  // Group planned actions
  const applyingActions = plannedActions.filter((p) => p.willApply);
  const skippedActions = plannedActions.filter((p) => !p.willApply);

  const applyByAction = {
    ATTACH: applyingActions.filter((p) => p.action === "ATTACH"),
    REASSIGN: applyingActions.filter((p) => p.action === "REASSIGN"),
    DETACH: applyingActions.filter((p) => p.action === "DETACH"),
    CREATE: applyingActions.filter((p) => p.action === "CREATE"),
  };

  const incomingCount = applyByAction.ATTACH.length + applyByAction.REASSIGN.length + applyByAction.CREATE.length;
  const outgoingCount = applyByAction.DETACH.length;
  const expectedRosterCount = currentRosterCount + incomingCount - outgoingCount;

  console.log("\n==================================================================");
  console.log("=== DRY RUN SUMMARY REPORT ===");
  console.log("==================================================================");
  console.log(`Club:                       ${targetClubName} (${targetClubId})`);
  console.log(`Current DB Roster Count:    ${currentRosterCount}`);
  console.log(`Total Actions to Apply:     ${applyingActions.length}`);
  console.log(`  - ATTACH:                 ${applyByAction.ATTACH.length}`);
  console.log(`  - REASSIGN:               ${applyByAction.REASSIGN.length}`);
  console.log(`  - DETACH:                 ${applyByAction.DETACH.length}`);
  console.log(`  - CREATE:                 ${applyByAction.CREATE.length}`);
  console.log(`Total Rows Skipped:         ${skippedActions.length}`);
  console.log(`Net Roster Change:          +${incomingCount} incoming / -${outgoingCount} outgoing`);
  console.log(`Expected Post-Apply Roster: ${expectedRosterCount}`);

  if (applyingActions.length > 0) {
    console.log("\n--- ROWS TO APPLY ---");
    for (const a of applyingActions) {
      console.log(`[${a.action}] ${a.fullName} (ID: ${a.playerId})`);
      if (a.action === "ATTACH") console.log(`   -> Target: ${targetClubName} (pos: ${a.position}, shirt: #${a.shirtNumber || "N/A"})`);
      if (a.action === "REASSIGN") console.log(`   -> Move: ${a.currentClubName} -> ${targetClubName} (pos: ${a.position}, shirt: #${a.shirtNumber || "N/A"})`);
      if (a.action === "DETACH") console.log(`   -> Detach from ${targetClubName} -> status: departed`);
      if (a.action === "CREATE") console.log(`   -> Create new player for ${targetClubName} (pos: ${a.position}, shirt: #${a.shirtNumber || "N/A"})`);
    }
  }

  if (skippedActions.length > 0) {
    console.log("\n--- ROWS SKIPPED (WITH REASONS) ---");
    for (const s of skippedActions) {
      console.log(`[SKIPPED - ${s.action}] ${s.fullName} (ID: ${s.playerId})`);
      console.log(`   Reason: ${s.skipReason}`);
    }
  }

  if (outsideClubReassigns.length > 0) {
    console.log("\n--- REASSIGNS FROM OUTSIDE CLUBS (Roster will be reduced for outside club) ---");
    for (const o of outsideClubReassigns) {
      console.log(`- ${o.fullName}: moving from outside club "${o.currentClubName}" (ID: ${o.currentClubId}) to "${targetClubName}"`);
    }
  }

  if (!isApply) {
    console.log("\n==================================================================");
    console.log("DRY RUN FINISHED. Zero writes performed to database.");
    console.log("To apply these changes, run with: --apply");
    console.log("==================================================================");
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  // LIVE APPLY MODE
  console.log("\n==================================================================");
  console.log("=== EXECUTING LIVE DATABASE APPLICATION (--apply) ===");
  console.log("==================================================================");

  // Backup affected existing players
  const playerIdsToBackup = applyingActions
    .filter((a) => a.action !== "CREATE")
    .map((a) => a.playerId);

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const clubSlug = targetClubName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const backupFile = path.join(backupDir, `backup_${clubSlug}_${Date.now()}.json`);

  let backupPlayers: any[] = [];
  if (playerIdsToBackup.length > 0) {
    backupPlayers = await prisma.player.findMany({
      where: { id: { in: playerIdsToBackup } },
    });
    if (backupPlayers.length !== playerIdsToBackup.length) {
      throw new Error(`[ABORT] Backup verification failed: expected ${playerIdsToBackup.length} rows, found ${backupPlayers.length}`);
    }
  }

  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      backupPlayers,
      (key, value) => (typeof value === "bigint" ? value.toString() : value),
      2
    ),
    "utf-8"
  );
  console.log(`✅ Backed up ${backupPlayers.length} existing player records to ${backupFile}`);

  // Run in single transaction
  const logChanges: any[] = [];
  await prisma.$transaction(async (tx) => {
    console.log("Verifying guards inside transaction...");

    for (const act of applyingActions) {
      if (act.action === "ATTACH") {
        const cur = await tx.player.findUnique({ where: { id: act.playerId } });
        if (!cur || cur.currentClubId !== null) {
          throw new Error(`[ABORT] Guard failed for ATTACH ${act.fullName} (${act.playerId}): currentClubId is ${cur?.currentClubId}, expected null`);
        }
      } else if (act.action === "REASSIGN") {
        const cur = await tx.player.findUnique({ where: { id: act.playerId } });
        if (!cur || cur.currentClubId !== act.currentClubId) {
          throw new Error(`[ABORT] Guard failed for REASSIGN ${act.fullName} (${act.playerId}): currentClubId is ${cur?.currentClubId}, expected ${act.currentClubId}`);
        }
      } else if (act.action === "DETACH") {
        const cur = await tx.player.findUnique({ where: { id: act.playerId } });
        if (!cur || cur.currentClubId !== act.clubId) {
          throw new Error(`[ABORT] Guard failed for DETACH ${act.fullName} (${act.playerId}): currentClubId is ${cur?.currentClubId}, expected ${act.clubId}`);
        }
      } else if (act.action === "CREATE") {
        // Check for TM ID or DoB duplicate inside transaction
        if (act.transfermarktId && act.transfermarktId !== "N/A") {
          const exist = await tx.player.findUnique({ where: { transfermarktId: act.transfermarktId } });
          if (exist) {
            throw new Error(`[ABORT] Guard failed for CREATE ${act.fullName}: TM ID ${act.transfermarktId} already exists in DB (${exist.id})`);
          }
        }
      }
    }

    console.log("All guards passed inside transaction. Applying mutations...");

    for (const act of applyingActions) {
      const nowIso = new Date().toISOString();
      if (act.action === "ATTACH") {
        const prev = await tx.player.findUnique({ where: { id: act.playerId } });
        const updated = await tx.player.update({
          where: { id: act.playerId },
          data: {
            currentClubId: act.targetClubId,
            status: "first_team",
          },
        });
        logChanges.push({
          timestamp: nowIso,
          clubId: act.targetClubId,
          clubName: act.targetClubName,
          playerId: updated.id,
          fullName: updated.fullName,
          action: "ATTACH",
          oldClubId: prev?.currentClubId || "",
          oldClubName: "Unassigned",
          newClubId: act.targetClubId,
          newClubName: act.targetClubName,
          oldStatus: prev?.status || "",
          newStatus: "first_team",
        });
      } else if (act.action === "REASSIGN") {
        const prev = await tx.player.findUnique({ where: { id: act.playerId } });
        const updated = await tx.player.update({
          where: { id: act.playerId },
          data: {
            currentClubId: act.targetClubId,
            status: "first_team",
          },
        });
        logChanges.push({
          timestamp: nowIso,
          clubId: act.targetClubId,
          clubName: act.targetClubName,
          playerId: updated.id,
          fullName: updated.fullName,
          action: "REASSIGN",
          oldClubId: prev?.currentClubId || "",
          oldClubName: act.currentClubName,
          newClubId: act.targetClubId,
          newClubName: act.targetClubName,
          oldStatus: prev?.status || "",
          newStatus: "first_team",
        });
      } else if (act.action === "DETACH") {
        const prev = await tx.player.findUnique({ where: { id: act.playerId } });
        const updated = await tx.player.update({
          where: { id: act.playerId },
          data: {
            currentClubId: null,
            status: "departed",
          },
        });
        logChanges.push({
          timestamp: nowIso,
          clubId: act.clubId,
          clubName: act.clubName,
          playerId: updated.id,
          fullName: updated.fullName,
          action: "DETACH",
          oldClubId: prev?.currentClubId || "",
          oldClubName: act.clubName,
          newClubId: "",
          newClubName: "Unassigned (Detached)",
          oldStatus: prev?.status || "",
          newStatus: "departed",
        });
      } else if (act.action === "CREATE") {
        // Create new player with a real cuid generated by Prisma (@default(cuid()))
        const created = await tx.player.create({
          data: {
            fullName: act.fullName,
            position: act.position || "Midfield",
            dateOfBirth: act.dateOfBirth ? new Date(act.dateOfBirth) : null,
            status: "first_team",
            currentClubId: act.targetClubId,
            lastSeason: 2026,
            latestMarketValue: act.marketValueEur ? BigInt(act.marketValueEur) : BigInt(0),
            transfermarktId: act.transfermarktId && act.transfermarktId !== "N/A" ? act.transfermarktId : null,
          },
        });
        logChanges.push({
          timestamp: nowIso,
          clubId: act.targetClubId,
          clubName: act.targetClubName,
          playerId: created.id,
          fullName: created.fullName,
          action: "CREATE",
          oldClubId: "",
          oldClubName: "N/A (Created)",
          newClubId: act.targetClubId,
          newClubName: act.targetClubName,
          oldStatus: "",
          newStatus: "first_team",
        });
      }
    }

    // Verify post-application roster count
    const postClubPlayers = await tx.player.findMany({
      where: { currentClubId: targetClubId },
    });
    console.log(`Transaction verification: post-apply roster count is ${postClubPlayers.length} (expected: ${expectedRosterCount})`);
    if (postClubPlayers.length !== expectedRosterCount) {
      throw new Error(`[ABORT & ROLLBACK] Post-apply roster count mismatch: found ${postClubPlayers.length}, expected ${expectedRosterCount}`);
    }
  });

  // Append to applied_epl_changes.csv
  const appliedCsvPath = path.resolve(process.cwd(), "applied_epl_changes.csv");
  const exists = fs.existsSync(appliedCsvPath);
  const logHeader = "timestamp,clubId,clubName,playerId,fullName,action,oldClubId,oldClubName,newClubId,newClubName,oldStatus,newStatus\n";
  const logLines = logChanges.map(
    (l) => `"${l.timestamp}","${l.clubId}","${l.clubName}","${l.playerId}","${l.fullName.replace(/"/g, '""')}","${l.action}","${l.oldClubId}","${l.oldClubName}","${l.newClubId}","${l.newClubName}","${l.oldStatus}","${l.newStatus}"`
  );
  if (!exists) {
    fs.writeFileSync(appliedCsvPath, logHeader + logLines.join("\n") + "\n", "utf-8");
  } else {
    fs.appendFileSync(appliedCsvPath, logLines.join("\n") + "\n", "utf-8");
  }
  console.log(`✅ Logged ${logChanges.length} applied changes to applied_epl_changes.csv`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error("FATAL ERROR:", e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
