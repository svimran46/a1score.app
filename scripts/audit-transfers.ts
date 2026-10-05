import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function run() {
  const conn = (process.env.DATABASE_URL || "").replace("?sslmode=require", "");
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("=== TOP 25 ALL-TIME TRANSFERS IN DB ===");
  const topRes = await client.query(`
    SELECT t.id, t."fromClubName", t."toClubName", t.date, t."feeEur", t."transferType", p."fullName", p."transfermarktId"
    FROM "Transfer" t
    LEFT JOIN "Player" p ON t."playerId" = p.id
    ORDER BY t."feeEur" DESC NULLS LAST
    LIMIT 25
  `);
  console.table(topRes.rows);

  console.log("\n=== SEARCH NEYMAR PLAYERS & TRANSFERS ===");
  const neymarPlayerRes = await client.query(`
    SELECT id, "fullName", "transfermarktId"
    FROM "Player"
    WHERE "fullName" ILIKE '%Neymar%'
  `);
  console.table(neymarPlayerRes.rows);

  const neymarRes = await client.query(`
    SELECT t.id, t."fromClubName", t."toClubName", t.date, t."feeEur", t."transferType", p."fullName"
    FROM "Transfer" t
    LEFT JOIN "Player" p ON t."playerId" = p.id
    WHERE p."fullName" ILIKE '%Neymar%'
  `);
  console.table(neymarRes.rows);

  console.log("\n=== SEARCH RODRI TRANSFERS (MAN CITY -> BARCELONA) ===");
  const rodriRes = await client.query(`
    SELECT t.id, t."fromClubName", t."toClubName", t.date, t."feeEur", t."transferType", p."fullName", p.id as pid
    FROM "Transfer" t
    LEFT JOIN "Player" p ON t."playerId" = p.id
    WHERE (p."fullName" ILIKE '%Rodri%' AND t."toClubName" ILIKE '%Barca%')
       OR (t."fromClubName" ILIKE '%Manchester City%' AND t."toClubName" ILIKE '%Barcel%')
       OR (p."fullName" ILIKE '%Rodri%' AND t."feeEur" >= 50000000)
  `);
  console.table(rodriRes.rows);

  console.log("\n=== DATES DISTRIBUTION / FUTURE DATES ===");
  const futureRes = await client.query(`
    SELECT t.id, t."fromClubName", t."toClubName", t.date, t."feeEur", t."transferType", p."fullName"
    FROM "Transfer" t
    LEFT JOIN "Player" p ON t."playerId" = p.id
    WHERE t.date > '2026-10-04'
    ORDER BY t.date DESC
    LIMIT 20
  `);
  console.table(futureRes.rows);

  console.log("\n=== DISTINCT TRANSFER TYPES IN DB ===");
  const typesRes = await client.query(`
    SELECT "transferType", count(*)
    FROM "Transfer"
    GROUP BY "transferType"
  `);
  console.table(typesRes.rows);

  console.log("\n=== UNKNOWN CLUBS & UNDISCLOSED FEES ===");
  const unknownRes = await client.query(`
    SELECT count(*) as total_unknown_or_undisclosed,
      COUNT(CASE WHEN "fromClubName" ILIKE '%unknown%' OR "toClubName" ILIKE '%unknown%' THEN 1 END) as unknown_club,
      COUNT(CASE WHEN ("fromClubName" ILIKE '%unknown%' OR "toClubName" ILIKE '%unknown%') AND ("feeEur" IS NULL OR "feeEur" = 0) THEN 1 END) as both_unknown_club_and_fee
    FROM "Transfer"
  `);
  console.table(unknownRes.rows);

  await client.end();
}

run().catch(console.error);
