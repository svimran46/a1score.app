import fs from "fs";

const html = fs.readFileSync(
  "C:\\Users\\User\\.gemini\\antigravity\\brain\\223d7893-fb2b-4823-82bc-baa6f4c1e05c\\.system_generated\\steps\\4430\\content.md",
  "utf-8"
);

// In TM, each player row is inside <tr class="odd"> or <tr class="even">
// Let's split by <tr class="odd"> and <tr class="even">
const rows = html.split(/<tr class="(?:odd|even)">/);

console.log(`Found ${rows.length - 1} table row chunks`);

const squad: any[] = [];
for (let i = 1; i < rows.length; i++) {
  const chunk = rows[i].split("</tr>")[0];
  
  // Shirt number: <div class="rn_nummer">(\d+)</div>
  const numMatch = chunk.match(/<div class="rn_nummer">(\d+)<\/div>/);
  const number = numMatch ? numMatch[1] : "";

  // Player link & name: <a href="[^"]*\/profil\/spieler\/(\d+)"[^>]*>([^<]+)<\/a>
  // Note: there can be multiple links, usually the second or the one with class="hauptlink"
  const links = [...chunk.matchAll(/<a href="[^"]*\/profil\/spieler\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g)];
  let tmId = "";
  let name = "";
  for (const l of links) {
    const rawName = l[2].replace(/<[^>]*>/g, "").trim();
    if (rawName && !rawName.includes("injury") && !rawName.includes("Return") && !rawName.includes("captain")) {
      tmId = l[1];
      name = rawName;
    }
  }

  // Position: usually in <td>Position</td> or similar inside the inline-table
  const posMatch = chunk.match(/<td>(Goalkeeper|Centre-Back|Left-Back|Right-Back|Defensive Midfield|Central Midfield|Attacking Midfield|Right Winger|Left Winger|Second Striker|Centre-Forward)<\/td>/);
  const pos = posMatch ? posMatch[1] : "";

  // Age: <td class="zentriert">\s*([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})\s*\((\d+)\)\s*<\/td> or <td class="zentriert">(\d{2})<\/td>
  const ageMatch = chunk.match(/<td class="zentriert">.*?\((\d+)\)<\/td>/) || chunk.match(/<td class="zentriert">(\d{2})<\/td>/);
  const age = ageMatch ? ageMatch[1] : "";

  // Market Value: <td class="rechts hauptlink">[^<]*<a[^>]*>([^<]+)<\/a>
  const mvMatch = chunk.match(/<td class="rechts hauptlink"[^>]*>([\s\S]*?)<\/td>/);
  let mv = "";
  if (mvMatch) {
    mv = mvMatch[1].replace(/<[^>]*>/g, "").trim();
  }

  if (name) {
    squad.push({ number, name, tmId, pos, age, mv });
  }
}

console.log(`\nExtracted ${squad.length} Chelsea squad players from Transfermarkt:`);
squad.forEach((p, idx) => {
  console.log(`${String(idx + 1).padStart(2, " ")}. #${p.number.padStart(2, " ")} | ${p.name.padEnd(25, " ")} | Pos: ${p.pos.padEnd(18, " ")} | Age: ${p.age} | TM: ${p.tmId.padEnd(8, " ")} | Value: ${p.mv}`);
});
