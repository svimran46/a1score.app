import fs from "fs";

const epl = JSON.parse(fs.readFileSync("scripts/tm_epl_all_squads_detailed_2026.json", "utf-8"));
const ligue1 = JSON.parse(fs.readFileSync("scripts/tm_ligue1_all_squads_detailed_2026.json", "utf-8"));

console.log("Man City (281) in TM:");
const city = epl["281"] || [];
console.log(city.filter((p: any) => p.name.toLowerCase().includes("allan")));

console.log("\nPSG (583) in TM:");
const psg = ligue1["583"] || [];
console.log(psg.filter((p: any) => p.name.toLowerCase().includes("longoni")));

console.log("\nArsenal (11) in TM:");
const ars = epl["11"] || [];
console.log(ars.filter((p: any) => p.name.toLowerCase().includes("tzolis")));
