import fs from "fs";

const html = fs.readFileSync(
  "C:\\Users\\User\\.gemini\\antigravity\\brain\\223d7893-fb2b-4823-82bc-baa6f4c1e05c\\.system_generated\\steps\\4430\\content.md",
  "utf-8"
);

// Search for all rows in table.items
const tableMatch = html.match(/<table class="items">([\s\S]*?)<\/table>/);
if (tableMatch) {
  const tableContent = tableMatch[1];
  const trMatches = [...tableContent.matchAll(/<tr class="(?:odd|even)">([\s\S]*?)<\/tr>/g)];
  console.log(`Found ${trMatches.length} rows in table.items:`);
  
  for (const tr of trMatches) {
    const row = tr[1];
    const numberMatch = row.match(/<div class="rn_nummer">(\d+)<\/div>/);
    const playerLink = row.match(/<a href="[^"]*\/profil\/spieler\/(\d+)"[^>]*>([^<]+)<\/a>/);
    const posMatch = row.match(/<td>([^<]+)<\/td>\s*<\/tr>/) || row.match(/class="inline-table"[\s\S]*?<tr>\s*<td>([^<]+)<\/td>/);
    const ageMatch = row.match(/<td class="zentriert">(\d{2})<\/td>/);
    const valueMatch = row.match(/<td class="rechts hauptlink">([^<]+)<\/td>/);

    const number = numberMatch ? numberMatch[1] : "";
    const tmId = playerLink ? playerLink[1] : "";
    const name = playerLink ? playerLink[2].trim() : "";
    const age = ageMatch ? ageMatch[1] : "";
    const value = valueMatch ? valueMatch[1].trim() : "";
    console.log(`#${number.padStart(2, " ")} | ${name.padEnd(25, " ")} | TM: ${tmId.padEnd(8, " ")} | Age: ${age} | Value: ${value}`);
  }
} else {
  console.log("No table.items found");
}
