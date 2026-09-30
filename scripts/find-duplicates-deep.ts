import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { EPL_CLUBS, normalizeName, formatDate } from "./audit-epl-read-only";

async function main() {
  const eplClubIds = new Set(EPL_CLUBS.map((c) => c.id));
  const clubs = await prisma.club.findMany();
  const clubMap = new Map(clubs.map((c) => [c.id, c.name]));

  const allPlayers = await prisma.player.findMany({
    select: {
      id: true,
      fullName: true,
      dateOfBirth: true,
      transfermarktId: true,
      currentClubId: true,
      status: true,
    },
  });

  console.log(`Checking duplicates across ${allPlayers.length} players...`);

  // 1. Same TM ID
  const byTmId = new Map<string, any[]>();
  for (const p of allPlayers) {
    if (p.transfermarktId && p.transfermarktId !== "N/A" && p.transfermarktId.trim() !== "") {
      if (!byTmId.has(p.transfermarktId)) byTmId.set(p.transfermarktId, []);
      byTmId.get(p.transfermarktId)!.push(p);
    }
  }

  const dupTmId: any[] = [];
  for (const [tmId, list] of byTmId.entries()) {
    if (list.length > 1) {
      dupTmId.push({ tmId, list });
    }
  }
  console.log(`Duplicate TM IDs found across DB: ${dupTmId.length}`);
  for (const d of dupTmId) {
    console.log(`TM ID ${d.tmId}:`, d.list.map((p: any) => `${p.fullName} (${p.id}) [${clubMap.get(p.currentClubId) || "none"}]`));
  }

  // 2. Same Name + DoB
  const byNameAndDob = new Map<string, any[]>();
  for (const p of allPlayers) {
    if (!p.dateOfBirth) continue;
    const key = `${normalizeName(p.fullName)}|${formatDate(p.dateOfBirth)}`;
    if (!byNameAndDob.has(key)) byNameAndDob.set(key, []);
    byNameAndDob.get(key)!.push(p);
  }

  const dupNameDob: any[] = [];
  for (const [key, list] of byNameAndDob.entries()) {
    if (list.length > 1) {
      dupNameDob.push({ key, list });
    }
  }
  console.log(`Duplicate Name+DoB found across DB: ${dupNameDob.length}`);
  for (const d of dupNameDob) {
    const involvesEpl = d.list.some((p: any) => p.currentClubId && eplClubIds.has(p.currentClubId));
    if (involvesEpl) {
      console.log(`EPL involved: ${d.key}:`, d.list.map((p: any) => `${p.fullName} (${p.id}) [${clubMap.get(p.currentClubId) || "none"}] TM:${p.transfermarktId}`));
    }
  }

  // 3. Same Name at Same Club
  const byClubAndName = new Map<string, any[]>();
  for (const p of allPlayers) {
    if (!p.currentClubId) continue;
    const key = `${p.currentClubId}|${normalizeName(p.fullName)}`;
    if (!byClubAndName.has(key)) byClubAndName.set(key, []);
    byClubAndName.get(key)!.push(p);
  }

  const dupSameClub: any[] = [];
  for (const [key, list] of byClubAndName.entries()) {
    if (list.length > 1) {
      dupSameClub.push({ key, list });
    }
  }
  console.log(`Same name at same club found across DB: ${dupSameClub.length}`);
  for (const d of dupSameClub) {
    const cId = d.key.split("|")[0];
    const isEpl = eplClubIds.has(cId);
    console.log(`[${isEpl ? "EPL" : "Other"}] ${clubMap.get(cId)} - ${d.list[0].fullName}:`, d.list.map((p: any) => `${p.id} (TM: ${p.transfermarktId})`));
  }
}

main().finally(() => prisma.$disconnect());
