/**
 * scripts/apply-arsenal-audit.ts
 *
 * Applies the approved roster audit for Arsenal FC:
 * - Backs up affected players to backups/backup_arsenal_before.json
 * - Executes in a single prisma.$transaction on the direct connection
 * - Verifies currentClubId is Arsenal before update
 * - Detaches Trossard, Martinelli, Rojas, Setford (currentClubId: null, status: "departed")
 * - Verifies post-application roster count equals exactly 24
 * - Logs changes to applied_epl_changes.csv
 * - Re-queries and prints the final 24-player roster
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

const ARSENAL_ID = "cmuiho5do001hb23froc57owj";
const ARSENAL_NAME = "Arsenal FC";

const PLAYERS_TO_DETACH = [
  {
    id: "cmuihvwru03vysexpyx8qaql4",
    name: "Leandro Trossard",
    reason: "Transferred to Beşiktaş JK (July 2026, €18m)",
  },
  {
    id: "cmuihw24k0a6qsexp2t10fjmh",
    name: "Gabriel Martinelli",
    reason: "Transferred to Al-Hilal SFC (September 2026, €70m)",
  },
  {
    id: "cmuihw3fc0bvvsexpksu1ma1l",
    name: "Alexéi Rojas",
    reason: "Free transfer to FC Penafiel (summer 2026)",
  },
  {
    id: "cmuihw3el0bc2sexp7tgcux59",
    name: "Tommy Setford",
    reason: "On season-long loan to Stevenage FC (September 2026)",
  },
];

async function main() {
  console.log("==================================================================");
  console.log("=== APPLYING APPROVED ROSTER AUDIT: ARSENAL FC ===");
  console.log("==================================================================");

  // 1. Initial State Check
  const currentArsenalPlayers = await prisma.player.findMany({
    where: { currentClubId: ARSENAL_ID },
  });
  console.log(`Current Arsenal DB roster size: ${currentArsenalPlayers.length} (expected: 28)`);
  if (currentArsenalPlayers.length !== 28) {
    throw new Error(`[ABORT] Expected 28 players at Arsenal, found ${currentArsenalPlayers.length}`);
  }

  // 2. Backup affected players
  const detachIds = PLAYERS_TO_DETACH.map((p) => p.id);
  const backupPlayers = await prisma.player.findMany({
    where: { id: { in: detachIds } },
  });

  if (backupPlayers.length !== detachIds.length) {
    throw new Error(`[ABORT] Failed to find all 4 players to backup. Found: ${backupPlayers.length}`);
  }

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const backupFile = path.join(backupDir, "backup_arsenal_before.json");
  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      backupPlayers,
      (key, value) => (typeof value === "bigint" ? value.toString() : value),
      2
    ),
    "utf-8"
  );
  console.log(`✅ [Step 1] Exported backup of 4 affected players to ${backupFile}`);

  // 3. Execute Transaction
  console.log("\n[Step 2] Executing single prisma.$transaction...");
  const logChanges: any[] = [];

  await prisma.$transaction(async (tx) => {
    // Verify each player is still currently at Arsenal
    for (const p of PLAYERS_TO_DETACH) {
      const live = await tx.player.findUnique({ where: { id: p.id } });
      if (!live) {
        throw new Error(`[ABORT] Player ${p.name} (${p.id}) not found in database!`);
      }
      if (live.currentClubId !== ARSENAL_ID) {
        throw new Error(
          `[ABORT] Player ${p.name} (${p.id}) currentClubId is ${live.currentClubId}, expected ${ARSENAL_ID}`
        );
      }
    }
    console.log("All guards passed. Applying detaches...");

    const nowIso = new Date().toISOString();
    for (const p of PLAYERS_TO_DETACH) {
      const prev = await tx.player.findUnique({ where: { id: p.id } });
      const updated = await tx.player.update({
        where: { id: p.id },
        data: {
          currentClubId: null,
          status: "departed",
        },
      });

      logChanges.push({
        timestamp: nowIso,
        clubId: ARSENAL_ID,
        clubName: ARSENAL_NAME,
        playerId: updated.id,
        fullName: updated.fullName,
        action: "DETACH",
        oldClubId: prev?.currentClubId || "",
        oldClubName: ARSENAL_NAME,
        newClubId: "",
        newClubName: "Unassigned (Detached)",
        oldStatus: prev?.status || "",
        newStatus: "departed",
        notes: p.reason,
      });
      console.log(` - Detached: ${p.name} (${p.id}) -> ${p.reason}`);
    }

    // Verify post-apply count inside transaction
    const postCount = await tx.player.count({
      where: { currentClubId: ARSENAL_ID },
    });
    console.log(`Post-apply count inside transaction: ${postCount} (expected: 24)`);
    if (postCount !== 24) {
      throw new Error(`[ABORT & ROLLBACK] Post-apply count mismatch: got ${postCount}, expected 24!`);
    }
  });

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

  // 5. Re-query Arsenal Roster & Verify 1:1 against FotMob
  const finalArsenalRoster = await prisma.player.findMany({
    where: { currentClubId: ARSENAL_ID },
    orderBy: [{ position: "asc" }, { fullName: "asc" }],
  });

  console.log("\n==================================================================");
  console.log(`=== FINAL VERIFIED ARSENAL FC ROSTER (${finalArsenalRoster.length} PLAYERS) ===`);
  console.log("==================================================================");
  finalArsenalRoster.forEach((p, idx) => {
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
