import fs from "fs";

const html = fs.readFileSync(
  "C:\\Users\\User\\.gemini\\antigravity\\brain\\223d7893-fb2b-4823-82bc-baa6f4c1e05c\\.system_generated\\steps\\4430\\content.md",
  "utf-8"
);

// Find all occurrences of spieler/ in content.md
const matches = [...html.matchAll(/\/profil\/spieler\/(\d+)/g)];
const uniqueIds = [...new Set(matches.map(m => m[1]))];
console.log(`Found ${uniqueIds.length} unique spieler IDs:`);

for (const id of uniqueIds) {
  // Find nearby text
  const idx = html.indexOf(`/profil/spieler/${id}`);
  const snippet = html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 200));
  const nameMatch = snippet.match(/title="([^"]*)"/) || snippet.match(/>([^<]+)<\/a>/);
  console.log(`- ID: ${id} | Name: ${nameMatch ? nameMatch[1] : "unknown"}`);
}
