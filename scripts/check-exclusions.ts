import fs from "fs";

const content = fs.readFileSync("audit_epl_changes.csv", "utf-8");
const lines = content.split(/\r?\n/).filter(Boolean);
const header = lines[0].split(",").map((s) => s.replace(/^"|"$/g, ""));
const rows = lines.slice(1).map((l) => {
  const m: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (c === '"') q = !q;
    else if (c === "," && !q) {
      m.push(cur.replace(/^"|"$/g, ""));
      cur = "";
    } else {
      cur += c;
    }
  }
  m.push(cur.replace(/^"|"$/g, ""));
  const obj: Record<string, string> = {};
  header.forEach((h, i) => (obj[h] = m[i] || ""));
  return obj;
});

const koumas = rows.filter((r) => r.fullName.toLowerCase().includes("koumas"));
console.log("Koumas rows:", JSON.stringify(koumas, null, 2));

const variantNames = [
  "emegha",
  "yarmol",
  "alcaraz",
  "livramento",
  "burn",
  "willock",
];
const variants = rows.filter((r) =>
  variantNames.some((v) => r.fullName.toLowerCase().includes(v))
);
console.log("Variant rows:", variants.map((v) => `${v.clubName} | ${v.fullName} | ${v.action}`));

const specificSkips = rows.filter((r) =>
  r.fullName.includes("Savinho") ||
  r.fullName.includes("Marmoush") ||
  r.fullName.includes("Iliman Ndiaye") ||
  r.fullName.includes("Mandas")
);
console.log("Specific skips:", specificSkips.map((s) => `${s.clubName} | ${s.fullName} | ${s.action}`));
