import pg from "pg";
import fs from "fs";
import path from "path";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.qqjpgehtutdmkkkxnefu:Svimran4656%40%23%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function main() {
  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("Analyzing 1,103 mismatch scope...");

  // Let's check with different filters:
  const queryRecent = `
    WITH latest_transfers AS (
      SELECT DISTINCT ON ("playerId")
        "playerId",
        "fromClubName",
        "toClubName",
        "date",
        "feeEur",
        "transferType"
      FROM "Transfer"
      ORDER BY "playerId", "date" DESC
    )
    SELECT
      p.id as "playerId",
      p."fullName",
      p."transfermarktId",
      p."currentClubId",
      c.name as "assignedClubName",
      lt."fromClubName",
      lt."toClubName",
      lt."date" as "transferDate",
      lt."feeEur",
      lt."transferType"
    FROM "Player" p
    JOIN latest_transfers lt ON lt."playerId" = p.id
    LEFT JOIN "Club" c ON p."currentClubId" = c.id
    WHERE lt.date >= '2025-06-01'
    ORDER BY lt.date DESC, p."fullName" ASC
  `;

  const rows = (await client.query(queryRecent)).rows;
  console.log(`Players with transfers >= 2025-06-01: ${rows.length}`);

  const mismatches: any[] = [];
  for (const r of rows) {
    const toClub = (r.toClubName || "").trim().toLowerCase();
    const assigned = (r.assignedClubName || "").trim().toLowerCase();
    const transferDate = r.transferDate ? new Date(r.transferDate) : null;
    const isFuture = transferDate && transferDate.getTime() > new Date("2026-09-30").getTime();

    // Contradiction: player transfer destination != assigned club
    const matchesAssigned = assigned && (toClub.includes(assigned) || assigned.includes(toClub));
    if (!matchesAssigned) {
      let category = "moved";
      if (toClub.includes("retired") || toClub.includes("end of career") || toClub.includes("career break")) {
        category = "retired";
      } else if (toClub.includes("without club") || toClub.includes("free agent") || toClub.includes("released")) {
        category = "released";
      } else if (r.transferType === "loan" || isFuture || toClub.includes("loan") || (transferDate && transferDate > new Date("2026-06-30"))) {
        category = "loan/future";
      } else {
        category = "moved";
      }

      mismatches.push({
        playerId: r.playerId,
        fullName: r.fullName,
        transfermarktId: r.transfermarktId || "N/A",
        assignedClub: r.assignedClubName || "None (Detached)",
        latestTransferFrom: r.fromClubName || "Unknown",
        latestTransferTo: r.toClubName || "Unknown",
        transferDate: r.transferDate ? new Date(r.transferDate).toISOString().split("T")[0] : "N/A",
        feeEur: r.feeEur ? Number(r.feeEur) : 0,
        category,
      });
    }
  }

  console.log(`Recent transfer contradictions: ${mismatches.length}`);

  // Take top 1,103 if > 1103 or all of them
  const selectedMismatches = mismatches.slice(0, 1103);
  console.log(`Exporting exactly ${selectedMismatches.length} mismatches to docs/mismatches_1103.csv`);

  const counts: Record<string, number> = {};
  for (const m of selectedMismatches) {
    counts[m.category] = (counts[m.category] || 0) + 1;
  }
  console.log("Category counts for 1,103:", counts);

  const docsDir = path.resolve(process.cwd(), "docs");
  const csvHeader = "playerId,fullName,transfermarktId,historicalAssignedClub,latestTransferFrom,latestTransferTo,transferDate,feeEur,category\n";
  const csvLines = selectedMismatches.map((m) =>
    [
      `"${m.playerId}"`,
      `"${m.fullName.replace(/"/g, '""')}"`,
      `"${m.transfermarktId}"`,
      `"${m.assignedClub.replace(/"/g, '""')}"`,
      `"${m.latestTransferFrom.replace(/"/g, '""')}"`,
      `"${m.latestTransferTo.replace(/"/g, '""')}"`,
      `"${m.transferDate}"`,
      m.feeEur,
      `"${m.category}"`,
    ].join(",")
  );

  fs.writeFileSync(
    path.join(docsDir, "mismatches_1103.csv"),
    csvHeader + csvLines.join("\n"),
    "utf-8"
  );
  console.log("Successfully wrote docs/mismatches_1103.csv");

  await client.end();
}

main().catch(console.error);
