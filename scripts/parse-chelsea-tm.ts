import fs from "fs";

const html = fs.readFileSync(
  "C:\\Users\\User\\.gemini\\antigravity\\brain\\223d7893-fb2b-4823-82bc-baa6f4c1e05c\\.system_generated\\steps\\4430\\content.md",
  "utf-8"
);

// Search for player links in the table
// Pattern typically: href=".../profil/spieler/[0-9]+" ... title="[Name]" or text
const playerMatches = [...html.matchAll(/class="inline-table"[\s\S]*?<a href="[^"]*\/profil\/spieler\/(\d+)"[^>]*>([^<]+)<\/a>/g)];

console.log(`Found ${playerMatches.length} players via inline-table:`);
for (const m of playerMatches) {
  console.log(`- TM ID: ${m[1]} | Name: ${m[2].trim()}`);
}

if (playerMatches.length === 0) {
  // Try broader match
  const broadMatches = [...html.matchAll(/<a class="[^"]*" title="([^"]*)" href="[^"]*\/profil\/spieler\/(\d+)">/g)];
  console.log(`Found ${broadMatches.length} via title regex:`);
  for (const m of broadMatches.slice(0, 40)) {
    console.log(`- TM ID: ${m[2]} | Name: ${m[1]}`);
  }
}
