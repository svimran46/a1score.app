import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const cleanUrl = directUrl!.replace(/[?&]sslmode=[^&]*/, "");
const pool = new Pool({ connectionString: cleanUrl, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

interface TmPlayer {
  number: string;
  name: string;
  tmId: string;
  pos: string;
  dob: string;
  age: string;
  mv: string;
}

interface ClubMapping {
  tmId: string;
  tmName: string;
  squadUrl: string;
  dbId: string;
  dbName: string;
  dbTmId: string;
  dbLeague: string;
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function analyzeAll() {
  const clubs: ClubMapping[] = JSON.parse(fs.readFileSync("scripts/mapped_epl_clubs.json", "utf-8"));
  const allSquads: Record<string, TmPlayer[]> = JSON.parse(fs.readFileSync("scripts/tm_epl_all_squads_2026.json", "utf-8"));

  // Exclude Arsenal (11) and Chelsea (631)
  const remaining = clubs.filter((c) => c.tmId !== "11" && c.tmId !== "631");

  // Collect all TM IDs from the 18 squads
  const allTmPlayerIds = new Set<string>();
  for (const [tmClubId, squad] of Object.entries(allSquads)) {
    for (const p of squad) {
      if (p.tmId) allTmPlayerIds.add(p.tmId);
    }
  }

  // Load all players from DB that either have one of these TM IDs OR are currently at one of the 18 clubs
  const clubDbIds = remaining.map((c) => c.dbId);
  const dbPlayers = await prisma.player.findMany({
    where: {
      OR: [
        { transfermarktId: { in: Array.from(allTmPlayerIds) } },
        { currentClubId: { in: clubDbIds } },
      ],
    },
    include: { currentClub: true },
  });

  console.log(`Loaded ${dbPlayers.length} relevant players from DB.`);

  const dbByTmId = new Map<string, any>();
  const dbByName = new Map<string, any[]>();
  for (const p of dbPlayers) {
    if (p.transfermarktId) {
      dbByTmId.set(p.transfermarktId, p);
    }
    const norm = normalizeName(p.fullName);
    if (!dbByName.has(norm)) dbByName.set(norm, []);
    dbByName.get(norm)!.push(p);
  }

  const summaryReport: any[] = [];
  const missingFromDb: any[] = [];

  for (const club of remaining) {
    const tmSquad = allSquads[club.tmId] || [];
    const currentDbRoster = dbPlayers.filter((p) => p.currentClubId === club.dbId);

    const alreadyAtClub: any[] = [];
    const toAttach: any[] = [];
    const toReassign: any[] = [];
    const toDetach: any[] = [];

    const matchedDbPlayerIdsInTm = new Set<string>();

    for (const tmP of tmSquad) {
      let dbP = dbByTmId.get(tmP.tmId);
      if (!dbP) {
        // Fallback by normalized name
        const candidates = dbByName.get(normalizeName(tmP.name)) || [];
        if (candidates.length === 1) {
          dbP = candidates[0];
        }
      }

      if (!dbP) {
        missingFromDb.push({
          club: club.tmName,
          clubId: club.dbId,
          tmId: tmP.tmId,
          name: tmP.name,
        });
        continue;
      }

      matchedDbPlayerIdsInTm.add(dbP.id);

      if (dbP.currentClubId === club.dbId) {
        alreadyAtClub.push({ tmP, dbP });
      } else if (dbP.currentClubId === null) {
        toAttach.push({ tmP, dbP });
      } else {
        toReassign.push({ tmP, dbP, fromClub: dbP.currentClub?.name || "Other" });
      }
    }

    // Players currently in DB at club who are NOT in TM squad
    for (const dbP of currentDbRoster) {
      if (!matchedDbPlayerIdsInTm.has(dbP.id)) {
        toDetach.push(dbP);
      }
    }

    summaryReport.push({
      club: club.tmName,
      tmCount: tmSquad.length,
      currentDbCount: currentDbRoster.length,
      alreadyAtClub: alreadyAtClub.length,
      toAttach: toAttach.length,
      toReassign: toReassign.length,
      toDetach: toDetach.length,
      expectedFinalCount: alreadyAtClub.length + toAttach.length + toReassign.length,
    });
  }

  console.log("\n=================== 18 EPL CLUBS AUDIT DRY RUN ===================");
  console.table(summaryReport);

  console.log(`\nTotal Missing from DB: ${missingFromDb.length}`);
  if (missingFromDb.length > 0) {
    console.table(missingFromDb);
  }

  fs.writeFileSync("scripts/dry_run_summary.json", JSON.stringify({ summaryReport, missingFromDb }, null, 2), "utf-8");

  await prisma.$disconnect();
  await pool.end();
}

analyzeAll().catch(console.error);
