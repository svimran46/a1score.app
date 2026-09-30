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

async function verifyUniqueness() {
  const plans = JSON.parse(fs.readFileSync("scripts/detailed_18_clubs_plan.json", "utf-8"));
  const createTmIds = plans.flatMap((p: any) => p.toCreate.map((c: any) => c.tmId));

  console.log(`Checking ${createTmIds.length} create TM IDs for uniqueness in DB...`);
  const existing = await prisma.player.findMany({
    where: { transfermarktId: { in: createTmIds } },
  });

  if (existing.length > 0) {
    console.error("❌ CONFLICT! Found existing players with create TM IDs:", existing);
  } else {
    console.log("✅ All 22 TM IDs are 100% unique and safe to insert!");
  }

  await prisma.$disconnect();
  await pool.end();
}

verifyUniqueness().catch(console.error);
