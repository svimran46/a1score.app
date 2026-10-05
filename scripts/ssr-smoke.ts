/**
 * SSR smoke check — fetches list pages from a running production server and
 * verifies that real data rows exist in the INITIAL HTML (what crawlers see).
 *
 * Usage: npx tsx scripts/ssr-smoke.ts [baseUrl]
 * Default baseUrl: http://127.0.0.1:8080
 */
const BASE = process.argv[2] || "http://127.0.0.1:8080";

interface Check {
  path: string;
  // regex matching one "row" link in server HTML
  rowPattern: RegExp;
  minRows: number;
  mustContain?: string[];
  mustNotContain?: string[];
}

const CHECKS: Check[] = [
  { path: "/values", rowPattern: /href="\/players\/[a-z0-9-]+-\d+"/g, minRows: 20 },
  { path: "/players", rowPattern: /href="\/players\/[a-z0-9-]+-\d+"/g, minRows: 20 },
  { path: "/clubs", rowPattern: /href="\/clubs\/[a-z0-9-]+"/g, minRows: 20 },
  { path: "/leagues", rowPattern: /href="\/leagues\/[a-z0-9-]+"/g, minRows: 5 },
  {
    path: "/transfers",
    rowPattern: /href="\/players\/[a-z0-9-]+-\d+"/g,
    minRows: 20,
    mustContain: ["Neymar", "documented commercial fees from Transfermarkt"],
    mustNotContain: ["trans-rodri-1790753937374"],
  },
];

async function main() {
  let failed = 0;
  const rows: string[] = [];

  for (const c of CHECKS) {
    let status = 0;
    let html = "";
    try {
      const res = await fetch(BASE + c.path, { headers: { "user-agent": "ssr-smoke/1.0" } });
      status = res.status;
      html = await res.text();
    } catch (e) {
      rows.push(`| ${c.path} | ERR | 0 | FAIL (${(e as Error).message}) |`);
      failed++;
      continue;
    }

    const count = new Set(html.match(c.rowPattern) || []).size;
    const problems: string[] = [];
    if (status !== 200) problems.push(`status ${status}`);
    if (count < c.minRows) problems.push(`rows ${count} < ${c.minRows}`);
    for (const s of c.mustContain || []) if (!html.includes(s)) problems.push(`missing "${s}"`);
    for (const s of c.mustNotContain || []) if (html.includes(s)) problems.push(`contains "${s}"`);
    if (/>N\/A</.test(html)) problems.push(`renders "N/A"`);

    if (problems.length) failed++;
    rows.push(`| ${c.path} | ${status} | ${count} | ${problems.length ? "FAIL: " + problems.join("; ") : "PASS"} |`);
  }

  // Sitemap: lastmod must vary per entity and never be in the future
  try {
    const xml = await (await fetch(BASE + "/sitemap.xml")).text();
    const urls = (xml.match(/<url>/g) || []).length;
    const mods = xml.match(/<lastmod>([^<]+)<\/lastmod>/g)?.map((m) => m.replace(/<\/?lastmod>/g, "")) || [];
    const distinct = new Set(mods).size;
    const now = Date.now() + 60_000;
    const future = mods.filter((m) => new Date(m).getTime() > now).length;
    const counts: Record<string, number> = {};
    mods.forEach((m) => (counts[m] = (counts[m] || 0) + 1));
    const topShare = mods.length ? Math.max(...Object.values(counts)) / mods.length : 0;
    const problems: string[] = [];
    if (future) problems.push(`${future} future lastmod`);
    if (mods.length > 20 && topShare > 0.5) problems.push(`${Math.round(topShare * 100)}% share one lastmod`);
    if (problems.length) failed++;
    rows.push(
      `| /sitemap.xml | — | ${urls} urls, ${mods.length} with lastmod, ${distinct} distinct, top share ${Math.round(topShare * 100)}% | ${problems.length ? "FAIL: " + problems.join("; ") : "PASS"} |`
    );
  } catch (e) {
    failed++;
    rows.push(`| /sitemap.xml | ERR | — | FAIL (${(e as Error).message}) |`);
  }

  console.log("| Route | HTTP | Unique row links in initial HTML | Result |");
  console.log("|---|---|---|---|");
  rows.forEach((r) => console.log(r));
  process.exit(failed ? 1 : 0);
}

main();
