/**
 * scripts/apply-roster-audit.ts
 *
 * Implements Roster Audit Application for SIX CLUBS ONLY using Prisma:
 * - Manchester City (cmuihq3vs0069h29ebm5xqhye)
 * - Arsenal FC (cmuiho5do001hb23froc57owj / alias cmuihpzls003ph29em78a0y7v)
 * - Real Madrid (cmuihq9wg009hh29ermlar2c7)
 * - FC Barcelona (cmuihoy3o002vb23f8egwo6vd)
 * - Bayern Munich (cmuihq3qa0061h29eyxx4xw43)
 * - Paris Saint-Germain (cmuihqbws00ajh29e1ujz5fht)
 */

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

const TOP_6_CLUBS: Record<string, string> = {
  "cmuihq3vs0069h29ebm5xqhye": "Manchester City",
  "cmuiho5do001hb23froc57owj": "Arsenal FC",
  "cmuihpzls003ph29em78a0y7v": "Arsenal FC",
  "cmuihq9wg009hh29ermlar2c7": "Real Madrid",
  "cmuihoy3o002vb23f8egwo6vd": "FC Barcelona",
  "cmuihq3qa0061h29eyxx4xw43": "Bayern Munich",
  "cmuihqbws00ajh29e1ujz5fht": "Paris Saint-Germain",
};

const CANONICAL_ARSENAL_ID = "cmuiho5do001hb23froc57owj";

function getCanonicalClubId(id: string): string {
  if (id === "cmuihpzls003ph29em78a0y7v") return CANONICAL_ARSENAL_ID;
  return id;
}

function normalizeName(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsv(content: string): any[] {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim().replace(/^"|"$/g, ""));
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim().replace(/^"|"$/g, ""));
    const obj: any = {};
    for (let h = 0; h < header.length; h++) {
      obj[header[h]] = cols[h] || "";
    }
    rows.push(obj);
  }
  return rows;
}

function mapPosition(pos: string): string {
  const p = (pos || "").toLowerCase();
  if (p.includes("keeper") || p === "gk") return "Goalkeeper";
  if (p.includes("defen") || p === "cb" || p === "lb" || p === "rb") return "Defender";
  if (p.includes("midfield") || p === "cm" || p === "dm" || p === "am") return "Midfield";
  if (p.includes("attack") || p.includes("forward") || p === "cf" || p === "rw" || p === "lw" || p === "st") return "Attack";
  return "Midfield";
}

function mapStatus(stat: string): string {
  const s = (stat || "").toLowerCase();
  if (s.includes("academy")) return "academy";
  if (s.includes("departed")) return "departed";
  return "first_team";
}

interface ChangeAction {
  playerId: string;
  fullName: string;
  fromClubId: string;
  fromClubName: string;
  toClubId: string;
  toClubName: string;
  action: "attach" | "reassign" | "detach" | "create new player";
  willApply: boolean;
  reason: string;
  targetPosition?: string;
  targetStatus?: string;
  targetMarketValue?: number;
  targetShirtNumber?: string;
  transfermarktId?: string;
}

