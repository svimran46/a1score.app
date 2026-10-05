import { Client } from "pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function run() {
  const conn = (process.env.DATABASE_URL || "").replace("?sslmode=require", "");
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("=== MBAPPÉ QUERY ===");
  const mbappeRes = await client.query(`
    SELECT p.id, p."fullName", p."updatedAt", p."latestMarketValue", MAX(m.date) as max_mv_date
    FROM "Player" p
    LEFT JOIN "MarketValueHistory" m ON m."playerId" = p.id
    WHERE p."fullName" ILIKE '%Mbapp%'
    GROUP BY p.id, p."fullName", p."updatedAt", p."latestMarketValue"
  `);
  console.log(mbappeRes.rows);

  console.log("\n=== PLAYER VALUE TIERS & DATES ===");
  const tierRes = await client.query(`
    SELECT
      CASE
        WHEN "latestMarketValue" >= 50000000 THEN 'Tier 1 (>= €50M)'
        WHEN "latestMarketValue" >= 20000000 THEN 'Tier 2 (€20M - €50M)'
        WHEN "latestMarketValue" >= 5000000 THEN 'Tier 3 (€5M - €20M)'
        ELSE 'Tier 4 (< €5M)'
      END AS tier,
      COUNT(*) AS total_count,
      COUNT(CASE WHEN "updatedAt" < NOW() - INTERVAL '7 days' THEN 1 END) AS older_than_7d,
      COUNT(CASE WHEN "updatedAt" < NOW() - INTERVAL '30 days' THEN 1 END) AS older_than_30d,
      COUNT(CASE WHEN "updatedAt" < NOW() - INTERVAL '60 days' THEN 1 END) AS older_than_60d
    FROM "Player"
    WHERE "latestMarketValue" IS NOT NULL
    GROUP BY tier
    ORDER BY MIN("latestMarketValue") DESC
  `);
  console.table(tierRes.rows);

  await client.end();
}

run().catch(console.error);
