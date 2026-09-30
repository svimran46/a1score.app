/**
 * scripts/apply-chelsea-audit.ts
 *
 * Applies the approved roster audit for Chelsea FC based on the official 2026/27 squad:
 * - Backs up all 28 affected players (7 incoming + 21 outgoing) to backups/backup_chelsea_before.json
 * - Executes in a single guarded prisma.$transaction on the direct connection with extended timeout
 * - Detaches 21 players absent from the official 27-man Transfermarkt squad
 * - Attaches/reassigns 7 players (2 from unassigned, 5 from other clubs)
 * - Verifies post-application roster count equals exactly 27
 * - Logs changes to applied_epl_changes.csv
 * - Re-queries and prints the final 27-player roster
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

const CHELSEA_ID = "cmuihqcpo00b1h29edf8q9ksb";
const CHELSEA_NAME = "Chelsea FC";

// 7 Incoming players
const INCOMING_PLAYERS = [
  {
    id: "cmuihw3ew0bk2sexpckwsp9gl",
    name: "Marco Palestra",
    action: "ATTACH",
    sourceClubId: null,
    sourceClubName: "Unassigned",
    reason: "Confirmed in 2026/27 Chelsea squad (Right-Back, TM 895937)",
  },
  {
    id: "cmuihw3el0bc7sexpi4ywz0bu",
    name: "Valentín Barco",
    action: "ATTACH",
    sourceClubId: null,
    sourceClubName: "Unassigned",
    reason: "Confirmed in 2026/27 Chelsea squad (Left-Back, TM 849410)",
  },
  {
    id: "cmuihvvye03cysexp6i5qq99j",
    name: "Emiliano Martínez",
    action: "REASSIGN",
    sourceClubId: "cmuihq8vi008xh29edz4vg4xw",
    sourceClubName: "Aston Villa",
    reason: "Transferred from Aston Villa to Chelsea (Goalkeeper, TM 111873)",
  },
  {
    id: "cmuihw0iu0868sexppt652rcy",
    name: "Maxence Lacroix",
    action: "REASSIGN",
    sourceClubId: "cmuihqfqr00cqh29e2077zt3y",
    sourceClubName: "Crystal Palace",
    reason: "Transferred from Crystal Palace to Chelsea in July 2026 for €61m (TM 434224)",
  },
  {
    id: "cmuihw23v09nesexpfic32t6u",
    name: "Pep Chavarría",
    action: "REASSIGN",
    sourceClubId: "cmuihq7gc0083h29exnlti38f",
    sourceClubName: "Rayo Vallecano",
    isOutsideClub: true,
    reason: "Transferred from Rayo Vallecano to Chelsea (Left-Back, TM 596122)",
  },
  {
    id: "cmuihvuy302f3sexp4l8z602u",
    name: "Jordan Henderson",
    action: "REASSIGN",
    sourceClubId: "cmuihocpq001vb23fu3cm5yh8",
    sourceClubName: "Brentford FC",
    reason: "Transferred from Brentford FC to Chelsea (Central Midfield, TM 61651)",
  },
  {
    id: "cmuihvuyj02jmsexplg90ysf1",
    name: "Danny Welbeck",
    action: "REASSIGN",
    sourceClubId: "cmuihomne002bb23fq0sdhdrm",
    sourceClubName: "Brighton & Hove Albion",
    reason: "Transferred from Brighton to Chelsea (Centre-Forward, TM 67063)",
  },
];

// 21 Outgoing players to detach
const OUTGOING_PLAYERS = [
  { id: "cmuihvy6r05rbsexp75hxke37", name: "Tosin Adarabioyo", reason: "Absent from official 2026/27 squad" },
  { id: "cmuihvzb80719sexp519zislh", name: "Trevoh Chalobah", reason: "Transferred to Como 1907" },
  { id: "cmuihw2q00avusexpi5wxxlyb", name: "Andrey Santos", reason: "Absent from official 2026/27 squad" },
  { id: "cmuihvzvy07j8sexpt7pgesch", name: "Axel Disasi", reason: "Absent from official 2026/27 squad" },
  { id: "cmuihw3fa0bu9sexppvti9m0q", name: "Tyrique George", reason: "Absent from official 2026/27 squad" },
  { id: "cmuihw43i0c38sexpjt5253x6", name: "Shumaira Mheuka", reason: "On season-long loan to Celtic" },
  { id: "cmuihw4470cjusexpm0azenk6", name: "Ollie Harrison", reason: "On season-long loan to AFC Wimbledon" },
  { id: "cmuihvzwg07u1sexpu0e6p4p6", name: "Robert Sánchez", reason: "On season-long loan to Como 1907" },
  { id: "cmuihw0jn08fusexpncuohc1c", name: "Benoît Badiashile", reason: "Absent from official 2026/27 squad" },
  { id: "cmuihw1c0093wsexpvdfoji1h", name: "Mykhaylo Mudryk", reason: "Absent from official 2026/27 squad" },
  { id: "cmuihw1em09k8sexp0g4adg4x", name: "Filip Jørgensen", reason: "On season-long loan to RC Strasbourg" },
  { id: "cmuihw24209sasexpd4p7xivg", name: "Liam Delap", reason: "Absent from official 2026/27 squad" },
  { id: "cmuihw24q0abrsexp9m14t0ai", name: "Dário Essugo", reason: "On season-long loan to RC Strasbourg" },
  { id: "cmuihw2q20ax5sexp2dbzhfaj", name: "Caleb Wiley", reason: "On season-long loan to Preston North End" },
  { id: "cmuihw2q80azisexph36zzipm", name: "Nicolas Jackson", reason: "Absent from official 2026/27 squad" },
  { id: "cmuihw2q90b0esexpkfxege74", name: "David Datro Fofana", reason: "Absent from official 2026/27 squad" },
  { id: "cmuihw2qf0b52sexpn07mu3sh", name: "Alejandro Garnacho", reason: "Absent from official 2026/27 squad" },
  { id: "cmuihw3eh0b8zsexpl3y51h6k", name: "Max Merrick", reason: "On season-long loan to Hartlepool United" },
  { id: "cmuihw3ez0bmgsexpl2afds0e", name: "Mamadou Sarr", reason: "On loan to Real Sociedad" },
  { id: "cmuihw3fb0bv6sexp5tyyprpr", name: "Marc Guiu", reason: "On loan to RB Leipzig" },
  { id: "cmuihw43y0ceqsexpykawz4gg", name: "Kendry Páez", reason: "On loan to River Plate" },
];

async function main() {
  console.log("==================================================================");
  console.log("=== APPLYING APPROVED ROSTER AUDIT: CHELSEA FC ===");
  console.log("==================================================================");

  // 1. Initial State Check
  const currentChelseaPlayers = await prisma.player.findMany({
    where: { currentClubId: CHELSEA_ID },
  });
  console.log(`Current Chelsea DB roster size: ${currentChelseaPlayers.length} (expected: 41)`);
  if (currentChelseaPlayers.length !== 41) {
    throw new Error(`[ABORT] Expected 41 players at Chelsea, found ${currentChelseaPlayers.length}`);
  }

  // 2. Backup all 28 affected players
  const allAffectedIds = [
    ...INCOMING_PLAYERS.map((p) => p.id),
    ...OUTGOING_PLAYERS.map((p) => p.id),
  ];

  const backupPlayers = await prisma.player.findMany({
    where: { id: { in: allAffectedIds } },
    include: { currentClub: true },
  });

  if (backupPlayers.length !== allAffectedIds.length) {
    throw new Error(`[ABORT] Expected ${allAffectedIds.length} players to backup, found ${backupPlayers.length}`);
  }

  const backupMap = new Map(backupPlayers.map((p) => [p.id, p]));

  // Pre-transaction guard check
  for (const inc of INCOMING_PLAYERS) {
    const live = backupMap.get(inc.id);
    if (!live) throw new Error(`[ABORT] Incoming player ${inc.name} not found!`);
    if (inc.action === "ATTACH" && live.currentClubId !== null) {
      throw new Error(`[ABORT] Guard failed for ATTACH ${inc.name}: current club is ${live.currentClubId}, expected null`);
    }
    if (inc.action === "REASSIGN" && live.currentClubId !== inc.sourceClubId) {
      throw new Error(`[ABORT] Guard failed for REASSIGN ${inc.name}: current club is ${live.currentClubId}, expected ${inc.sourceClubId}`);
    }
  }

  for (const out of OUTGOING_PLAYERS) {
    const live = backupMap.get(out.id);
    if (!live) throw new Error(`[ABORT] Outgoing player ${out.name} not found!`);
    if (live.currentClubId !== CHELSEA_ID) {
      throw new Error(`[ABORT] Guard failed for DETACH ${out.name}: current club is ${live.currentClubId}, expected ${CHELSEA_ID}`);
    }
  }

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const backupFile = path.join(backupDir, "backup_chelsea_before.json");
  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      backupPlayers,
      (key, value) => (typeof value === "bigint" ? value.toString() : value),
      2
    ),
    "utf-8"
  );
  console.log(`✅ [Step 1] Exported backup of ${backupPlayers.length} affected players to ${backupFile}`);

  // 3. Execute Transaction with extended timeout
  console.log("\n[Step 2] Executing single prisma.$transaction (timeout: 60s)...");
  const logChanges: any[] = [];
  const nowIso = new Date().toISOString();

  await prisma.$transaction(
    async (tx) => {
      // 1. Batch detach all 21 outgoing players
      const outgoingIds = OUTGOING_PLAYERS.map((p) => p.id);
      await tx.player.updateMany({
        where: { id: { in: outgoingIds } },
        data: {
          currentClubId: null,
          status: "departed",
        },
      });

      for (const out of OUTGOING_PLAYERS) {
        const prev = backupMap.get(out.id);
        logChanges.push({
          timestamp: nowIso,
          clubId: CHELSEA_ID,
          clubName: CHELSEA_NAME,
          playerId: out.id,
          fullName: out.name,
          action: "DETACH",
          oldClubId: prev?.currentClubId || "",
          oldClubName: CHELSEA_NAME,
          newClubId: "",
          newClubName: "Unassigned (Detached)",
          oldStatus: prev?.status || "",
          newStatus: "departed",
          notes: out.reason,
        });
        console.log(` - Detached: ${out.name} (${out.id}) -> ${out.reason}`);
      }

      // 2. Batch attach/reassign all 7 incoming players
      const incomingIds = INCOMING_PLAYERS.map((p) => p.id);
      await tx.player.updateMany({
        where: { id: { in: incomingIds } },
        data: {
          currentClubId: CHELSEA_ID,
          status: "first_team",
        },
      });

      for (const inc of INCOMING_PLAYERS) {
        const prev = backupMap.get(inc.id);
        logChanges.push({
          timestamp: nowIso,
          clubId: CHELSEA_ID,
          clubName: CHELSEA_NAME,
          playerId: inc.id,
          fullName: inc.name,
          action: inc.action,
          oldClubId: prev?.currentClubId || "",
          oldClubName: inc.sourceClubName,
          newClubId: CHELSEA_ID,
          newClubName: CHELSEA_NAME,
          oldStatus: prev?.status || "",
          newStatus: "first_team",
          notes: inc.reason,
        });
        console.log(` + ${inc.action}: ${inc.name} (${inc.id}) from ${inc.sourceClubName} -> ${inc.reason}`);
      }

      // 3. Verify post-apply count inside transaction
      const postCount = await tx.player.count({
        where: { currentClubId: CHELSEA_ID },
      });
      console.log(`Post-apply count inside transaction: ${postCount} (expected: 27)`);
      if (postCount !== 27) {
        throw new Error(`[ABORT & ROLLBACK] Post-apply count mismatch: got ${postCount}, expected 27!`);
      }
    },
    {
      maxWait: 20000,
      timeout: 60000,
    }
  );

  console.log("✅ [Step 2] Transaction committed successfully.");

  // 4. Log changes to applied_epl_changes.csv
  const appliedCsvPath = path.resolve(process.cwd(), "applied_epl_changes.csv");
  const exists = fs.existsSync(appliedCsvPath);
  const logHeader = "timestamp,clubId,clubName,playerId,fullName,action,oldClubId,oldClubName,newClubId,newClubName,oldStatus,newStatus,notes\n";
  const logLines = logChanges.map(
    (l) =>
      `"${l.timestamp}","${l.clubId}","${l.clubName}","${l.playerId}","${l.fullName.replace(/"/g, '""')}","${l.action}","${l.oldClubId}","${l.oldClubName}","${l.newClubId}","${l.newClubName}","${l.oldStatus}","${l.newStatus}","${l.notes.replace(/"/g, '""')}"`
  );
  if (!exists) {
    fs.writeFileSync(appliedCsvPath, logHeader + logLines.join("\n") + "\n", "utf-8");
  } else {
    fs.appendFileSync(appliedCsvPath, logLines.join("\n") + "\n", "utf-8");
  }
  console.log(`✅ [Step 3] Appended ${logChanges.length} changes to applied_epl_changes.csv`);

  // 5. Re-query Chelsea Roster & Verify 1:1 against Transfermarkt
  const finalChelseaRoster = await prisma.player.findMany({
    where: { currentClubId: CHELSEA_ID },
    orderBy: [{ position: "asc" }, { fullName: "asc" }],
  });

  console.log("\n==================================================================");
  console.log(`=== FINAL VERIFIED CHELSEA FC ROSTER (${finalChelseaRoster.length} PLAYERS) ===`);
  console.log("==================================================================");
  finalChelseaRoster.forEach((p, idx) => {
    console.log(
      `${String(idx + 1).padStart(2, " ")}. [${p.position.padEnd(10, " ")}] ${p.fullName} (ID: ${p.id}, TM: ${p.transfermarktId || "N/A"})`
    );
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error("FATAL ERROR:", e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
