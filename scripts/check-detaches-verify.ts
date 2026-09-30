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

const reassignPlayerIds = new Set(rows.filter((r) => r.action === "REASSIGN").map((r) => r.playerId));

function getAge(dobStr: string | null | undefined, refDate = new Date("2026-09-30")): number | null {
  if (!dobStr) return null;
  const d = new Date(dobStr);
  if (isNaN(d.getTime())) return null;
  let age = refDate.getFullYear() - d.getFullYear();
  const m = refDate.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

const detachesToVerify: any[] = [];
const detaches = rows.filter((r) => r.action === "DETACH");

for (const d of detaches) {
  const mv = parseInt(d.marketValueEur || "0", 10);
  const age = getAge(d.dateOfBirth);
  const isHighValue = mv >= 10_000_000;
  const isYoung = age !== null && age <= 21;
  const hasReassign = reassignPlayerIds.has(d.playerId);

  if ((isHighValue || isYoung) && !hasReassign) {
    detachesToVerify.push({
      ...d,
      age: age ?? "unknown",
      verifyReason: isHighValue && isYoung
        ? `High market value (EUR ${mv.toLocaleString()}) and young age (${age})`
        : isHighValue
        ? `High market value (EUR ${mv.toLocaleString()}) >= 10M`
        : `Young age (${age}) <= 21`,
    });
  }
}

console.log("Total DETACH rows:", detaches.length);
console.log("Detaches to verify count:", detachesToVerify.length);

const outHeader = "clubId,clubName,playerId,fullName,marketValueEur,dateOfBirth,age,verifyReason\n";
const outLines = detachesToVerify.map(
  (r) => `"${r.clubId}","${r.clubName}","${r.playerId}","${r.fullName.replace(/"/g, '""')}",${r.marketValueEur},"${r.dateOfBirth}",${r.age},"${r.verifyReason}"`
);
fs.writeFileSync("detaches_to_verify.csv", outHeader + outLines.join("\n"), "utf-8");
console.log("Wrote detaches_to_verify.csv successfully.");
