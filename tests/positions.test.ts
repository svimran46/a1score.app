import { getCanonicalPosition } from "../src/lib/positions";

const sample30 = [
  { raw: "Goalkeeper", expectedGroup: "GK", expectedDetailed: "Goalkeeper" },
  { raw: "Torwart", expectedGroup: "GK", expectedDetailed: "Goalkeeper" },
  { raw: "Centre-Back", expectedGroup: "DEF", expectedDetailed: "Centre-Back" },
  { raw: "Center-Back", expectedGroup: "DEF", expectedDetailed: "Centre-Back" },
  { raw: "Left-Back", expectedGroup: "DEF", expectedDetailed: "Left-Back" },
  { raw: "Right-Back", expectedGroup: "DEF", expectedDetailed: "Right-Back" },
  { raw: "Defender", expectedGroup: "DEF", expectedDetailed: "Defender" },
  { raw: "Defensive Midfield", expectedGroup: "MID", expectedDetailed: "Defensive Midfield" },
  { raw: "Central Midfield", expectedGroup: "MID", expectedDetailed: "Central Midfield" },
  { raw: "Attacking Midfield", expectedGroup: "MID", expectedDetailed: "Attacking Midfield" },
  { raw: "Left Midfield", expectedGroup: "MID", expectedDetailed: "Left Midfield" },
  { raw: "Right Midfield", expectedGroup: "MID", expectedDetailed: "Right Midfield" },
  { raw: "Midfield", expectedGroup: "MID", expectedDetailed: "Midfield" },
  { raw: "Left Winger", expectedGroup: "ATT", expectedDetailed: "Left Winger" },
  { raw: "Right Winger", expectedGroup: "ATT", expectedDetailed: "Right Winger" },
  { raw: "Second Striker", expectedGroup: "ATT", expectedDetailed: "Second Striker" },
  { raw: "Centre-Forward", expectedGroup: "ATT", expectedDetailed: "Centre-Forward" },
  { raw: "Attack", expectedGroup: "ATT", expectedDetailed: "Forward" },
  { raw: "Forward", expectedGroup: "ATT", expectedDetailed: "Forward" },
  // Player specific positions:
  { raw: "Erling Haaland (Centre-Forward)", expectedGroup: "ATT", expectedDetailed: "Centre-Forward" },
  { raw: "Lamine Yamal (Right Winger)", expectedGroup: "ATT", expectedDetailed: "Right Winger" },
  { raw: "Vinicius Junior (Left Winger)", expectedGroup: "ATT", expectedDetailed: "Left Winger" },
  { raw: "Jude Bellingham (Attacking Midfield)", expectedGroup: "MID", expectedDetailed: "Attacking Midfield" },
  { raw: "Declan Rice (Defensive Midfield)", expectedGroup: "MID", expectedDetailed: "Defensive Midfield" },
  { raw: "Vitinha (Central Midfield)", expectedGroup: "MID", expectedDetailed: "Central Midfield" },
  { raw: "Josko Gvardiol (Centre-Back)", expectedGroup: "DEF", expectedDetailed: "Centre-Back" },
  { raw: "Rico Lewis (Right-Back)", expectedGroup: "DEF", expectedDetailed: "Right-Back" },
  { raw: "Nico O'Reilly (Left-Back)", expectedGroup: "DEF", expectedDetailed: "Left-Back" },
  { raw: "Gianluigi Donnarumma (Goalkeeper)", expectedGroup: "GK", expectedDetailed: "Goalkeeper" },
  { raw: "Matheus Nunes (Right-Back)", expectedGroup: "DEF", expectedDetailed: "Right-Back" },
  { raw: "Matheus Nunes (Central Midfield)", expectedGroup: "MID", expectedDetailed: "Central Midfield" },
  { raw: "Elliot Anderson (Defensive Midfield)", expectedGroup: "MID", expectedDetailed: "Defensive Midfield" },
];

let failed = 0;
for (const s of sample30) {
  const result = getCanonicalPosition(s.raw);
  if (result.group !== s.expectedGroup) {
    console.error(`FAIL: ${s.raw} -> got ${result.group}, expected ${s.expectedGroup}`);
    failed++;
  } else {
    console.log(`PASS: "${s.raw}" => [${result.group}] ${result.detailed}`);
  }
}

if (failed === 0) {
  console.log(`\nALL ${sample30.length} POSITION CHECKS PASSED.`);
} else {
  process.exit(1);
}
