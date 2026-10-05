import fs from "fs";
import path from "path";

const patterns = [
  { name: "real-time", regex: /\breal-time\b/i },
  { name: "realtime", regex: /\brealtime\b/i },
  { name: "live updates", regex: /live updates/i },
  { name: "every 5s", regex: /every 5s/i },
  { name: "5s", regex: /\b5s\b/i },
  { name: "live scores", regex: /live scores/i },
  { name: "instant", regex: /\binstant\b/i },
];

const targetDirs = ["src", "public", "docs", "README.md", "DESIGN.md"];
const extensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".html", ".webmanifest"];

interface Hit {
  file: string;
  line: number;
  pattern: string;
  text: string;
}

const hits: Hit[] = [];

function search(target: string) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    searchFile(target);
    return;
  }
  const files = fs.readdirSync(target);
  for (const f of files) {
    if (f === "node_modules" || f === ".next" || f === ".git") continue;
    const full = path.join(target, f);
    const s = fs.statSync(full);
    if (s.isDirectory()) {
      search(full);
    } else {
      searchFile(full);
    }
  }
}

function searchFile(filePath: string) {
  const ext = path.extname(filePath);
  if (!extensions.includes(ext) && !filePath.endsWith(".webmanifest")) return;
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    for (const p of patterns) {
      if (p.regex.test(line)) {
        hits.push({
          file: filePath.replace(/\\/g, "/"),
          line: idx + 1,
          pattern: p.name,
          text: line.trim(),
        });
        break;
      }
    }
  });
}

for (const d of targetDirs) {
  search(d);
}

fs.writeFileSync("scripts/copy_search_results.json", JSON.stringify(hits, null, 2));
console.log(`Scan finished. Found ${hits.length} hits across files.`);
