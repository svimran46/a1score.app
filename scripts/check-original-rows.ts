import fs from "fs";
import path from "path";

// Read original detaches_to_verify.csv
const originalCsv = fs.readFileSync("detaches_to_verify.csv", "utf-8");
const originalLines = originalCsv.split(/\r?\n/).filter(Boolean);
const originalHeader = originalLines[0].split(",").map((s) => s.replace(/^"|"$/g, "").trim());
const originalRows = originalLines.slice(1).map((l) => {
  const cols = l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((s) => s.replace(/^"|"$/g, "").trim());
  const obj: Record<string, string> = {};
  originalHeader.forEach((h, i) => (obj[h] = cols[i] || ""));
  return obj;
});

console.log(`Original rows count: ${originalRows.length}`);
console.log("First player:", originalRows[0].fullName);
console.log("Last player:", originalRows[originalRows.length - 1].fullName);
