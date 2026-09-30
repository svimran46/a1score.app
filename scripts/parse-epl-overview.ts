import fs from "fs";

const content = fs.readFileSync(
  "C:\\Users\\User\\.gemini\\antigravity\\brain\\223d7893-fb2b-4823-82bc-baa6f4c1e05c\\.system_generated\\steps\\4503\\content.md",
  "utf-8"
);

// Find all verein links
// Pattern: /verein/(\d+) or href=".../verein/(\d+)/saison_id/..."
const matches = [...content.matchAll(/<a[^>]*href="([^"]*\/startseite\/verein\/(\d+)[^"]*)"[^>]*>([^<]*)<\/a>/g)];

console.log(`Found ${matches.length} club links:`);
const clubs = new Map<string, { name: string; url: string }>();

for (const m of matches) {
  const url = m[1];
  const tmId = m[2];
  const name = m[3].trim();
  if (name && !clubs.has(tmId)) {
    clubs.set(tmId, { name, url });
  }
}

for (const [id, c] of clubs.entries()) {
  console.log(`- TM ID: ${id.padEnd(6, " ")} | ${c.name.padEnd(30, " ")} | ${c.url}`);
}
