import fs from "fs";

const plans = JSON.parse(fs.readFileSync("scripts/detailed_18_clubs_plan.json", "utf-8"));

console.log("=== INSPECTING ALL 22 PLAYERS TO CREATE ===");
let count = 0;
for (const p of plans) {
  for (const c of p.toCreate) {
    count++;
    console.log(`${count}. [${p.clubName}] ${c.name} | TM: ${c.tmId} | Pos: ${c.pos} | DoB: ${c.dob} | Nat: ${JSON.stringify(c.nationality)} | MV: ${c.mvRaw}`);
  }
}
