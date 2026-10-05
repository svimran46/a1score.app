import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function run() {
  const conn = (process.env.DATABASE_URL || "").replace("?sslmode=require", "");
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("=== RODRI TRANSFERS IN DB ===");
  const rodri = await client.query(`
    SELECT t.id, t."fromClubName", t."toClubName", t.date, t."feeEur", t."transferType", p."fullName", p."transfermarktId"
    FROM "Transfer" t
    LEFT JOIN "Player" p ON t."playerId" = p.id
    WHERE t.id = 'trans-rodri-1790753937374' OR p."fullName" ILIKE '%Rodri%'
  `);
  console.table(rodri.rows);

  console.log("\n=== TOP 20 ALL-TIME TRANSFERS IN DB ===");
  const top20 = await client.query(`
    SELECT t.id, t."fromClubName", t."toClubName", t.date, t."feeEur", t."transferType", p."fullName", p."transfermarktId"
    FROM "Transfer" t
    LEFT JOIN "Player" p ON t."playerId" = p.id
    ORDER BY t."feeEur" DESC NULLS LAST
    LIMIT 20
  `);
  console.table(top20.rows);

  console.log("\n=== 10 MOST RECENT TRANSFERS WITH FEE >= 30M ===");
  const recentHigh = await client.query(`
    SELECT t.id, t."fromClubName", t."toClubName", t.date, t."feeEur", t."transferType", p."fullName", p."transfermarktId"
    FROM "Transfer" t
    LEFT JOIN "Player" p ON t."playerId" = p.id
    WHERE t."feeEur" >= 30000000 AND t.date <= '2026-10-04'
    ORDER BY t.date DESC
    LIMIT 10
  `);
  console.table(recentHigh.rows);

  await client.end();
}

run().catch(console.error);
