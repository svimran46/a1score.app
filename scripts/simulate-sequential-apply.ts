import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
import { parseMarketValue } from "./parse-tm-squad-detailed";
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
  const clubs = JSON.parse(fs.readFileSync("scripts/mapped_epl_clubs.json", "utf-8"));
  const allSquads = JSON.parse(fs.readFileSync("scripts/tm_epl_all_squads_detailed_2026.json", "utf-8"));

  const remaining = clubs.filter((c: any) => c.tmId !== "11" && c.tmId !== "631");

  console.log("Loading all database players for in-memory simulation...");
  const rawPlayers = await prisma.player.findMany({
    include: { currentClub: true },
  });
  console.log(`Loaded ${rawPlayers.length} players from database.`);

  // Create mutable in-memory simulation state
  const simPlayers = rawPlayers.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    transfermarktId: p.transfermarktId,
    dateOfBirth: p.dateOfBirth,
    currentClubId: p.currentClubId,
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

  console.log("\n=================== STARTING SEQUENTIAL SIMULATION ===================");

  const results: any[] = [];

  for (const club of remaining) {
    const tmSquad = allSquads[club.tmId] || [];
    // 1. Current DB roster at this moment in simulation
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

    // Outgoing: players currently at this club who are not in TM squad
    const toDetach = currentClubPlayers.filter((p) => !matchedSimPlayerIds.has(p.id));

    // Execute in simulation
    // 1. Detach
    for (const d of toDetach) {
      d.currentClubId = null;
      d.status = "departed";
    }
    // 2. Attach
    for (const a of toAttach) {
      a.currentClubId = club.dbId;
      a.status = "first_team";
    }
    // 3. Reassign
    for (const r of toReassign) {
      r.currentClubId = club.dbId;
      r.status = "first_team";
    }
    // 4. Create
    for (const c of toCreate) {
      const newP = {
        id: `sim_new_${newPlayerIdCounter++}`,
        fullName: c.name,
        transfermarktId: c.tmId,
        dateOfBirth: c.dob ? new Date(c.dob) : null,
        currentClubId: club.dbId,
        status: "first_team",
      };
      simPlayers.push(newP);
      simByTmId.set(newP.transfermarktId, newP);
    }

    // Verify post-apply count
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

  const allPassed = results.every((r) => r.Status === "✅ PASS");
  console.log(`\nSimulation Result: ${allPassed ? "ALL 18 CLUBS PASSED VERIFICATION! 100% MATCH!" : "SOME CLUBS FAILED"}`);

  await prisma.$disconnect();
  await pool.end();
}

simulate().catch(console.error);
