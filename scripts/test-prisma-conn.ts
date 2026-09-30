import { prisma } from "../src/lib/prisma";

async function main() {
  const count = await prisma.club.count();
  console.log(`Prisma connected successfully! Total clubs in DB: ${count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
