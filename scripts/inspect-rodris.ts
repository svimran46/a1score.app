import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const p1 = await prisma.player.findUnique({
    where: { id: "cmuihs1h00179h29eublo2l4q" },
  });
  const p2 = await prisma.player.findUnique({
    where: { id: "cmuihvzbj0784sexpy0rbk4pc" },
  });

  console.log("=== RODRI #1 (cmuihs1h00179h29eublo2l4q) ===");
  console.log(JSON.stringify(p1, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2));

  console.log("\n=== RODRI #2 (cmuihvzbj0784sexpy0rbk4pc) ===");
  console.log(JSON.stringify(p2, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
}

main().finally(() => prisma.$disconnect());
