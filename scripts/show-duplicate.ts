import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.player.findMany({
    select: { id: true, fullName: true, dateOfBirth: true, transfermarktId: true, currentClubId: true },
  });
  const map = new Map<string, any[]>();
  for (const x of p) {
    if (!x.dateOfBirth) continue;
    const k = x.fullName.toLowerCase().trim() + "|" + x.dateOfBirth.toISOString().split("T")[0];
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(x);
  }
  for (const [k, v] of map.entries()) {
    if (v.length > 1) {
      console.log("=== DUPLICATE FOUND ===");
      console.log("Key:", k);
      console.log("Records:", v);
    }
  }
}

main().finally(() => prisma.$disconnect());
