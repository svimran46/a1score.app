import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// Confirmed TM IDs for FM_* players
const CONFIRMED_FM_MAP: Record<string, { tmId: string; name: string; club: string }> = {
  'FM_1662399': { tmId: '1074986', name: 'Alessandro Longoni', club: 'Paris Saint-Germain' },
  'FM_1187225': { tmId: '585971', name: 'Josh Wilson-Esbrand', club: 'Manchester City' },
  'FM_1721789': { tmId: '1082631', name: 'Allan', club: 'Manchester City' },
  'FM_361757': { tmId: '182712', name: 'João Cancelo', club: 'FC Barcelona' },
  'FM_1821727': { tmId: '938154', name: 'Brian Fariñas', club: 'FC Barcelona' },
  'FM_1656591': { tmId: '1105549', name: 'Jesse Bisiwu', club: 'FC Barcelona' },
  'FM_1708842': { tmId: '1259085', name: 'Hamza Abdelkarim', club: 'FC Barcelona' },
  'FM_1157237': { tmId: '451677', name: 'Christos Tzolis', club: 'Arsenal FC' },
};

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

function normalizeStatus(val: string | null | undefined, notes?: string): string {
  if (!val) return '';
  const clean = val.trim().toLowerCase();
  if (notes && (notes.toLowerCase().includes('on loan') || notes.toLowerCase().includes('on season-long loan'))) {
    return 'on_loan';
  }
  if (clean === 'first_team' || clean === 'senior' || clean === 'active') return 'first_team';
  if (clean === 'academy' || clean === 'youth' || clean === 'u21' || clean === 'u19') return 'academy';
  if (clean === 'on_loan' || clean === 'on_loan_out' || clean === 'loan') return 'on_loan';
  if (clean === 'departed' || clean === 'detached' || clean === 'released') return 'departed';
  return clean;
}

