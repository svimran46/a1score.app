import fs from "fs";

const plans = JSON.parse(fs.readFileSync("scripts/detailed_18_clubs_plan.json", "utf-8"));
const allSquads = JSON.parse(fs.readFileSync("scripts/tm_epl_all_squads_detailed_2026.json", "utf-8"));

console.log("Checking if any matched player had different TM ID or matched by name:");
for (const p of plans) {
  const squad = allSquads[p.tmId] || [];
  const squadTmIds = new Set(squad.map((x: any) => x.tmId));
  for (const a of p.toAttach) {
    if (!squadTmIds.has(a.tmId)) {
      console.log(`Attach mismatch: ${a.name} (TM ${a.tmId})`);
    }
  }
  for (const r of p.toReassign) {
    if (!squadTmIds.has(r.tmId)) {
      console.log(`Reassign mismatch: ${r.name} (TM ${r.tmId})`);
    }
  }
}
console.log("Done checking.");
