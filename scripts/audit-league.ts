/**
 * scripts/audit-league.ts
 *
 * Universal, production-grade auditor and updater for any league from Transfermarkt:
 * - Fetches league overview for 2026/27 season
 * - Maps TM clubs to database clubs
 * - Fetches detailed squads with positions, DoBs, nationalities, market values, and photos
 * - Takes pre-flight backups of all affected players
 * - Executes atomic guarded transactions with count assertions (timeout: 60s)
 * - Appends audit trail to applied_<league>_changes.csv
 * - Performs live DB verification
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { parseTmSquadDetailed, TmPlayerDetails } from "./parse-tm-squad-detailed";

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

export async function auditLeague(compCode: string, leagueTmSlug: string, leagueFileSlug: string) {
  console.log("==========================================================================================");
  console.log(`=== STARTING FULL ROSTER AUDIT & APPLY: ${leagueTmSlug.toUpperCase()} (${compCode}) ===`);
  console.log("==========================================================================================");

  // 1. Fetch league overview
  const overviewUrl = `https://www.transfermarkt.com/${leagueTmSlug}/startseite/wettbewerb/${compCode}/saison_id/2026`;
  console.log(`Fetching league overview from ${overviewUrl}...`);
  const res = await fetch(overviewUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching overview`);
  const html = await res.text();
  const tableMatch = html.match(/<table class="items">([\s\S]*?)<\/table>/);
  if (!tableMatch) throw new Error("Could not find table.items in league overview");

  const rows = tableMatch[1].split(/<tr class="(?:odd|even)">/);
  const tmClubs: any[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i].split("</tr>")[0];
    const m = r.match(/<td class="hauptlink no-border-links">\s*<a[^>]*href="([^"]*\/verein\/(\d+)[^"]*)"[^>]*>([^<]+)<\/a>/i);
    if (m) {
      tmClubs.push({
        tmId: m[2],
        tmName: m[3].trim(),
        squadUrl: `https://www.transfermarkt.com${m[1]}`,
      });
    }
  }

  console.log(`Parsed ${tmClubs.length} participating clubs from Transfermarkt.`);

  // 2. Map clubs to DB
  const allDbClubs = await prisma.club.findMany({ include: { league: true } });
  const mappedClubs = tmClubs.map((tm) => {
    let dbClub = allDbClubs.find((c) => c.transfermarktId === tm.tmId);
    if (!dbClub) {
      dbClub = allDbClubs.find((c) => c.name.toLowerCase() === tm.tmName.toLowerCase());
    }
    if (!dbClub) {
      dbClub = allDbClubs.find(
        (c) =>
          c.name.toLowerCase().includes(tm.tmName.toLowerCase()) ||
          tm.tmName.toLowerCase().includes(c.name.toLowerCase())
      );
    }
    if (!dbClub) {
      throw new Error(`[ABORT] Could not map club ${tm.tmName} (TM ${tm.tmId}) to DB!`);
    }
    return {
      tmId: tm.tmId,
      tmName: tm.tmName,
      squadUrl: tm.squadUrl,
      dbId: dbClub.id,
      dbName: dbClub.name,
      dbTmId: dbClub.transfermarktId,
    };
  });

  console.table(mappedClubs.map((c) => ({ "TM ID": c.tmId, "TM Name": c.tmName, "DB ID": c.dbId, "DB Name": c.dbName })));

  // 3. Fetch detailed squads
  console.log(`\nFetching detailed squads for all ${mappedClubs.length} clubs...`);
  const allSquads: Record<string, TmPlayerDetails[]> = {};
  for (const c of mappedClubs) {
    process.stdout.write(` - Fetching ${c.tmName} (TM ${c.tmId})... `);
    const sRes = await fetch(c.squadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!sRes.ok) {
      console.log(`❌ HTTP ${sRes.status}`);
      throw new Error(`Failed to fetch squad for ${c.tmName}`);
    }
    const sHtml = await sRes.text();
    const squad = parseTmSquadDetailed(sHtml);
    console.log(`✅ ${squad.length} players`);
    allSquads[c.tmId] = squad;
    await new Promise((r) => setTimeout(r, 600));
  }

  // Save squads locally
  fs.writeFileSync(
    `scripts/tm_${leagueFileSlug}_all_squads_detailed_2026.json`,
    JSON.stringify(
      allSquads,
      (key, value) => (typeof value === "bigint" ? value.toString() : value),
      2
    ),
    "utf-8"
  );

  // 4. Prepare CSV logging & backup dir
  const appliedCsvPath = path.resolve(process.cwd(), `applied_${leagueFileSlug}_changes.csv`);
  if (!fs.existsSync(appliedCsvPath)) {
    fs.writeFileSync(
      appliedCsvPath,
      "timestamp,clubId,clubName,playerId,fullName,action,oldClubId,oldClubName,newClubId,newClubName,oldStatus,newStatus,notes\n",
      "utf-8"
    );
  }

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const summaryResults: any[] = [];

  // 5. Apply club by club
  for (let idx = 0; idx < mappedClubs.length; idx++) {
    const club = mappedClubs[idx];
    const slug = clubNameToSlug(club.tmName);
    const tmSquad = allSquads[club.tmId] || [];

    console.log(`\n------------------------------------------------------------------`);
    console.log(`[${idx + 1}/${mappedClubs.length}] Applying ${club.tmName} (Expected Squad: ${tmSquad.length})`);

    // Live query current roster
    const currentClubPlayers = await prisma.player.findMany({
      where: { currentClubId: club.dbId },
      include: { currentClub: true },
    });

    const tmPlayerIds = tmSquad.map((p) => p.tmId).filter(Boolean);
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
        if (candidates.length === 1) dbP = candidates[0];
        else if (candidates.length > 1 && tmP.dob) {
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

    const toDetach = currentClubPlayers.filter((p) => !matchedDbIds.has(p.id));

    console.log(`Plan: Keep=${toKeep.length}, Attach=${toAttach.length}, Reassign=${toReassign.length}, Create=${toCreate.length}, Detach=${toDetach.length}`);

    const expectedFinal = toKeep.length + toAttach.length + toReassign.length + toCreate.length;
    if (expectedFinal !== tmSquad.length) {
      throw new Error(`[ABORT] Calculation mismatch: expected ${expectedFinal} != TM squad ${tmSquad.length}`);
    }

    // Pre-flight Backup
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

    // Atomic transaction
    const logChanges: any[] = [];
    const nowIso = new Date().toISOString();

    await prisma.$transaction(
      async (tx) => {
        // Detach
        if (toDetach.length > 0) {
          const detachIds = toDetach.map((p) => p.id);
          await tx.player.updateMany({
            where: { id: { in: detachIds }, currentClubId: club.dbId },
            data: { currentClubId: null, status: "departed" },
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

        // Attach
        if (toAttach.length > 0) {
          const attachIds = toAttach.map((x) => x.dbP.id);
          await tx.player.updateMany({
            where: { id: { in: attachIds } },
            data: { currentClubId: club.dbId, status: "first_team" },
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

        // Reassign
        if (toReassign.length > 0) {
          const reassignIds = toReassign.map((x) => x.dbP.id);
          await tx.player.updateMany({
            where: { id: { in: reassignIds } },
            data: { currentClubId: club.dbId, status: "first_team" },
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

        // Create
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

        // Strict post-apply count assertion
        const postCount = await tx.player.count({ where: { currentClubId: club.dbId } });
        if (postCount !== tmSquad.length) {
          throw new Error(`[TRANSACTION ROLLBACK] Verification failed for ${club.tmName}: postCount ${postCount} != expected ${tmSquad.length}`);
        }
      },
      {
        maxWait: 20000,
        timeout: 60000,
      }
    );

    console.log(`✅ Transaction committed. Post-count verified: ${tmSquad.length} players.`);

    // Append to CSV
    const logLines = logChanges.map(
      (l) =>
        `"${l.timestamp}","${l.clubId}","${l.clubName}","${l.playerId}","${l.fullName.replace(/"/g, '""')}","${l.action}","${l.oldClubId}","${l.oldClubName}","${l.newClubId}","${l.newClubName}","${l.oldStatus}","${l.newStatus}","${l.notes.replace(/"/g, '""')}"`
    );
    if (logLines.length > 0) {
      fs.appendFileSync(appliedCsvPath, logLines.join("\n") + "\n", "utf-8");
    }

    summaryResults.push({
      Club: club.tmName,
      "TM Target": tmSquad.length,
      "Initial DB": currentClubPlayers.length,
      Detached: toDetach.length,
      Attached: toAttach.length,
      Reassigned: toReassign.length,
      Created: toCreate.length,
      "Final Count": tmSquad.length,
      Status: "✅ APPLIED & VERIFIED",
    });
  }

  console.log("\n==========================================================================================");
  console.log(`=== ALL ${mappedClubs.length} CLUBS IN ${leagueTmSlug.toUpperCase()} COMPLETED & 100% VERIFIED ===`);
  console.log("==========================================================================================");
  console.table(summaryResults);

  return summaryResults;
}

// CLI runner if executed directly
if (process.argv[1]?.endsWith("audit-league.ts")) {
  const compCode = process.argv[2];
  const tmSlug = process.argv[3];
  const fileSlug = process.argv[4];

  if (!compCode || !tmSlug || !fileSlug) {
    console.error("Usage: npx tsx scripts/audit-league.ts <compCode> <tmSlug> <fileSlug>");
    process.exit(1);
  }

  auditLeague(compCode, tmSlug, fileSlug)
    .then(async () => {
      await prisma.$disconnect();
      await pool.end();
    })
    .catch(async (err) => {
      console.error("FATAL ERROR:", err);
      await prisma.$disconnect();
      await pool.end();
      process.exit(1);
    });
}