async function main() {
  console.log('=== Cleaning Audit Artifacts & Backfilling FM_* TM IDs ===\n');

  // 1. Fetch all DB players to build fast lookup maps
  const allDbPlayers = await prisma.player.findMany({
    select: {
      id: true,
      fullName: true,
      transfermarktId: true,
      currentClubId: true,
      status: true,
    }
  });

  const playerByCuid = new Map<string, string>();
  for (const p of allDbPlayers) {
    if (p.transfermarktId) {
      playerByCuid.set(p.id, p.transfermarktId);
    }
  }

  // 2. Step 5 & 3: Backup and update DB Player rows if any FM player had transfermarktId IS NULL
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = 'backups';
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `fm-id-backfill-${timestamp}.json`);

  const affectedPlayersToBackup: any[] = [];
  const unverifiedFmPlayers: any[] = [];

  for (const [fmId, info] of Object.entries(CONFIRMED_FM_MAP)) {
    // Find player in DB
    const matchingPlayers = await prisma.player.findMany({
      where: {
        OR: [
          { id: fmId },
          { fullName: { equals: info.name, mode: 'insensitive' } }
        ]
      }
    });

    for (const p of matchingPlayers) {
      affectedPlayersToBackup.push(p);
      if (!p.transfermarktId) {
        console.log(`Updating DB player ${p.fullName} (${p.id}) with confirmed TM ID: ${info.tmId}`);
        await prisma.player.update({
          where: { id: p.id },
          data: { transfermarktId: info.tmId }
        });
      }
    }
  }

  fs.writeFileSync(
    backupPath,
    JSON.stringify(affectedPlayersToBackup, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2),
    'utf8'
  );
  console.log(`Saved pre-update backup of ${affectedPlayersToBackup.length} players to: ${backupPath}`);

  // Write unverified_fm_players.csv
  const unverifiedHeaders = ['fmId', 'fullName', 'clubName', 'reason'];
  const unverifiedCsv = [
    unverifiedHeaders.join(','),
    ...unverifiedFmPlayers.map(r => unverifiedHeaders.map(h => escapeCsvField(r[h])).join(','))
  ].join('\n') + '\n';
  fs.writeFileSync('unverified_fm_players.csv', unverifiedCsv, 'utf8');
  console.log(`Wrote unverified FM players list: unverified_fm_players.csv (count: ${unverifiedFmPlayers.length})`);

  // 3. Process applied_changes.csv
  console.log('\n--- Processing applied_changes.csv ---');
  const rawApplied = fs.readFileSync('applied_changes.csv', 'utf8');
  const appliedRecords = parse(rawApplied, { columns: true, skip_empty_lines: true });

  console.log(`Initial parsed rows in applied_changes.csv: ${appliedRecords.length}`);

  const appliedHeaders = [
    'playerId',
    'transfermarktId',
    'fullName',
    'action',
    'fromClubId',
    'fromClubName',
    'toClubId',
    'toClubName',
    'shirtNumber',
    'position',
    'status',
    'timestamp'
  ];

  const processedApplied = appliedRecords.map((r: any) => {
    let tmId = '';
    if (r.playerId.startsWith('FM_')) {
      tmId = CONFIRMED_FM_MAP[r.playerId]?.tmId || '';
    } else if (playerByCuid.has(r.playerId)) {
      tmId = playerByCuid.get(r.playerId)!;
    }

    return {
      playerId: r.playerId,
      transfermarktId: tmId,
      fullName: r.fullName,
      action: r.action,
      fromClubId: r.fromClubId,
      fromClubName: r.fromClubName,
      toClubId: r.toClubId,
      toClubName: r.toClubName,
      shirtNumber: r.shirtNumber,
      position: r.position,
      status: normalizeStatus(r.status),
      timestamp: r.timestamp
    };
  });

  const appliedCsv = [
    appliedHeaders.join(','),
    ...processedApplied.map(row => appliedHeaders.map(h => escapeCsvField((row as any)[h])).join(','))
  ].join('\n') + '\n';

  fs.writeFileSync('applied_changes.csv', appliedCsv, 'utf8');
  console.log(`Wrote applied_changes.csv with ${processedApplied.length} rows and transfermarktId column.`);

  // 4. Process all applied_*_changes.csv
  const leagueChangeFiles = [
    'applied_epl_changes.csv',
    'applied_laliga_changes.csv',
    'applied_bundesliga_changes.csv',
    'applied_seriea_changes.csv',
    'applied_ligue1_changes.csv',
    'applied_portugal_changes.csv'
  ];

  const standardHeaders = [
    'timestamp',
    'clubId',
    'clubName',
    'playerId',
    'transfermarktId',
    'fullName',
    'action',
    'oldClubId',
    'oldClubName',
    'newClubId',
    'newClubName',
    'oldStatus',
    'newStatus',
    'notes'
  ];

  for (const f of leagueChangeFiles) {
    if (!fs.existsSync(f)) continue;
    const records = parse(fs.readFileSync(f, 'utf8'), { columns: true, skip_empty_lines: true });
    console.log(`\n--- Processing ${f} (${records.length} rows) ---`);

    const updated = records.map((r: any) => {
      let tmId = '';
      if (r.playerId.startsWith('FM_')) {
        tmId = CONFIRMED_FM_MAP[r.playerId]?.tmId || '';
      } else if (playerByCuid.has(r.playerId)) {
        tmId = playerByCuid.get(r.playerId)!;
      }

      // Check notes for loan indicators to normalize status
      const notes = r.notes || '';
      const oldStatus = normalizeStatus(r.oldStatus);
      const newStatus = normalizeStatus(r.newStatus, notes);

      return {
        timestamp: r.timestamp,
        clubId: r.clubId,
        clubName: r.clubName,
        playerId: r.playerId,
        transfermarktId: tmId,
        fullName: r.fullName,
        action: r.action,
        oldClubId: r.oldClubId,
        oldClubName: r.oldClubName,
        newClubId: r.newClubId,
        newClubName: r.newClubName,
        oldStatus,
        newStatus,
        notes
      };
    });

    const csvContent = [
      standardHeaders.join(','),
      ...updated.map(row => standardHeaders.map(h => escapeCsvField((row as any)[h])).join(','))
    ].join('\n') + '\n';

    fs.writeFileSync(f, csvContent, 'utf8');
    console.log(`Wrote ${f} with ${updated.length} rows.`);
  }

  // 5. Process applied_loan_changes.csv
  if (fs.existsSync('applied_loan_changes.csv')) {
    const loanRecords = parse(fs.readFileSync('applied_loan_changes.csv', 'utf8'), { columns: true, skip_empty_lines: true });
    console.log(`\n--- Processing applied_loan_changes.csv (${loanRecords.length} rows) ---`);

    const loanHeaders = [
      'timestamp',
      'playerId',
      'transfermarktId',
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

    const updatedLoans = loanRecords.map((r: any) => {
      let tmId = '';
      if (r.playerId.startsWith('FM_')) {
        tmId = CONFIRMED_FM_MAP[r.playerId]?.tmId || '';
      } else if (playerByCuid.has(r.playerId)) {
        tmId = playerByCuid.get(r.playerId)!;
      }

      return {
        timestamp: r.timestamp,
        playerId: r.playerId,
        transfermarktId: tmId,
        fullName: r.fullName,
        action: r.action,
        parentClubId: r.parentClubId,
        parentClubName: r.parentClubName,
        previousCurrentClubId: r.previousCurrentClubId,
        previousCurrentClubName: r.previousCurrentClubName,
        newCurrentClubId: r.newCurrentClubId,
        newCurrentClubName: r.newCurrentClubName,
        previousStatus: normalizeStatus(r.previousStatus),
        newStatus: normalizeStatus(r.newStatus),
        loanUntil: r.loanUntil,
        notes: r.notes
      };
    });

    const loanCsv = [
      loanHeaders.join(','),
      ...updatedLoans.map(row => loanHeaders.map(h => escapeCsvField((row as any)[h])).join(','))
    ].join('\n') + '\n';

    fs.writeFileSync('applied_loan_changes.csv', loanCsv, 'utf8');
    console.log(`Wrote applied_loan_changes.csv with ${updatedLoans.length} rows.`);
  }

  console.log('\n=== Artifact Cleaning Completed Successfully ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
