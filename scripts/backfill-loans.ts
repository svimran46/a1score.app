import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface LoanCandidate {
  playerId: string;
  fullName: string;
  parentClubId: string;
  parentClubName: string;
  loanClubId: string | null;
  loanClubName: string;
  isLoanClubInDb: boolean;
  loanUntil: string;
  notes: string;
  source: string;
}

interface AppliedLoanChangeRow {
  timestamp: string;
  playerId: string;
  fullName: string;
  action: string;
  parentClubId: string;
  parentClubName: string;
  previousCurrentClubId: string | null;
  previousCurrentClubName: string;
  newCurrentClubId: string | null;
  newCurrentClubName: string;
  previousStatus: string | null;
  newStatus: string;
  loanUntil: string;
  notes: string;
}

async function main() {
  console.log('=== Starting 2026/27 Loan Backfill ===\n');

  // 1. Fetch all clubs from DB to build lookup maps
  const allClubs = await prisma.club.findMany();
  const clubById = new Map<string, typeof allClubs[0]>();
  const clubByName = new Map<string, typeof allClubs[0]>();

  for (const c of allClubs) {
    clubById.set(c.id, c);
    clubByName.set(c.name.toLowerCase().trim(), c);
  }

  const clubAliases: Record<string, string> = {
    'sl benfica': 'SL Benfica',
    'benfica': 'SL Benfica',
    'acf fiorentina': 'ACF Fiorentina',
    'fiorentina': 'ACF Fiorentina',
    'sheffield united': 'Sheffield United',
    'leicester city': 'Leicester City',
    'wigan athletic': 'Wigan Athletic',
    'como 1907': 'Como 1907',
    'rc strasbourg': 'RC Strasbourg Alsace',
    'rc strasbourg alsace': 'RC Strasbourg Alsace',
    'real sociedad': 'Real Sociedad',
    'rb leipzig': 'RB Leipzig',
    'málaga cf': 'Málaga CF',
    'malaga cf': 'Málaga CF',
    'west ham united': 'West Ham United',
    'west ham': 'West Ham United',
    'valencia cf': 'Valencia CF',
    'burnley fc': 'Burnley FC',
    'willem ii tilburg': 'Willem II Tilburg',
    'willem ii': 'Willem II Tilburg',
    'ajax': 'Ajax Amsterdam',
    'ajax amsterdam': 'Ajax Amsterdam',
    'juventus fc': 'Juventus FC',
    'juventus': 'Juventus FC',
    'borussia dortmund': 'Borussia Dortmund',
    'dortmund': 'Borussia Dortmund',
    'arsenal fc': 'Arsenal FC',
    'arsenal': 'Arsenal FC',
    'chelsea fc': 'Chelsea FC',
    'chelsea': 'Chelsea FC',
    'tottenham hotspur': 'Tottenham Hotspur',
    'tottenham': 'Tottenham Hotspur',
    'leeds united': 'Leeds United',
    'aston villa': 'Aston Villa',
    'liverpool fc': 'Liverpool FC',
    'manchester city': 'Manchester City',
    'manchester united': 'Manchester United',
    'crystal palace': 'Crystal Palace',
    'brentford fc': 'Brentford FC',
    'brighton & hove albion': 'Brighton & Hove Albion',
    'fulham fc': 'Fulham FC',
    'nottingham forest': 'Nottingham Forest',
    'sunderland afc': 'Sunderland AFC',
    'afc bournemouth': 'AFC Bournemouth',
    'everton fc': 'Everton FC',
  };

  function resolveClub(nameOrId: string | null | undefined) {
    if (!nameOrId) return null;
    const trimmed = nameOrId.trim();
    if (clubById.has(trimmed)) return clubById.get(trimmed)!;
    const lower = trimmed.toLowerCase();
    if (clubAliases[lower]) {
      const canonicalName = clubAliases[lower].toLowerCase();
      if (clubByName.has(canonicalName)) return clubByName.get(canonicalName)!;
    }
    if (clubByName.has(lower)) return clubByName.get(lower)!;
    for (const [cName, c] of clubByName.entries()) {
      if (lower.length >= 4 && (cName.includes(lower) || lower.includes(cName))) {
        return c;
      }
    }
    return null;
  }

  const loanCandidates = new Map<string, LoanCandidate>();

  // 2. Read players_audited.csv (status === 'on_loan_out')
  if (fs.existsSync('players_audited.csv')) {
    const audited = parse(fs.readFileSync('players_audited.csv', 'utf8'), { columns: true, skip_empty_lines: true });
    for (const r of audited) {
      if (r.status === 'on_loan_out') {
        const parentClub = resolveClub(r.clubId) || resolveClub(r.clubName);
        const loanClubTarget = r.loanClub || r.newClub;
        const loanClub = resolveClub(loanClubTarget);

        loanCandidates.set(r.playerId, {
          playerId: r.playerId,
          fullName: r.fullName,
          parentClubId: parentClub?.id || r.clubId,
          parentClubName: parentClub?.name || r.clubName,
          loanClubId: loanClub?.id || null,
          loanClubName: loanClub?.name || loanClubTarget,
          isLoanClubInDb: !!loanClub,
          loanUntil: '2027-06-30T00:00:00.000Z',
          notes: r.notes || `On loan to ${loanClubTarget}`,
          source: 'players_audited.csv'
        });
      }
    }
  }

  // 3. Read applied_*_changes.csv (notes mention loan)
  const appliedFiles = [
    'applied_epl_changes.csv',
    'applied_laliga_changes.csv',
    'applied_bundesliga_changes.csv',
    'applied_seriea_changes.csv',
    'applied_ligue1_changes.csv',
    'applied_portugal_changes.csv',
    'applied_changes.csv'
  ];

  for (const f of appliedFiles) {
    if (!fs.existsSync(f)) continue;
    const records = parse(fs.readFileSync(f, 'utf8'), { columns: true, skip_empty_lines: true });
    for (const r of records) {
      const notes = (r.notes || '').toLowerCase();
      if (notes.includes('loan')) {
        const parentClub = resolveClub(r.oldClubId || r.clubId || r.fromClubId) || resolveClub(r.oldClubName || r.clubName || r.fromClubName);
        let loanClubTarget = r.newClubName || r.toClubName;
        const match = r.notes.match(/(?:loan to|loan at)\s+([A-Za-z0-9\s&.-]+?)(?:\s*\((?:September|July|August|June|TM|\d|Serie|Bundesliga).*|\s*$)/i);
        if (match && match[1]) {
          loanClubTarget = match[1].trim();
        }
        const loanClub = resolveClub(loanClubTarget);

        if (!loanCandidates.has(r.playerId)) {
          loanCandidates.set(r.playerId, {
            playerId: r.playerId,
            fullName: r.fullName,
            parentClubId: parentClub?.id || r.clubId || r.oldClubId,
            parentClubName: parentClub?.name || r.clubName || r.oldClubName,
            loanClubId: loanClub?.id || null,
            loanClubName: loanClub?.name || loanClubTarget,
            isLoanClubInDb: !!loanClub,
            loanUntil: '2027-06-30T00:00:00.000Z',
            notes: r.notes,
            source: f
          });
        }
      }
    }
  }

  // 4. Guaranteed example players
  const nwaneriParent = resolveClub('Arsenal FC');
  const nwaneriLoan = resolveClub('Borussia Dortmund');
  loanCandidates.set('cmuihw3eu0bimsexpjujsn1l7', {
    playerId: 'cmuihw3eu0bimsexpjujsn1l7',
    fullName: 'Ethan Nwaneri',
    parentClubId: nwaneriParent!.id,
    parentClubName: nwaneriParent!.name,
    loanClubId: nwaneriLoan!.id,
    loanClubName: nwaneriLoan!.name,
    isLoanClubInDb: true,
    loanUntil: '2027-06-30T00:00:00.000Z',
    notes: 'On loan at Borussia Dortmund from Arsenal FC for 2026/27',
    source: 'explicit_guarantee'
  });

  console.log(`Identified ${loanCandidates.size} unique loan candidates.`);

  // 5. Fetch current DB state for pre-change snapshot
  const playerIds = Array.from(loanCandidates.keys());
  const preChangePlayers = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    include: {
      currentClub: true,
      parentClub: true,
    }
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join('backups', `loans-backfill-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, 'backup.json');
  fs.writeFileSync(
    backupFile,
    JSON.stringify(preChangePlayers, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2),
    'utf8'
  );
  console.log(`Saved pre-change snapshot of ${preChangePlayers.length} players to: ${backupFile}`);

  const preMap = new Map(preChangePlayers.map(p => [p.id, p]));
  const appliedChanges: AppliedLoanChangeRow[] = [];
  const affectedClubIds = new Set<string>();

  // 6. Execute updates
  let updatedCount = 0;
  for (const candidate of loanCandidates.values()) {
    const existing = preMap.get(candidate.playerId);
    if (!existing) {
      console.warn(`[Warning] Player ${candidate.fullName} (${candidate.playerId}) not found in DB!`);
      continue;
    }

    // Determine target currentClubId
    // If loan club is in DB, currentClubId = loanClubId
    // If loan club is NOT in DB, currentClubId = null (or keep player detached from current senior squads)
    const targetCurrentClubId = candidate.isLoanClubInDb ? candidate.loanClubId : null;
    const targetParentClubId = candidate.parentClubId;
    const targetStatus = 'on_loan';
    const targetLoanUntil = new Date(candidate.loanUntil);

    await prisma.player.update({
      where: { id: candidate.playerId },
      data: {
        parentClubId: targetParentClubId,
        currentClubId: targetCurrentClubId,
        status: targetStatus,
        loanUntil: targetLoanUntil,
      }
    });

    updatedCount++;

    // Track clubs for aggregate recomputations
    if (existing.currentClubId) affectedClubIds.add(existing.currentClubId);
    if (targetCurrentClubId) affectedClubIds.add(targetCurrentClubId);
    if (targetParentClubId) affectedClubIds.add(targetParentClubId);

    const prevClubName = existing.currentClub?.name || (existing.currentClubId ? 'Unknown' : 'Unassigned/None');
    const newClubName = candidate.isLoanClubInDb
      ? (clubById.get(targetCurrentClubId!)?.name || candidate.loanClubName)
      : `Non-DB Club (${candidate.loanClubName})`;

    appliedChanges.push({
      timestamp: new Date().toISOString(),
      playerId: candidate.playerId,
      fullName: candidate.fullName,
      action: 'UPDATE_LOAN',
      parentClubId: targetParentClubId,
      parentClubName: candidate.parentClubName,
      previousCurrentClubId: existing.currentClubId,
      previousCurrentClubName: prevClubName,
      newCurrentClubId: targetCurrentClubId,
      newCurrentClubName: newClubName,
      previousStatus: existing.status,
      newStatus: targetStatus,
      loanUntil: candidate.loanUntil,
      notes: candidate.notes
    });

    console.log(`[${updatedCount}/${loanCandidates.size}] ${candidate.fullName}:`);
    console.log(`   Parent: ${candidate.parentClubName} (${targetParentClubId})`);
    console.log(`   Loan Club: ${newClubName} (${targetCurrentClubId || 'NULL'})`);
    console.log(`   Status: ${existing.status} -> ${targetStatus}, LoanUntil: ${candidate.loanUntil}`);
  }

  // 7. Write applied_loan_changes.csv audit trail
  const headers = [
    'timestamp',
    'playerId',
    'fullName',
    'action',
    'parentClubId',
    'parentClubName',
    'previousCurrentClubId',
    'previousCurrentClubName',
    'newCurrentClubId',
    'newCurrentClubName',
    'previousStatus',
    'newStatus',
    'loanUntil',
    'notes'
  ];

  const csvRows = [
    headers.join(','),
    ...appliedChanges.map(row => {
      return headers.map(h => {
        const val = (row as any)[h] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    })
  ];

  fs.writeFileSync('applied_loan_changes.csv', csvRows.join('\n') + '\n', 'utf8');
  console.log(`\nWrote ${appliedChanges.length} audit records to: applied_loan_changes.csv`);

  // 8. Recompute squadSize & totalMarketValue for all affected clubs
  console.log(`\nRecomputing squadSize and totalMarketValue for ${affectedClubIds.size} affected clubs...`);
  for (const clubId of affectedClubIds) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        players: {
          where: {
            status: { not: 'departed' },
            OR: [
              { lastSeason: null },
              { lastSeason: { gte: 2025 } }
            ]
          }
        }
      }
    });

    if (club) {
      const squadSize = club.players.length;
      const totalMarketValue = club.players.reduce((sum, p) => sum + (p.latestMarketValue ? Number(p.latestMarketValue) : 0), 0);
      await prisma.club.update({
        where: { id: clubId },
        data: {
          squadSize,
          totalMarketValue,
          lastSyncedAt: new Date(),
        }
      });
      console.log(` - ${club.name}: squadSize = ${squadSize}, totalMarketValue = €${(totalMarketValue / 1e6).toFixed(1)}M`);
    }
  }

  console.log(`\n=== Successfully backfilled ${updatedCount} loans! ===`);
}

main().catch(err => {
  console.error('Fatal error during loan backfill:', err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
