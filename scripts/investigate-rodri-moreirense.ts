import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function main() {
  const moreirenseId = "cmuihqgut00dbh29eg5w6uzl6";

  console.log("=== 1. PLAYERS AT MOREIRENSE FC IN DB ===");
  const moreirensePlayers = await prisma.player.findMany({
    where: { currentClubId: moreirenseId },
  });
  console.log(`Total players at Moreirense in DB: ${moreirensePlayers.length}`);
  const rodriAtMoreirense = moreirensePlayers.filter(
    (p) => p.fullName.toLowerCase().includes("rodri")
  );
  console.log(`Rodri matches at Moreirense in DB:`);
  for (const r of rodriAtMoreirense) {
    console.log(JSON.stringify({
      id: r.id,
      name: r.fullName,
      dob: r.dateOfBirth ? r.dateOfBirth.toISOString().split("T")[0] : null,
      pos: r.position,
      subPos: r.subPosition,
      tmId: r.transfermarktId,
      status: r.status,
    }, null, 2));
  }

  console.log("\n=== 2. AUDIT ROWS FOR MOREIRENSE RODRI ===");
  const auditFile = path.resolve(process.cwd(), "docs/ROSTER_VS_SOURCE_AUDIT.csv");
  const auditContent = fs.readFileSync(auditFile, "utf-8");
  const auditLines = auditContent.split(/\r?\n/).filter((l) => l.includes("Moreirense") && l.includes("Rodri"));
  for (const l of auditLines) {
    console.log(l);
  }

  console.log("\n=== 4. TRANSFERS & HISTORY FOR RODRI #1 & #2 ===");
  const rodri1Transfers = await prisma.transfer.findMany({
    where: { playerId: "cmuihs1h00179h29eublo2l4q" },
    orderBy: { date: "desc" },
  });
  console.log("Rodri #1 (8163) transfers in DB:", rodri1Transfers);

  const rodri2Transfers = await prisma.transfer.findMany({
    where: { playerId: "cmuihvzbj0784sexpy0rbk4pc" },
    orderBy: { date: "desc" },
  });
  console.log("Rodri #2 (357565) transfers in DB:", rodri2Transfers);

  const rodri1Stats = await prisma.seasonStats.findMany({
    where: { playerId: "cmuihs1h00179h29eublo2l4q" },
    orderBy: { season: "desc" },
  });
  console.log("Rodri #1 (8163) season stats in DB:", rodri1Stats);

  const rodri2Stats = await prisma.seasonStats.findMany({
    where: { playerId: "cmuihvzbj0784sexpy0rbk4pc" },
    orderBy: { season: "desc" },
  });
  console.log("Rodri #2 (357565) season stats in DB:", rodri2Stats);
}

main().finally(() => prisma.$disconnect());
