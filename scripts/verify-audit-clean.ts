import fs from 'fs';
import { parse } from 'csv-parse/sync';

const EXPECTED_COUNTS: Record<string, number> = {
  'applied_changes.csv': 76,
  'applied_epl_changes.csv': 313,
  'applied_laliga_changes.csv': 399,
  'applied_bundesliga_changes.csv': 337,
  'applied_seriea_changes.csv': 467,
  'applied_ligue1_changes.csv': 375,
  'applied_portugal_changes.csv': 414,
  'applied_loan_changes.csv': 42,
};

const ALLOWED_STATUSES = new Set(['first_team', 'academy', 'on_loan', 'departed', '']);

function main() {
  console.log('=== VERIFYING AUDIT ARTIFACTS ===\n');

  let allPassed = true;

  for (const [file, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
    if (!fs.existsSync(file)) {
      console.error(`❌ File ${file} missing!`);
      allPassed = false;
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');
    let records: any[];
    try {
      records = parse(content, { columns: true, skip_empty_lines: true });
    } catch (e: any) {
      console.error(`❌ File ${file} failed to parse: ${e.message}`);
      allPassed = false;
      continue;
    }

    const countOk = records.length === expectedCount;
    const hasTmCol = 'transfermarktId' in records[0];

    console.log(`File: ${file}`);
    console.log(`  - Parse: ✅ CLEAN`);
    console.log(`  - Rows: ${records.length} / expected ${expectedCount} -> ${countOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  - transfermarktId column: ${hasTmCol ? '✅ PRESENT' : '❌ MISSING'}`);

    if (!countOk || !hasTmCol) allPassed = false;

    // Verify status strings
    for (const r of records) {
      for (const key of ['status', 'oldStatus', 'newStatus', 'previousStatus']) {
        if (r[key] !== undefined && !ALLOWED_STATUSES.has(r[key])) {
          console.error(`  ❌ Invalid status in ${file}, field ${key}: "${r[key]}"`);
          allPassed = false;
        }
      }
    }
  }

  // Verify Cancelo, Longoni, Tzolis
  console.log('\n=== Verifying Cancelo, Longoni, Tzolis rows ===');
  const appliedChanges = parse(fs.readFileSync('applied_changes.csv', 'utf8'), { columns: true });

  const cancelo = appliedChanges.find((r: any) => r.fullName.includes('Cancelo'));
  console.log(`João Cancelo: TM_ID="${cancelo?.transfermarktId}" (expected 182712) -> ${cancelo?.transfermarktId === '182712' ? '✅ PASS' : '❌ FAIL'}`);

  const longoni = appliedChanges.find((r: any) => r.fullName.includes('Longoni'));
  console.log(`Alessandro Longoni: TM_ID="${longoni?.transfermarktId}" (expected 1074986) -> ${longoni?.transfermarktId === '1074986' ? '✅ PASS' : '❌ FAIL'}`);

  const tzolis = appliedChanges.find((r: any) => r.fullName.includes('Tzolis'));
  console.log(`Christos Tzolis: TM_ID="${tzolis?.transfermarktId}" (expected 451677) -> ${tzolis?.transfermarktId === '451677' ? '✅ PASS' : '❌ FAIL'}`);

  if (cancelo?.transfermarktId !== '182712' || longoni?.transfermarktId !== '1074986' || tzolis?.transfermarktId !== '451677') {
    allPassed = false;
  }

  // Inspect last 2 rows of applied_changes.csv
  console.log('\n=== Last 2 rows of applied_changes.csv ===');
  console.log('Row 75 (Kalvin Phillips):', appliedChanges[74]);
  console.log('Row 76 (Rodri):', appliedChanges[75]);

  console.log(`\nOVERALL AUDIT VERIFICATION: ${allPassed ? '✅ ALL PASS' : '❌ FAILED'}`);
}

main();
