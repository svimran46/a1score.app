/**
 * scripts/apply-all-laliga-audit.ts
 *
 * Orchestrator to audit and safely apply roster updates for all 20 LaLiga clubs:
 * - Direct connection with extended transaction timeouts (60s)
 * - Safe pre-flight backups to backups/backup_<slug>_before.json
 * - Atomic guarded transaction per club
 * - Exact post-apply count assertion with immediate rollback on any mismatch
 * - Append all mutations to applied_laliga_changes.csv
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

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clubNameToSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function main() {
  const clubs = JSON.parse(fs.readFileSync("scripts/mapped_laliga_clubs.json", "utf-8"));
  const allSquads = JSON.parse(
    fs.readFileSync("scripts/tm_laliga_all_squads_detailed_2026.json", "utf-8")
  );

  console.log("==================================================================");
  console.log(`=== STARTING ROSTER AUDIT & APPLY FOR ALL 20 LALIGA CLUBS ===`);
  console.log("==================================================================");

  const appliedCsvPath = path.resolve(process.cwd(), "applied_laliga_changes.csv");
  if (!fs.existsSync(appliedCsvPath)) {
    fs.writeFileSync(
      appliedCsvPath,
      "timestamp,clubId,clubName,playerId,fullName,action,oldClubId,oldClubName,newClubId,newClubName,oldStatus,newStatus,notes\n",
      "utf-8"
    );
  }

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const finalSummary: any[] = [];

  for (let idx = 0; idx < clubs.length; idx++) {
    const club = clubs[idx];
    const slug = clubNameToSlug(club.tmName);
    const tmSquad = allSquads[club.tmId] || [];

    console.log(`\n------------------------------------------------------------------`);
    console.log(`[${idx + 1}/${clubs.length}] Processing ${club.tmName} (DB: ${club.dbId}, TM: ${club.tmId})`);
    console.log(`Expected squad size from Transfermarkt: ${tmSquad.length} players`);

    // 1. Fetch current players at this club
    const currentClubPlayers = await prisma.player.findMany({
      where: { currentClubId: club.dbId },
      include: { currentClub: true },
    });
    console.log(`Current DB roster count: ${currentClubPlayers.length} players`);

    // 2. Fetch all DB players for matching TM squad
    const tmPlayerIds = tmSquad.map((p: any) => p.tmId).filter(Boolean);
    const matchedDbPlayers = await prisma.player.findMany({
      where: {
        OR: [
          { transfermarktId: { in: tmPlayerIds } },
          { currentClubId: club.dbId },
        ],
      },
      include: { currentClub: true },
    });

    const dbByTmId = new Map<string, any>();
    const dbByName = new Map<string, any[]>();
    for (const p of matchedDbPlayers) {
      if (p.transfermarktId) dbByTmId.set(p.transfermarktId, p);
      const norm = normalizeName(p.fullName);
      if (!dbByName.has(norm)) dbByName.set(norm, []);
      dbByName.get(norm)!.push(p);
    }

    const toKeep: any[] = [];
    const toAttach: any[] = [];
    const toReassign: any[] = [];
    const toCreate: any[] = [];
    const matchedDbIds = new Set<string>();

    for (const tmP of tmSquad) {
      let dbP = dbByTmId.get(tmP.tmId);
      if (!dbP) {
        const candidates = dbByName.get(normalizeName(tmP.name)) || [];
        if (candidates.length === 1) {
          dbP = candidates[0];
        } else if (candidates.length > 1 && tmP.dob) {
          const tmDobStr = tmP.dob.split("T")[0];
          dbP = candidates.find((c) => c.dateOfBirth?.toISOString().split("T")[0] === tmDobStr);
        }
      }

      if (!dbP) {
        toCreate.push(tmP);
      } else {
        matchedDbIds.add(dbP.id);
        if (dbP.currentClubId === club.dbId) {
          toKeep.push(dbP);
        } else if (dbP.currentClubId === null) {
          toAttach.push({ tmP, dbP });
        } else {
          toReassign.push({ tmP, dbP, fromClub: dbP.currentClub?.name || "Other", fromClubId: dbP.currentClubId });
        }
      }
    }

    // Outgoing players to detach
    const toDetach = currentClubPlayers.filter((p) => !matchedDbIds.has(p.id));

    console.log(`Plan for ${club.tmName}:`);
    console.log(` - Keep: ${toKeep.length}`);
    console.log(` - Attach (unassigned): ${toAttach.length}`);
    console.log(` - Reassign (from other club): ${toReassign.length}`);
    console.log(` - Create (new to DB): ${toCreate.length}`);
    console.log(` - Detach (outgoing): ${toDetach.length}`);

    const expectedFinal = toKeep.length + toAttach.length + toReassign.length + toCreate.length;
    if (expectedFinal !== tmSquad.length) {
      throw new Error(
        `[ABORT] Calculation mismatch for ${club.tmName}: expected ${expectedFinal}, but TM has ${tmSquad.length}!`
      );
    }

    // 3. Backup affected players
    const affectedIds = [
      ...toDetach.map((p) => p.id),
      ...toAttach.map((x) => x.dbP.id),
      ...toReassign.map((x) => x.dbP.id),
    ];

    let backupPlayers: any[] = [];
    if (affectedIds.length > 0) {
      backupPlayers = await prisma.player.findMany({
        where: { id: { in: affectedIds } },
        include: { currentClub: true },
      });
    }

    const backupFile = path.join(backupDir, `backup_${slug}_before.json`);
    fs.writeFileSync(
      backupFile,
      JSON.stringify(
        backupPlayers,
        (key, value) => (typeof value === "bigint" ? value.toString() : value),
        2
      ),
      "utf-8"
    );
    console.log(`✅ Backed up ${backupPlayers.length} affected players to ${backupFile}`);

    // 4. Execute atomic transaction
    console.log(`Executing atomic transaction for ${club.tmName}...`);
    const logChanges: any[] = [];
    const nowIso = new Date().toISOString();

    await prisma.$transaction(
      async (tx) => {
        // 4a. Batch Detach
        if (toDetach.length > 0) {
          const detachIds = toDetach.map((p) => p.id);
          await tx.player.updateMany({
            where: { id: { in: detachIds }, currentClubId: club.dbId },
            data: {
              currentClubId: null,
              status: "departed",
            },
          });

          for (const d of toDetach) {
            logChanges.push({
              timestamp: nowIso,
              clubId: club.dbId,
              clubName: club.tmName,
              playerId: d.id,
              fullName: d.fullName,
              action: "DETACH",
              oldClubId: club.dbId,
              oldClubName: club.tmName,
              newClubId: "",
              newClubName: "Unassigned (Detached)",
              oldStatus: d.status || "",
              newStatus: "departed",
              notes: "Absent from official 2026/27 Transfermarkt squad",
            });
          }
        }

        // 4b. Batch Attach
        if (toAttach.length > 0) {
          const attachIds = toAttach.map((x) => x.dbP.id);
          await tx.player.updateMany({
            where: { id: { in: attachIds } },
            data: {
              currentClubId: club.dbId,
              status: "first_team",
            },
          });

          for (const a of toAttach) {
            logChanges.push({
              timestamp: nowIso,
              clubId: club.dbId,
              clubName: club.tmName,
              playerId: a.dbP.id,
              fullName: a.dbP.fullName,
              action: "ATTACH",
              oldClubId: "",
              oldClubName: "Unassigned",
              newClubId: club.dbId,
              newClubName: club.tmName,
              oldStatus: a.dbP.status || "",
              newStatus: "first_team",
              notes: `Confirmed in 2026/27 squad (${a.tmP.pos}, TM ${a.tmP.tmId})`,
            });
          }
        }

        // 4c. Batch Reassign
        if (toReassign.length > 0) {
          const reassignIds = toReassign.map((x) => x.dbP.id);
          await tx.player.updateMany({
            where: { id: { in: reassignIds } },
            data: {
              currentClubId: club.dbId,
              status: "first_team",
            },
          });

          for (const r of toReassign) {
            logChanges.push({
              timestamp: nowIso,
              clubId: club.dbId,
              clubName: club.tmName,
              playerId: r.dbP.id,
              fullName: r.dbP.fullName,
              action: "REASSIGN",
              oldClubId: r.fromClubId || "",
              oldClubName: r.fromClub,
              newClubId: club.dbId,
              newClubName: club.tmName,
              oldStatus: r.dbP.status || "",
              newStatus: "first_team",
              notes: `Transferred from ${r.fromClub} to ${club.tmName} (TM ${r.tmP.tmId})`,
            });
          }
        }

        // 4d. Create missing players
        for (const c of toCreate) {
          const created = await tx.player.create({
            data: {
              fullName: c.name,
              position: c.pos || "Unknown",
              dateOfBirth: c.dob ? new Date(c.dob) : null,
              nationality: c.nationality || [],
              transfermarktId: c.tmId,
              latestMarketValue: c.marketValueBigInt ? BigInt(c.marketValueBigInt) : null,
              photoUrl: c.photoUrl || null,
              currentClubId: club.dbId,
              status: "first_team",
            },
          });

          logChanges.push({
            timestamp: nowIso,
            clubId: club.dbId,
            clubName: club.tmName,
            playerId: created.id,
            fullName: created.fullName,
            action: "CREATE",
            oldClubId: "",
            oldClubName: "None (New Player)",
            newClubId: club.dbId,
            newClubName: club.tmName,
            oldStatus: "",
            newStatus: "first_team",
            notes: `Created from official 2026/27 squad (${c.pos}, TM ${c.tmId})`,
          });
        }

        // 4e. Guard: strict assertion of post-apply count
        const postCount = await tx.player.count({
          where: { currentClubId: club.dbId },
        });

        if (postCount !== tmSquad.length) {
          throw new Error(
            `[TRANSACTION ROLLBACK] Verification failed for ${club.tmName}! Post count ${postCount} != expected ${tmSquad.length}`
          );
        }
      },
      {
        maxWait: 20000,
        timeout: 60000,
      }
    );

    console.log(`✅ Transaction committed. Post-count verified: ${tmSquad.length} players.`);

    // 5. Append changes to applied_laliga_changes.csv
    const logLines = logChanges.map(
      (l) =>
        `"${l.timestamp}","${l.clubId}","${l.clubName}","${l.playerId}","${l.fullName.replace(/"/g, '""')}","${l.action}","${l.oldClubId}","${l.oldClubName}","${l.newClubId}","${l.newClubName}","${l.oldStatus}","${l.newStatus}","${l.notes.replace(/"/g, '""')}"`
    );
    if (logLines.length > 0) {
      fs.appendFileSync(appliedCsvPath, logLines.join("\n") + "\n", "utf-8");
      console.log(`✅ Appended ${logLines.length} mutations to applied_laliga_changes.csv`);
    }

    finalSummary.push({
      Club: club.tmName,
      "TM Squad": tmSquad.length,
      "Initial DB": currentClubPlayers.length,
      Detached: toDetach.length,
      Attached: toAttach.length,
      Reassigned: toReassign.length,
      Created: toCreate.length,
      "Final Count": tmSquad.length,
      Status: "✅ APPLIED & VERIFIED",
    });
  }

  console.log("\n==================================================================");
  console.log("=== ALL 20 LALIGA CLUBS SUCCESSFULLY APPLIED & 100% VERIFIED ===");
  console.log("==================================================================");
  console.table(finalSummary);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (err) => {
  console.error("\n❌ FATAL ERROR DURING LALIGA AUDIT APPLY:", err);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
