import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL or DIRECT_URL environment variable.");
  process.exit(1);
}

async function main() {
  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("=== Auditing Transfer Dates & Last-Ingested Dates per League ===");
  const leagueQuery = `
    SELECT
      l.id,
      l.name as "leagueName",
      l."transfermarktId",
      COUNT(DISTINCT c.id) as "clubCount",
      COUNT(DISTINCT p.id) as "playerCount",
      MIN(t.date) as "minTransferDate",
      MAX(t.date) as "maxTransferDate",
      MAX(p."createdAt") as "playerCreatedAt",
      MAX(p."updatedAt") as "playerUpdatedAt",
      MAX(c."lastSyncedAt") as "clubLastSyncedAt"
    FROM "League" l
    LEFT JOIN "Club" c ON c."leagueId" = l.id
    LEFT JOIN "Player" p ON p."currentClubId" = c.id
    LEFT JOIN "Transfer" t ON t."playerId" = p.id
    GROUP BY l.id, l.name, l."transfermarktId"
    ORDER BY l.name
  `;

  const res = await client.query(leagueQuery);
  console.table(res.rows.map(r => ({
    League: r.leagueName,
    Clubs: r.clubCount,
    Players: r.playerCount,
    MinTransfer: r.minTransferDate ? new Date(r.minTransferDate).toISOString().split("T")[0] : "N/A",
    MaxTransfer: r.maxTransferDate ? new Date(r.maxTransferDate).toISOString().split("T")[0] : "N/A",
    PlayerCreated: r.playerCreatedAt ? new Date(r.playerCreatedAt).toISOString().split("T")[0] : "N/A",
    PlayerUpdated: r.playerUpdatedAt ? new Date(r.playerUpdatedAt).toISOString().split("T")[0] : "N/A",
    ClubLastSynced: r.clubLastSyncedAt ? new Date(r.clubLastSyncedAt).toISOString().split("T")[0] : "N/A",
  })));

  // Also global transfer stats
  const globalTransfers = await client.query(`
    SELECT
      COUNT(*) as "totalTransfers",
      MIN(date) as "minDate",
      MAX(date) as "maxDate",
      COUNT(CASE WHEN date > NOW() THEN 1 END) as "futureTransfersCount"
    FROM "Transfer"
  `);
  console.log("Global Transfer Stats:", globalTransfers.rows[0]);

  // Check players with currentClubId IS NULL
  const detachedStats = await client.query(`
    SELECT
      COUNT(*) as "detachedPlayersCount",
      COUNT(CASE WHEN status = 'departed' THEN 1 END) as "departedStatusCount",
      COUNT(CASE WHEN status = 'first_team' THEN 1 END) as "firstTeamStatusCount"
    FROM "Player"
    WHERE "currentClubId" IS NULL
  `);
  console.log("Detached Players Stats:", detachedStats.rows[0]);

  await client.end();
}

main().catch(console.error);
