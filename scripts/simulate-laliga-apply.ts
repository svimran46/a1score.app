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

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function simulate() {
  const clubs = JSON.parse(fs.readFileSync("scripts/mapped_laliga_clubs.json", "utf-8"));
  const allSquads = JSON.parse(fs.readFileSync("scripts/tm_laliga_all_squads_detailed_2026.json", "utf-8"));

  // Collect all TM player IDs from all 20 squads
  const allTmPlayerIds = new Set<string>();
  for (const squad of Object.values(allSquads)) {
    for (const p of squad as any[]) {
      if (p.tmId) allTmPlayerIds.add(p.tmId);
    }
  }

  const clubDbIds = clubs.map((c: any) => c.dbId);

  console.log(`Querying DB for players with ${allTmPlayerIds.size} TM IDs or at ${clubDbIds.length} LaLiga clubs...`);
  const relevantDbPlayers = await prisma.player.findMany({
    where: {
      OR: [
        { transfermarktId: { in: Array.from(allTmPlayerIds) } },
        { currentClubId: { in: clubDbIds } },
      ],
    },
    include: { currentClub: true },
  });
  console.log(`Loaded ${relevantDbPlayers.length} relevant players from DB in < 1 second.`);

  const simPlayers = relevantDbPlayers.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    transfermarktId: p.transfermarktId,
    dateOfBirth: p.dateOfBirth,
    currentClubId: p.currentClubId,
    currentClubName: p.currentClub?.name || "Unassigned",
    status: p.status,
  }));

  const simByTmId = new Map<string, typeof simPlayers[0]>();
  const simByName = new Map<string, typeof simPlayers[0][]>();

  for (const p of simPlayers) {
    if (p.transfermarktId) simByTmId.set(p.transfermarktId, p);
    const norm = normalizeName(p.fullName);
    if (!simByName.has(norm)) simByName.set(norm, []);
    simByName.get(norm)!.push(p);
  }

  let newPlayerIdCounter = 1;
  const results: any[] = [];
  const toCreateList: any[] = [];

  console.log("\n=================== STARTING LALIGA SEQUENTIAL SIMULATION ===================");

  for (const club of clubs) {
    const tmSquad = allSquads[club.tmId] || [];
    const currentClubPlayers = simPlayers.filter((p) => p.currentClubId === club.dbId);

    const toAttach: any[] = [];
    const toReassign: any[] = [];
    const toCreate: any[] = [];
    const toKeep: any[] = [];
    const matchedSimPlayerIds = new Set<string>();

    for (const tmP of tmSquad) {
      let simP = simByTmId.get(tmP.tmId);
      if (!simP) {
        const candidates = simByName.get(normalizeName(tmP.name)) || [];
        if (candidates.length === 1) simP = candidates[0];
        else if (candidates.length > 1 && tmP.dob) {
          const tmDobStr = tmP.dob.split("T")[0];
          simP = candidates.find((c) => c.dateOfBirth?.toISOString().split("T")[0] === tmDobStr);
        }
      }

      if (!simP) {
        toCreate.push(tmP);
        toCreateList.push({ club: club.tmName, tmId: tmP.tmId, name: tmP.name, pos: tmP.pos });
      } else {
        matchedSimPlayerIds.add(simP.id);
        if (simP.currentClubId === club.dbId) {
          toKeep.push(simP);
        } else if (simP.currentClubId === null) {
          toAttach.push(simP);
        } else {
          toReassign.push(simP);
        }
      }
    }

    const toDetach = currentClubPlayers.filter((p) => !matchedSimPlayerIds.has(p.id));

    // Execute in simulation
    for (const d of toDetach) {
      d.currentClubId = null;
      d.status = "departed";
    }
    for (const a of toAttach) {
      a.currentClubId = club.dbId;
      a.status = "first_team";
    }
    for (const r of toReassign) {
      r.currentClubId = club.dbId;
      r.status = "first_team";
    }
    for (const c of toCreate) {
      const newP = {
        id: `sim_new_${newPlayerIdCounter++}`,
        fullName: c.name,
        transfermarktId: c.tmId,
        dateOfBirth: c.dob ? new Date(c.dob) : null,
        currentClubId: club.dbId,
        currentClubName: club.tmName,
        status: "first_team",
      };
      simPlayers.push(newP);
      simByTmId.set(newP.transfermarktId, newP);
    }

    const postCount = simPlayers.filter((p) => p.currentClubId === club.dbId).length;
    const match = postCount === tmSquad.length;

    results.push({
      Club: club.tmName,
      "TM Target": tmSquad.length,
      "Initial DB": currentClubPlayers.length,
      Keep: toKeep.length,
      ATTACH: toAttach.length,
      REASSIGN: toReassign.length,
      CREATE: toCreate.length,
      DETACH: toDetach.length,
      "Final Count": postCount,
      Status: match ? "✅ PASS" : "❌ FAIL",
    });
  }

  console.table(results);

  console.log(`\nTotal New Players to Create in DB: ${toCreateList.length}`);
  if (toCreateList.length > 0) {
    console.table(toCreateList.slice(0, 30));
    if (toCreateList.length > 30) {
      console.log(`... and ${toCreateList.length - 30} more.`);
    }
  }

  const allPassed = results.every((r) => r.Status === "✅ PASS");
  console.log(`\nSimulation Result: ${allPassed ? "ALL 20 LALIGA CLUBS PASSED VERIFICATION! 100% MATCH!" : "SOME CLUBS FAILED"}`);

  fs.writeFileSync("scripts/laliga_simulation_results.json", JSON.stringify({ results, toCreateList }, null, 2), "utf-8");

  await prisma.$disconnect();
  await pool.end();
}

simulate().catch(console.error);
