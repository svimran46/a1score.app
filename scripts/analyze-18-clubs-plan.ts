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

interface TmPlayerDetails {
  number: string;
  name: string;
  tmId: string;
  pos: string;
  dob: string;
  age: number;
  nationality: string[];
  mvRaw: string;
  marketValueBigInt: string | null;
  photoUrl: string | null;
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
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const clubs: ClubMapping[] = JSON.parse(fs.readFileSync("scripts/mapped_epl_clubs.json", "utf-8"));
  const allSquads: Record<string, TmPlayerDetails[]> = JSON.parse(
    fs.readFileSync("scripts/tm_epl_all_squads_detailed_2026.json", "utf-8")
  );

  // Exclude Arsenal (11) and Chelsea (631)
  const remaining = clubs.filter((c) => c.tmId !== "11" && c.tmId !== "631");

  // Load all players currently in the entire database
  console.log("Loading all database players...");
  const allDbPlayers = await prisma.player.findMany({
    include: { currentClub: true },
  });
  console.log(`Loaded ${allDbPlayers.length} total players from DB.`);

  const dbByTmId = new Map<string, typeof allDbPlayers[0]>();
  const dbByName = new Map<string, typeof allDbPlayers[0][]>();

  for (const p of allDbPlayers) {
    if (p.transfermarktId) {
      dbByTmId.set(p.transfermarktId, p);
    }
    const norm = normalizeName(p.fullName);
    if (!dbByName.has(norm)) dbByName.set(norm, []);
    dbByName.get(norm)!.push(p);
  }

  const clubPlans: any[] = [];

  for (const club of remaining) {
    const tmSquad = allSquads[club.tmId] || [];
    const currentDbRoster = allDbPlayers.filter((p) => p.currentClubId === club.dbId);

    const alreadyAtClub: any[] = [];
    const toAttach: any[] = [];
    const toReassign: any[] = [];
    const toCreate: any[] = [];
    const toDetach: any[] = [];

    const matchedDbPlayerIdsInTm = new Set<string>();

    for (const tmP of tmSquad) {
      let dbP = dbByTmId.get(tmP.tmId);
      if (!dbP) {
        // Fallback by normalized name AND dob if available
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
        continue;
      }

      matchedDbPlayerIdsInTm.add(dbP.id);

      if (dbP.currentClubId === club.dbId) {
        alreadyAtClub.push({ tmP, dbP });
      } else if (dbP.currentClubId === null) {
        toAttach.push({ tmP, dbP });
      } else {
        toReassign.push({ tmP, dbP, fromClub: dbP.currentClub?.name || "Other", fromClubId: dbP.currentClubId });
      }
    }

    for (const dbP of currentDbRoster) {
      if (!matchedDbPlayerIdsInTm.has(dbP.id)) {
        toDetach.push(dbP);
      }
    }

    const expectedFinal = alreadyAtClub.length + toAttach.length + toReassign.length + toCreate.length;

    clubPlans.push({
      tmId: club.tmId,
      clubName: club.tmName,
      clubId: club.dbId,
      tmSquadSize: tmSquad.length,
      currentDbSize: currentDbRoster.length,
      alreadyAtClub: alreadyAtClub.length,
      toAttach: toAttach.map((x) => ({ id: x.dbP.id, name: x.dbP.fullName, tmId: x.tmP.tmId })),
      toReassign: toReassign.map((x) => ({
        id: x.dbP.id,
        name: x.dbP.fullName,
        tmId: x.tmP.tmId,
        fromClub: x.fromClub,
        fromClubId: x.fromClubId,
      })),
      toCreate: toCreate.map((x) => ({
        name: x.name,
        tmId: x.tmId,
        pos: x.pos,
        dob: x.dob,
        nationality: x.nationality,
        mvRaw: x.mvRaw,
      })),
      toDetach: toDetach.map((x) => ({ id: x.id, name: x.fullName, tmId: x.transfermarktId })),
      expectedFinal,
      isPerfectMatch: expectedFinal === tmSquad.length,
    });
  }

  console.log("\n=================== 18 EPL CLUBS PLAN OVERVIEW ===================");
  const tableData = clubPlans.map((p) => ({
    Club: p.clubName,
    "TM Target": p.tmSquadSize,
    "Current DB": p.currentDbSize,
    Unchanged: p.alreadyAtClub,
    ATTACH: p.toAttach.length,
    REASSIGN: p.toReassign.length,
    CREATE: p.toCreate.length,
    DETACH: p.toDetach.length,
    "Final Count": p.expectedFinal,
    Match: p.isPerfectMatch ? "✅ EXACT" : "❌ MISMATCH",
  }));
  console.table(tableData);

  fs.writeFileSync("scripts/detailed_18_clubs_plan.json", JSON.stringify(clubPlans, null, 2), "utf-8");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
