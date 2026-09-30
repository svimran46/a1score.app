import fs from "fs";

const html = fs.readFileSync("scripts/gb1_2026.html", "utf-8");

const tableMatch = html.match(/<table class="items">([\s\S]*?)<\/table>/);
if (!tableMatch) {
  console.log("Could not find table.items");
  process.exit(1);
}

const tableHtml = tableMatch[1];
const rows = tableHtml.split(/<tr class="(?:odd|even)">/);
console.log(`Found ${rows.length - 1} rows in table.items`);

interface ClubItem {
  tmId: string;
  name: string;
  squadUrl: string;
}

const clubs: ClubItem[] = [];

for (let i = 1; i < rows.length; i++) {
  const r = rows[i].split("</tr>")[0];
  // Match link inside td.hauptlink
  const m = r.match(/<td class="hauptlink no-border-links">\s*<a[^>]*href="([^"]*\/verein\/(\d+)[^"]*)"[^>]*>([^<]+)<\/a>/i);
  if (m) {
    const rawUrl = m[1];
    const tmId = m[2];
    const name = m[3].trim();
    const squadUrl = `https://www.transfermarkt.com${rawUrl}`;
    clubs.push({ tmId, name, squadUrl });
  }
}

console.log(`Parsed ${clubs.length} clubs:`);
console.table(clubs);

fs.writeFileSync("scripts/tm_epl_clubs_2026.json", JSON.stringify(clubs, null, 2), "utf-8");
