import fs from "fs";
import path from "path";

const TOP_6_CLUB_IDS = new Set([
  "cmuihq3vs0069h29ebm5xqhye", // Manchester City
  "cmuiho5do001hb23froc57owj", // Arsenal FC
  "cmuihpzls003ph29em78a0y7v", // Arsenal FC (alias in top 6 csv)
  "cmuihq9wg009hh29ermlar2c7", // Real Madrid
  "cmuihoy3o002vb23f8egwo6vd", // FC Barcelona
  "cmuihq3qa0061h29eyxx4xw43", // Bayern Munich
  "cmuihqbws00ajh29e1ujz5fht", // Paris Saint-Germain
]);

function parseCsv(content: string) {
  const lines = content.split("\n").filter(l => l.trim().length > 0);
  const header = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Basic CSV regex parser to handle quoted strings with commas
    const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
    const matches: string[] = [];
    let match;
    let line = lines[i];
    // Simple split if no escaped commas or standard split
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cols.push(cur.trim().replace(/^"|"$/g, ""));
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim().replace(/^"|"$/g, ""));
    const obj: any = {};
    for (let h = 0; h < header.length; h++) {
      obj[header[h]] = cols[h] || "";
    }
    rows.push(obj);
  }
  return rows;
}

async function main() {
  const auditPath = path.resolve(process.cwd(), "docs/ROSTER_VS_SOURCE_AUDIT.csv");
  const top6Path = path.resolve(process.cwd(), "docs/TOP_6_CLUBS_ROSTER.csv");

  const auditRows = parseCsv(fs.readFileSync(auditPath, "utf-8"));
  const top6Rows = parseCsv(fs.readFileSync(top6Path, "utf-8"));

  console.log(`Loaded ${auditRows.length} audit rows and ${top6Rows.length} top 6 rows.`);

  const relevantAudit = auditRows.filter(r =>
    TOP_6_CLUB_IDS.has(r.assignedClubId) || TOP_6_CLUB_IDS.has(r.sourceCurrentClubId)
  );
  console.log(`Relevant audit rows for Top 6: ${relevantAudit.length}`);

  const byClub: Record<string, any[]> = {};
  for (const r of relevantAudit) {
    const c = TOP_6_CLUB_IDS.has(r.assignedClubId) ? r.assignedClubName : r.sourceCurrentClubName;
    if (!byClub[c]) byClub[c] = [];
    byClub[c].push(r);
  }

  for (const [c, list] of Object.entries(byClub)) {
    console.log(`Club ${c}: ${list.length} rows`);
    for (const item of list.slice(0, 3)) {
      console.log(`  - ${item.fullName} | action: ${item.action} | assigned: ${item.assignedClubName} -> source: ${item.sourceCurrentClubName}`);
    }
  }
}

main().catch(console.error);
