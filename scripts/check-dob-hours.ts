import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const sample = await prisma.player.findMany({
    where: {
      dateOfBirth: { not: null },
      currentClubId: "cmuiho5do001hb23froc57owj",
    },
    take: 10,
    select: { fullName: true, dateOfBirth: true },
  });

  for (const p of sample) {
    const d = p.dateOfBirth!;
    console.log(p.fullName, '=> ISO:', d.toISOString(), 'Hours UTC:', d.getUTCHours());
  }
}

main().finally(() => prisma.$disconnect());
