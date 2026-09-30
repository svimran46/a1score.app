import fs from "fs";
import path from "path";

const csvFiles = [
  "applied_epl_changes.csv",
  "applied_laliga_changes.csv",
  "applied_seriea_changes.csv",
  "applied_ligue1_changes.csv",
  "applied_bundesliga_changes.csv",
  "applied_portugal_changes.csv",
];

console.log("=== AUDITING CSV FILES INTEGRITY ===");

for (const f of csvFiles) {
  if (!fs.existsSync(f)) {
    console.log(`❌ Missing file: ${f}`);
    continue;
  }
  const content = fs.readFileSync(f, "utf-8");
  const lines = content.trim().split("\n");
  const header = lines[0];
  const rows = lines.slice(1);

  let actions: Record<string, number> = {};
  let emptyPlayerIds = 0;
  let malformedLines = 0;

  for (let i = 0; i < rows.length; i++) {
    const line = rows[i];
    // CSV with quotes
    const cols = line.split('","').map((c) => c.replace(/^"|"$/g, ""));
    if (cols.length < 10) {
      malformedLines++;
      continue;
    }
    const action = cols[5];
    const playerId = cols[3];
    if (!playerId) emptyPlayerIds++;
    actions[action] = (actions[action] || 0) + 1;
  }

  console.log(`\n📄 ${f}:`);
  console.log(`   Total Rows: ${rows.length}`);
  console.log(`   Actions:`, actions);
  console.log(`   Empty Player IDs: ${emptyPlayerIds}`);
  console.log(`   Malformed Lines: ${malformedLines}`);
}
