import fs from "fs";

const plans = JSON.parse(fs.readFileSync("scripts/detailed_18_clubs_plan.json", "utf-8"));

console.log("=== CHECKING CROSS-CLUB REASSIGNMENTS ===");
const allReassigns: any[] = [];
for (const p of plans) {
  for (const r of p.toReassign) {
    allReassigns.push({
      player: r.name,
      id: r.id,
      fromClub: r.fromClub,
      fromClubId: r.fromClubId,
      toClub: p.clubName,
      toClubId: p.clubId,
    });
  }
}

console.log(`Total Reassignments across 18 clubs: ${allReassigns.length}`);
console.table(allReassigns);

// Check if any player being reassigned is ALSO in toDetach of their fromClub
let crossCount = 0;
for (const r of allReassigns) {
  const fromClubPlan = plans.find((p: any) => p.clubId === r.fromClubId);
  if (fromClubPlan) {
    const isDetachedInFrom = fromClubPlan.toDetach.some((d: any) => d.id === r.id);
    console.log(`Player [${r.player}] (${r.id}): from ${r.fromClub} -> to ${r.toClub} | In fromClub toDetach? ${isDetachedInFrom ? "YES (DUAL)" : "NO"}`);
    if (isDetachedInFrom) crossCount++;
  }
}

console.log(`\nTotal dual appearances (REASSIGN at one, DETACH at another): ${crossCount}`);
