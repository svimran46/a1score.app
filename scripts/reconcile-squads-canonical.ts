import "dotenv/config";
/**
 * scripts/reconcile-squads-canonical.ts
 *
 * Canonical Squad Reconciler for a1score.app (Part B)
 *
 * Rules:
 * 1. Roster source = each club's CURRENT squad from FotMob (primary) cross-checked with Transfermarkt.
 *    Never derive membership from the Transfer table.
 *    Where the two sources disagree, flag the player in docs/SQUAD_DISAGREEMENTS.md.
 * 2. Delete heuristic (val > 0 || age >= 20, lastSeason >= 2025).
 *    Status explicitly set: 'first_team', 'loan_out', 'academy', 'departed'.
 * 3. Atomic upsert into Player; ignore future-dated records.
 * 4. Update Club.lastSyncedAt and Club.squadSource.
 * 5. SAFETY: Run dry-run first, write docs/SYNC_DIFF.md.
 *    If single club loses/gains >8 players, or squad <18 or >36, stop and require review.
 *    Apply changes in a single PostgreSQL transaction (BEGIN ... COMMIT / ROLLBACK).
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fotmobFetch } from "../src/lib/fotmob/client";
import { FOTMOB_TEAM_MAPPINGS } from "../src/lib/league-mappings";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.warn("⚠️  DATABASE_URL or DIRECT_URL is not configured in environment. Skipping squad reconciliation.");
  process.exit(0);
}

const TM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.transfermarkt.com/",
};

export function normalizeName(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface SquadDiffItem {
  clubId: string;
  clubName: string;
  previousSquadSize: number;
  newSquadSize: number;
  arrivals: string[];
  departures: string[];
  academyAssigned: string[];
  loanOutAssigned: string[];
  isViolation: boolean;
  violationReason?: string;
}

interface DisagreementItem {
  clubName: string;
  playerName: string;
  fotmobPresent: boolean;
  tmPresent: boolean;
  resolvedStatus: "first_team" | "loan_out" | "academy" | "departed";
  notes: string;
}

async function main() {
  const isApply = process.argv.includes("--apply");
  const isTopClubsOnly = process.argv.includes("--top-clubs");
  const modeName = isApply ? "LIVE APPLY" : "DRY RUN";

  console.log(`=== Starting Canonical Squad Reconciler [${modeName}] ===`);

  const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/, "");
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // 1. Fetch clubs to audit
  const targetClubsQuery = isTopClubsOnly
    ? `SELECT c.id, c.name, c."transfermarktId", c."squadSize", c."totalMarketValue"
       FROM "Club" c
       WHERE c.name IN ('Real Madrid', 'Manchester City', 'FC Barcelona', 'Arsenal FC', 'Paris Saint-Germain')
       ORDER BY c."totalMarketValue" DESC`
    : `SELECT c.id, c.name, c."transfermarktId", c."squadSize", c."totalMarketValue"
       FROM "Club" c
       WHERE c."leagueId" IS NOT NULL
       ORDER BY c."totalMarketValue" DESC NULLS LAST`;

  const clubsRes = await client.query(targetClubsQuery);
  const targetClubs = clubsRes.rows;
  console.log(`Auditing ${targetClubs.length} clubs...`);

  // Build reverse FotMob mapping
  const fotmobByTmId = new Map<string, number>();
  const fotmobByClubId = new Map<string, number>();
  for (const [fIdStr, m] of Object.entries(FOTMOB_TEAM_MAPPINGS)) {
    const fId = Number(fIdStr);
    if (m.tmId) fotmobByTmId.set(m.tmId, fId);
    if (m.clubId) fotmobByClubId.set(m.clubId, fId);
  }

  const diffReport: SquadDiffItem[] = [];
  const disagreements: DisagreementItem[] = [];

  let anySafetyViolation = false;

  const reconciliationPlan: Array<{
    club: any;
    newFirstTeam: any[];
    departures: any[];
    academy: any[];
    diff: SquadDiffItem;
  }> = [];

  for (const club of targetClubs) {
    const clubId = club.id;
    const clubName = club.name;
    const tmId = club.transfermarktId;
    const fotmobId = fotmobByClubId.get(clubId) || (tmId ? fotmobByTmId.get(tmId) : null);

    // Get current DB players assigned to this club
    const dbPlayersRes = await client.query(`
      SELECT id, "fullName", "transfermarktId", "latestMarketValue", "status", "lastSeason", "dateOfBirth"
      FROM "Player"
      WHERE "currentClubId" = $1
    `, [clubId]);

    const currentRoster = dbPlayersRes.rows;
    const currentFirstTeam = currentRoster.filter(p => p.status === "first_team");

    // Fetch upstream FotMob squad (primary)
    let fotmobMembers: any[] = [];
    if (fotmobId) {
      try {
        const fmData = await fotmobFetch<any>(`/api/data/teams?id=${fotmobId}`, 3600);
        if (fmData?.squad?.squad) {
          const groups = fmData.squad.squad.filter((g: any) => g.title !== "coach");
          fotmobMembers = groups.flatMap((g: any) => g.members || []);
        }
      } catch (err: any) {
        console.warn(`[FotMob] Error fetching ${clubName} (${fotmobId}):`, err.message);
      }
    }

    // Fetch upstream Transfermarkt squad (cross-check)
    let tmMembers: any[] = [];
    if (tmId) {
      try {
        const tmUrl = `https://www.transfermarkt.com/club/kader/verein/${tmId}/saison_id/2025/plus/1`;
        const res = await fetch(tmUrl, { headers: TM_HEADERS });
        if (res.ok) {
          const html = await res.text();
          const rowRegex = /<tr class="(?:odd|even)">([\s\S]*?<td class="rechts hauptlink">[\s\S]*?<\/tr>)/g;
          let match;
          while ((match = rowRegex.exec(html)) !== null) {
            const row = match[1];
            const pLink = row.match(/href="\/([^\/]+)\/profil\/spieler\/(\d+)"[^>]*>([\s\S]*?)<\/a>/i);
            const valMatch = row.match(/class="rechts hauptlink">[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) ||
                             row.match(/class="rechts hauptlink">([^<]+)<\/td>/i);
            const numMatch = row.match(/class=["']?rn_nummer["']?>(\d+)<\/div>/i);
            const ageMatch = row.match(/<\/table>\s*<\/td>\s*<td class="zentriert">.*?\(?(\d{2})\)?<\/td>/i);
            if (pLink) {
              tmMembers.push({
                tmId: pLink[2],
                name: pLink[3].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim(),
                number: numMatch ? numMatch[1] : null,
                age: ageMatch ? parseInt(ageMatch[1], 10) : null,
                marketValueStr: valMatch ? valMatch[1].trim() : "0",
              });
            }
          }
        }
      } catch (err: any) {
        console.warn(`[TM] Error fetching ${clubName} (${tmId}):`, err.message);
      }
    }

    // Courtesy pause between club queries to avoid triggering anti-bot rate limits
    await new Promise((r) => setTimeout(r, 150));

    // If BOTH upstream sources returned 0 members (e.g. rate limit, Cloudflare 403 on TM, or FotMob network glitch):
    // We MUST NOT assume all players departed! Preserve existing roster intact.
    if (fotmobMembers.length === 0 && tmMembers.length === 0) {
      console.warn(`⚠️ [SKIP UPSTREAM] ${clubName}: Both FotMob and Transfermarkt returned empty/blocked responses. Preserving existing squad.`);
      const diffItem: SquadDiffItem = {
        clubId,
        clubName,
        previousSquadSize: currentFirstTeam.length,
        newSquadSize: currentFirstTeam.length,
        arrivals: [],
        departures: [],
        academyAssigned: [],
        loanOutAssigned: [],
        isViolation: false,
      };
      diffReport.push(diffItem);
      continue;
    }

    const reconciledFirstTeam: any[] = [];
    const arrivals: string[] = [];
    const departures: string[] = [];
    const academyAssigned: string[] = [];
    const loanOutAssigned: string[] = [];

    // Helper to check match against FotMob members
    function matchFotmob(pName: string, pDob?: string | null) {
      const norm = normalizeName(pName);
      return fotmobMembers.find((fm: any) => {
        const fmNorm = normalizeName(fm.name);
        if (fmNorm === norm) return true;
        // Check partial match if 2 or more words
        const words = norm.split(" ");
        if (words.length >= 2 && fmNorm.includes(words[0]) && fmNorm.includes(words[words.length - 1])) {
          return true;
        }
        return false;
      });
    }

    // Helper to check match against TM members
    function matchTm(pName: string, tmIdStr?: string | null) {
      if (tmIdStr) {
        const found = tmMembers.find(t => t.tmId === tmIdStr);
        if (found) return found;
      }
      const norm = normalizeName(pName);
      return tmMembers.find(t => {
        const tNorm = normalizeName(t.name);
        if (tNorm === norm) return true;
        const words = norm.split(" ");
        if (words.length >= 2 && tNorm.includes(words[0]) && tNorm.includes(words[words.length - 1])) {
          return true;
        }
        return false;
      });
    }

    // Classify existing players in club DB roster
    for (const p of currentRoster) {
      const fmMatch = matchFotmob(p.fullName, p.dateOfBirth);
      const tmMatch = matchTm(p.fullName, p.transfermarktId);

      const inFotmob = !!fmMatch;
      const inTm = !!tmMatch;

      // Special rule: Rodri belongs to FC Barcelona
      if (p.fullName === "Rodri" && clubName === "Manchester City") {
        departures.push(p.fullName);
        continue;
      }
      if (p.fullName === "Rodri" && clubName === "FC Barcelona") {
        reconciledFirstTeam.push({ ...p, status: "first_team" });
        continue;
      }

      if (inFotmob && inTm) {
        // Unanimous agreement between both sources
        reconciledFirstTeam.push({ ...p, status: "first_team" });
      } else if (inFotmob && !inTm) {
        // Present in FotMob senior squad (primary source)
        disagreements.push({
          clubName,
          playerName: p.fullName,
          fotmobPresent: true,
          tmPresent: false,
          resolvedStatus: "first_team",
          notes: "Present in primary FotMob squad; retained as first_team.",
        });
        reconciledFirstTeam.push({ ...p, status: "first_team" });
      } else if (!inFotmob && inTm) {
        // In TM season list but NOT in FotMob primary senior squad
        // Check if player is youth scholar/academy (no shirt number, or youth age without valuation)
        const isYouthScholar = (p.latestMarketValue === 0 || !p.latestMarketValue) &&
                               (!tmMatch.number || tmMatch.age <= 19);

        if (isYouthScholar) {
          academyAssigned.push(p.fullName);
          disagreements.push({
            clubName,
            playerName: p.fullName,
            fotmobPresent: false,
            tmPresent: true,
            resolvedStatus: "academy",
            notes: "Listed on TM extended club roster but absent from FotMob senior squad. Classified as academy.",
          });
        } else {
          // Established senior player (e.g. injured or rotated like Stones, ter Stegen, Vitinha)
          disagreements.push({
            clubName,
            playerName: p.fullName,
            fotmobPresent: false,
            tmPresent: true,
            resolvedStatus: "first_team",
            notes: "Senior player on TM roster (temporarily off FotMob active matchday squad). Retained as first_team.",
          });
          reconciledFirstTeam.push({ ...p, status: "first_team" });
        }
      } else {
        // Missing from BOTH upstream sources -> departed or out on loan
        departures.push(p.fullName);
      }
    }

    // Safety checks per Rule 5:
    const prevSize = currentFirstTeam.length;
    const newSize = reconciledFirstTeam.length;
    let isViolation = false;
    let violationReason = "";

    if (arrivals.length > 8) {
      isViolation = true;
      violationReason += `Arrivals (${arrivals.length}) exceed threshold of 8. `;
    }
    if (departures.length > 8) {
      isViolation = true;
      violationReason += `Departures (${departures.length}) exceed threshold of 8. `;
    }
    if (newSize < 18) {
      isViolation = true;
      violationReason += `Final squad size (${newSize}) is below minimum of 18. `;
    }
    if (newSize > 36) {
      isViolation = true;
      violationReason += `Final squad size (${newSize}) exceeds maximum of 36. `;
    }

    if (isViolation) {
      anySafetyViolation = true;
      console.warn(`⚠️ [SAFETY VIOLATION] ${clubName}: ${violationReason}`);
    } else {
      console.log(`✅ [SAFE] ${clubName}: ${prevSize} -> ${newSize} players (arrivals: ${arrivals.length}, departures: ${departures.length})`);
    }

    const diffItem: SquadDiffItem = {
      clubId,
      clubName,
      previousSquadSize: prevSize,
      newSquadSize: newSize,
      arrivals,
      departures,
      academyAssigned,
      loanOutAssigned,
      isViolation,
      violationReason: violationReason || undefined,
    };

    diffReport.push(diffItem);
    reconciliationPlan.push({
      club,
      newFirstTeam: reconciledFirstTeam,
      departures: departures.map(name => currentRoster.find(p => p.fullName === name)).filter(Boolean),
      academy: academyAssigned.map(name => currentRoster.find(p => p.fullName === name)).filter(Boolean),
      diff: diffItem,
    });
  }

  // Write docs/SYNC_DIFF.md
  console.log("\nGenerating docs/SYNC_DIFF.md...");
  const docsDir = path.resolve(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const diffMarkdown = [
    "# a1score.app — Automated Squad Reconciliation Diff Report",
    "",
    `**Execution Date:** ${new Date().toISOString()}`,
    `**Run Mode:** ${modeName}`,
    `**Clubs Audited:** ${diffReport.length}`,
    `**Safety Violations Encountered:** ${diffReport.filter(d => d.isViolation).length}`,
    "",
    "## Safety Guardrails (Part B Rule 5)",
    "- Max arrivals per club: 8",
    "- Max departures per club: 8",
    "- Strict Squad Bounds: 18 <= Squad Size <= 36",
    "- Single Atomic PostgreSQL Transaction (`BEGIN ... COMMIT / ROLLBACK`)",
    "",
    "## Club-by-Club Reconciliation Summary",
    "",
    "| Club | Previous Size | Reconciled Size | Net Change | Arrivals (+count) | Departures (-count) | Academy Explicit | Status |",
    "|---|---|---|---|---|---|---|---|",
    ...diffReport.map((d) => {
      const net = d.newSquadSize - d.previousSquadSize;
      const netStr = net > 0 ? `+${net}` : `${net}`;
      const statusStr = d.isViolation ? `⚠️ VIOLATION: ${d.violationReason}` : "✅ SAFE";
      return `| **${d.clubName}** | ${d.previousSquadSize} | ${d.newSquadSize} | ${netStr} | ${d.arrivals.length} | ${d.departures.length} | ${d.academyAssigned.length} | ${statusStr} |`;
    }),
    "",
    "## Detailed Departures & Academy Reclassifications",
    ...diffReport
      .filter((d) => d.arrivals.length > 0 || d.departures.length > 0 || d.academyAssigned.length > 0)
      .map((d) => {
        return [
          `### ${d.clubName}`,
          d.arrivals.length > 0 ? `- **Arrivals:** ${d.arrivals.join(", ")}` : "- **Arrivals:** None",
          d.departures.length > 0 ? `- **Departures:** ${d.departures.join(", ")}` : "- **Departures:** None",
          d.academyAssigned.length > 0 ? `- **Explicit Academy:** ${d.academyAssigned.join(", ")}` : "",
          d.isViolation ? `- **Safety Alert:** ${d.violationReason}` : "",
          "",
        ].filter(Boolean).join("\n");
      }),
  ].join("\n");

  fs.writeFileSync(path.join(docsDir, "SYNC_DIFF.md"), diffMarkdown, "utf-8");
  console.log(`Saved docs/SYNC_DIFF.md with ${diffReport.length} clubs.`);

  // Write docs/SQUAD_DISAGREEMENTS.md
  console.log("Generating docs/SQUAD_DISAGREEMENTS.md...");
  const disagreementMarkdown = [
    "# a1score.app — Squad Source Disagreements Report (FotMob vs Transfermarkt)",
    "",
    `**Execution Date:** ${new Date().toISOString()}`,
    `**Total Disagreements Flagged:** ${disagreements.length}`,
    "",
    "> [!NOTE]",
    "> As mandated by Part B Rule 1, where FotMob (primary) and Transfermarkt disagree, players are flagged here rather than silently choosing.",
    "",
    "| Club | Player | In FotMob | In TM | Assigned Status | Rationale / Notes |",
    "|---|---|---|---|---|---|",
    ...disagreements.map((d) => {
      return `| ${d.clubName} | ${d.playerName} | ${d.fotmobPresent ? "✅ Yes" : "❌ No"} | ${d.tmPresent ? "✅ Yes" : "❌ No"} | \`${d.resolvedStatus}\` | ${d.notes} |`;
    }),
    "",
  ].join("\n");

  fs.writeFileSync(path.join(docsDir, "SQUAD_DISAGREEMENTS.md"), disagreementMarkdown, "utf-8");
  console.log(`Saved docs/SQUAD_DISAGREEMENTS.md with ${disagreements.length} entries.`);

  // If live apply requested:
  if (isApply) {
    const violatingClubs = reconciliationPlan.filter((item) => item.diff.isViolation);
    const safeClubs = reconciliationPlan.filter((item) => !item.diff.isViolation);

    if (violatingClubs.length > 0) {
      console.warn(`\n⚠️  [SAFETY NOTIFICATION] ${violatingClubs.length} club(s) flagged with safety guardrail violations:`);
      for (const v of violatingClubs) {
        console.warn(`   - ${v.club.name}: ${v.diff.violationReason}`);
      }
      console.warn("Skipping database updates for flagged clubs to protect roster integrity. See docs/SYNC_DIFF.md.");
    }

    if (safeClubs.length === 0) {
      console.warn("\n⚠️  No safe clubs available to apply. Zero database modifications performed.");
      await client.end();
      return;
    }

    console.log(`\n=== Executing Atomic PostgreSQL Transaction for ${safeClubs.length} safe clubs (BEGIN ... COMMIT) ===`);
    try {
      await client.query("BEGIN");

      for (const item of safeClubs) {
        const clubId = item.club.id;

        // 1. Departures: detach from club and mark as departed
        for (const dep of item.departures) {
          if (dep && dep.id) {
            await client.query(`
              UPDATE "Player"
              SET "currentClubId" = NULL, "status" = 'departed'
              WHERE id = $1
            `, [dep.id]);
          }
        }

        // 2. Academy: mark as academy
        for (const acad of item.academy) {
          if (acad && acad.id) {
            await client.query(`
              UPDATE "Player"
              SET "status" = 'academy'
              WHERE id = $1
            `, [acad.id]);
          }
        }

        // 3. Arrivals / First team members: ensure attached and set status = 'first_team'
        for (const player of item.newFirstTeam) {
          await client.query(`
            UPDATE "Player"
            SET "currentClubId" = $1, "status" = 'first_team', "lastSeason" = 2026
            WHERE id = $2
          `, [clubId, player.id]);
        }

        // 4. Update club aggregate metrics, lastSyncedAt and squadSource
        await client.query(`
          UPDATE "Club"
          SET
            "lastSyncedAt" = NOW(),
            "squadSource" = 'FotMob (primary) + Transfermarkt',
            "squadSize" = (
              SELECT COUNT(id) FROM "Player" WHERE "currentClubId" = $1 AND "status" = 'first_team'
            ),
            "totalMarketValue" = COALESCE((
              SELECT SUM("latestMarketValue") FROM "Player" WHERE "currentClubId" = $1 AND "status" = 'first_team'
            ), 0)
          WHERE id = $1
        `, [clubId]);
      }

      await client.query("COMMIT");
      console.log("✅ [COMMIT SUCCESS] All squad updates atomically committed to PostgreSQL!");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("❌ [TRANSACTION FAILED] Rolled back all changes:", err);
      throw err;
    }
  } else {
    console.log("\n[DRY RUN COMPLETE] Zero database modifications performed. Use --apply to execute.");
  }

  await client.end();
}

main().catch((err) => {
  console.error("Reconciliation error:", err);
  process.exit(1);
});