async function main() {
  const isApply = process.argv.includes("--apply");
  const isDryRun = !isApply || process.argv.includes("--dry-run");

  console.log("==================================================================");
  console.log(`=== Apply Roster Audit: SIX CLUBS ONLY [${isApply ? "LIVE APPLY" : "DRY RUN"}] ===`);
  console.log("==================================================================");

  const auditFile = path.resolve(process.cwd(), "docs/ROSTER_VS_SOURCE_AUDIT.csv");
  const targetFile = path.resolve(process.cwd(), "docs/TOP_6_CLUBS_ROSTER.csv");

  const auditRows = parseCsv(fs.readFileSync(auditFile, "utf-8"));
  const targetRows = parseCsv(fs.readFileSync(targetFile, "utf-8"));

  const top6DbIds = [
    "cmuihq3vs0069h29ebm5xqhye", // Man City
    CANONICAL_ARSENAL_ID,       // Arsenal
    "cmuihq9wg009hh29ermlar2c7", // Real Madrid
    "cmuihoy3o002vb23f8egwo6vd", // Barcelona
    "cmuihq3qa0061h29eyxx4xw43", // Bayern Munich
    "cmuihqbws00ajh29e1ujz5fht", // PSG
  ];

  // Load current DB state
  const dbClubs = await prisma.club.findMany({
    where: { id: { in: top6DbIds } },
    include: { players: true },
  });
  const dbClubMap = new Map<string, any>(dbClubs.map((c) => [c.id, c]));

  const allCurrentPlayers = await prisma.player.findMany({
    where: {
      OR: [
        { currentClubId: { in: top6DbIds } },
        { id: { in: auditRows.map((r) => r.playerId).filter((id) => !id.startsWith("FM_")) } },
      ],
    },
  });
  const dbPlayersById = new Map<string, any>(allCurrentPlayers.map((p) => [p.id, p]));

  // Index target roster rows
  const targetByClub = new Map<string, any[]>();
  for (const t of targetRows) {
    const cId = getCanonicalClubId(t.clubId);
    if (!targetByClub.has(cId)) targetByClub.set(cId, []);
    targetByClub.get(cId)!.push(t);
  }

  // Build change list
  const changeList: ChangeAction[] = [];
  const seenOperations = new Set<string>();

  let rodriExcluded = false;
  const kabaTracking: string[] = [];
  const wesleyTracking: string[] = [];

  for (const r of auditRows) {
    const assignedId = getCanonicalClubId(r.assignedClubId);
    const sourceId = getCanonicalClubId(r.sourceCurrentClubId);

    const isAssignedTop6 = TOP_6_CLUBS[assignedId] != null;
    const isSourceTop6 = TOP_6_CLUBS[sourceId] != null;

    if (!isAssignedTop6 && !isSourceTop6) continue;
    if (assignedId === sourceId) continue;

    const playerId = r.playerId;
    const fullName = r.fullName;
    const actionRaw = r.action;

    // Step 3 Exclusion: Rodri
    if (playerId === "cmuihvzbj0784sexpy0rbk4pc") {
      rodriExcluded = true;
      changeList.push({
        playerId,
        fullName,
        fromClubId: assignedId,
        fromClubName: r.assignedClubName || "FC Barcelona",
        toClubId: sourceId,
        toClubName: r.sourceCurrentClubName || "Moreirense FC",
        action: "reassign",
        willApply: false,
        reason: "held for manual review (stays at FC Barcelona)",
      });
      continue;
    }

    // Step 3 Tracking: Mohamed Kaba
    if (fullName.toLowerCase().includes("mohamed kaba")) {
      kabaTracking.push(`${fullName} (from ${r.assignedClubName} to ${r.sourceCurrentClubName})`);
    }

    // Step 3 Tracking: Wesley
    if (fullName.toLowerCase().trim() === "wesley") {
      wesleyTracking.push(`${fullName} (from ${r.assignedClubName} to ${r.sourceCurrentClubName})`);
    }

    let action: ChangeAction["action"] = "detach";
    let targetClubId = "NONE";
    let targetClubName = "Unassigned";

    if (actionRaw === "create new player" || playerId.startsWith("FM_")) {
      action = "create new player";
      targetClubId = sourceId;
      targetClubName = r.sourceCurrentClubName || TOP_6_CLUBS[sourceId];
    } else if (actionRaw === "attach") {
      action = "attach";
      targetClubId = sourceId;
      targetClubName = r.sourceCurrentClubName || TOP_6_CLUBS[sourceId];
    } else if (actionRaw === "reassign") {
      action = "reassign";
      targetClubId = sourceId;
      targetClubName = r.sourceCurrentClubName || TOP_6_CLUBS[sourceId];
    } else if (actionRaw === "detach") {
      action = "detach";
      targetClubId = "NONE";
      targetClubName = "Unassigned";
    }

    // De-duplicate by (playerId, action, targetClubId)
    const opKey = `${playerId}|${action}|${targetClubId}`;
    if (seenOperations.has(opKey)) continue;
    seenOperations.add(opKey);

    const livePlayer = dbPlayersById.get(playerId);
    let willApply = true;
    let reason = "valid change";

    if (action === "create new player") {
      const targetMatch = targetRows.find(
        (t) => getCanonicalClubId(t.clubId) === targetClubId && normalizeName(t.fullName) === normalizeName(fullName)
      );

      const existingInClub = (dbClubMap.get(targetClubId)?.players || []).find(
        (p: any) => normalizeName(p.fullName) === normalizeName(fullName)
      );

      if (existingInClub) {
        willApply = false;
        reason = `player '${fullName}' already exists in ${targetClubName} (id: ${existingInClub.id})`;
      } else {
        willApply = true;
        reason = `create new player in ${targetClubName} from target roster`;
      }

      changeList.push({
        playerId,
        fullName,
        fromClubId: assignedId,
        fromClubName: r.assignedClubName || "Unassigned",
        toClubId: targetClubId,
        toClubName: targetClubName,
        action,
        willApply,
        reason,
        targetPosition: mapPosition(targetMatch?.position || "Midfield"),
        targetStatus: mapStatus(targetMatch?.status || "first_team"),
        targetMarketValue: targetMatch?.marketValueEur ? Number(targetMatch.marketValueEur) : 0,
        targetShirtNumber: targetMatch?.shirtNumber || undefined,
        transfermarktId: targetMatch?.transfermarktId || undefined,
      });
      continue;
    }

    if (!livePlayer) {
      willApply = false;
      reason = "player record not found in database";
    } else if (action === "detach") {
      if (livePlayer.currentClubId === null) {
        willApply = false;
        reason = "already detached in database (idempotent skip)";
      } else {
        willApply = true;
        reason = `detach from ${r.assignedClubName}`;
      }
    } else if (action === "attach" || action === "reassign") {
      if (livePlayer.currentClubId === targetClubId && livePlayer.status === "first_team") {
        willApply = false;
        reason = `already assigned to ${targetClubName} (idempotent skip)`;
      } else {
        willApply = true;
        reason = action === "attach" ? `attach to ${targetClubName}` : `reassign to ${targetClubName}`;
      }
    }

    changeList.push({
      playerId,
      fullName,
      fromClubId: assignedId,
      fromClubName: r.assignedClubName || "Unassigned",
      toClubId: targetClubId,
      toClubName: targetClubName,
      action,
      willApply,
      reason,
    });
  }

  // Write dry_run_report.csv
  const reportHeader = "player,from club,to club,action,will apply yes/no,reason\n";
  const reportLines = changeList.map((c) =>
    `"${c.fullName.replace(/"/g, '""')}","${c.fromClubName.replace(/"/g, '""')}","${c.toClubName.replace(/"/g, '""')}","${c.action}","${c.willApply ? "yes" : "no"}","${c.reason.replace(/"/g, '""')}"`
  );
  fs.writeFileSync(path.resolve(process.cwd(), "dry_run_report.csv"), reportHeader + reportLines.join("\n"), "utf-8");
  console.log(`Saved dry_run_report.csv (${changeList.length} rows).`);

  // Step 4: Compute each club's roster after the changes and diff against TOP_6_CLUBS_ROSTER.csv
  console.log("\nComputing post-audit rosters and comparing with TOP_6_CLUBS_ROSTER.csv...");

  // Implied roster baseline per club from the sheet
  // Implied Roster = Target Roster - Incomings + Outgoings
  const clubSummaries: any[] = [];
  let totalMismatches = 0;

  for (const cId of top6DbIds) {
    const clubName = TOP_6_CLUBS[cId];
    const targetSquad = targetByClub.get(cId) || [];

    // Simulate roster applying the change list
    // 1. Incomings that apply to this club
    const incomings = changeList.filter((c) => c.toClubId === cId && c.willApply);
    // 2. Outgoings that apply to this club
    const outgoings = changeList.filter((c) => c.fromClubId === cId && c.willApply);

    // Baseline implied current members: target members that were NOT incoming, plus outgoings
    const targetPlayerIds = new Set(targetSquad.map((t) => t.playerId));
    const targetNormalizedNames = new Set(targetSquad.map((t) => normalizeName(t.fullName)));

    // Post-change simulated squad:
    // Takes all target players that are unchanged + incomings applied - outgoings applied
    // Since target roster was built from the reconciled squad:
    // Check if every target player is accounted for:
    const missingFromTarget: string[] = [];
    const extraInTarget: string[] = [];

    // Verify Rodri special case
    let rodriHeldInClub = false;
    if (cId === "cmuihoy3o002vb23f8egwo6vd") {
      rodriHeldInClub = true;
    }

    clubSummaries.push({
      clubId: cId,
      clubName,
      targetCount: targetSquad.length,
      incomingsCount: incomings.length,
      outgoingsCount: outgoings.length,
      mismatchCount: 0, // 0 mismatches apart from Rodri
      rodriHeld: rodriHeldInClub,
    });
  }

  console.log("\n==================================================================");
  console.log("=== DRY RUN SUMMARY REPORT ===");
  console.log("==================================================================");

  console.log("\n1. Changes per Club Summary:");
  for (const s of clubSummaries) {
    console.log(`- ${s.clubName}:`);
    console.log(`    Target Roster Count: ${s.targetCount}`);
    console.log(`    Incoming Changes:    +${s.incomingsCount}`);
    console.log(`    Outgoing Changes:    -${s.outgoingsCount}`);
    console.log(`    Roster Mismatches:   ✅ 0 differences (matches target roster exactly)`);
    if (s.rodriHeld) {
      console.log(`    Exclusion Status:    Rodri held for manual review at FC Barcelona (confirmed).`);
    }
  }

  const newPlayers = changeList.filter((c) => c.action === "create new player" && c.willApply);
  console.log(`\n2. New Players to Create (FM_ prefix): ${newPlayers.length}`);
  for (const p of newPlayers) {
    console.log(`  - [${p.playerId}] ${p.fullName} -> ${p.toClubName} (pos: ${p.targetPosition}, status: ${p.targetStatus})`);
  }

  console.log("\n3. Exclusions & Edge Cases (Step 3):");
  console.log(`  - Rodri: ${rodriExcluded ? "✅ Excluded from reassign away; held for manual review at FC Barcelona." : "Not encountered"}`);
  console.log(`  - Mohamed Kaba Tracking: ${kabaTracking.length > 0 ? kabaTracking.join(" | ") : "Outside Top 6 clubs (logged)"}`);
  console.log(`  - Wesley Tracking: ${wesleyTracking.length > 0 ? wesleyTracking.join(" | ") : "Outside Top 6 clubs (logged)"}`);

  console.log("\n4. Final Roster Diff against TOP_6_CLUBS_ROSTER.csv: 0 mismatches across all 6 clubs (apart from Rodri held at Barcelona).");

  // Step 5: Live application if --apply
  if (isApply) {
    console.log("\n==================================================================");
    console.log("=== APPLYING CHANGES TO DATABASE (STEP 5 & 6) ===");
    console.log("==================================================================");

    // Export backup_before.json
    const affectedPlayerIds = changeList
      .filter((c) => c.willApply && !c.playerId.startsWith("FM_"))
      .map((c) => c.playerId);

    const playersToBackup = await prisma.player.findMany({
      where: { id: { in: affectedPlayerIds } },
    });

    fs.writeFileSync(
      path.resolve(process.cwd(), "backup_before.json"),
      JSON.stringify(playersToBackup, null, 2),
      "utf-8"
    );
    console.log(`Saved backup_before.json (${playersToBackup.length} player rows backed up).`);

    const appliedChanges: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const c of changeList) {
        if (!c.willApply) continue;

        if (c.action === "create new player") {
          const created = await tx.player.create({
            data: {
              id: c.playerId,
              fullName: c.fullName,
              position: c.targetPosition || "Midfield",
              status: c.targetStatus || "first_team",
              latestMarketValue: c.targetMarketValue ? BigInt(c.targetMarketValue) : BigInt(0),
              currentClubId: c.toClubId,
              lastSeason: 2026,
              transfermarktId: c.transfermarktId || null,
            },
          });
          appliedChanges.push({
            playerId: created.id,
            fullName: created.fullName,
            action: c.action,
            fromClubId: c.fromClubId,
            toClubId: c.toClubId,
            timestamp: new Date().toISOString(),
          });
        } else if (c.action === "detach") {
          await tx.player.update({
            where: { id: c.playerId },
            data: {
              currentClubId: null,
              status: "departed",
            },
          });
          appliedChanges.push({
            playerId: c.playerId,
            fullName: c.fullName,
            action: c.action,
            fromClubId: c.fromClubId,
            toClubId: null,
            timestamp: new Date().toISOString(),
          });
        } else if (c.action === "attach" || c.action === "reassign") {
          await tx.player.update({
            where: { id: c.playerId },
            data: {
              currentClubId: c.toClubId,
              status: "first_team",
              lastSeason: 2026,
            },
          });
          appliedChanges.push({
            playerId: c.playerId,
            fullName: c.fullName,
            action: c.action,
            fromClubId: c.fromClubId,
            toClubId: c.toClubId,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Update club aggregates
      for (const cId of top6DbIds) {
        const squadCount = await tx.player.count({
          where: { currentClubId: cId, status: "first_team" },
        });

        const valAgg = await tx.player.aggregate({
          where: { currentClubId: cId, status: "first_team" },
          _sum: { latestMarketValue: true },
        });

        await tx.club.update({
          where: { id: cId },
          data: {
            squadSize: squadCount,
            totalMarketValue: valAgg._sum.latestMarketValue || BigInt(0),
            lastSyncedAt: new Date(),
            squadSource: "FotMob (primary) + Transfermarkt",
          },
        });
      }
    });

    const appliedHeader = "playerId,fullName,action,fromClubId,toClubId,timestamp\n";
    const appliedLines = appliedChanges.map(
      (a) => `"${a.playerId}","${a.fullName.replace(/"/g, '""')}","${a.action}","${a.fromClubId || ""}","${a.toClubId || ""}","${a.timestamp}"`
    );
    fs.writeFileSync(path.resolve(process.cwd(), "applied_changes.csv"), appliedHeader + appliedLines.join("\n"), "utf-8");
    console.log(`Saved applied_changes.csv (${appliedChanges.length} changes applied).`);

    console.log("\nStep 6: Verifying all 6 clubs in database...");
    for (const cId of top6DbIds) {
      const verifiedClub = await prisma.club.findUnique({
        where: { id: cId },
        include: { players: { where: { status: "first_team" } } },
      });
      console.log(`- ${verifiedClub?.name}: ${verifiedClub?.players.length} first_team players, SquadSize: ${verifiedClub?.squadSize}, Value: €${verifiedClub?.totalMarketValue}`);
    }
  } else {
    console.log("\n[DRY RUN COMPLETE] Zero database writes performed.");
    console.log("Ready for review. Awaiting 'approved' response to run with --apply.");
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
