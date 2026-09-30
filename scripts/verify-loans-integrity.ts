import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICATION OF LOANS & SQUADS ===\n');

  // 1. Verify Ethan Nwaneri
  const nwaneri = await prisma.player.findFirst({
    where: { fullName: { contains: 'Ethan Nwaneri', mode: 'insensitive' } },
    include: { currentClub: true, parentClub: true }
  });
  console.log('1. Ethan Nwaneri:');
  console.log(`   fullName: ${nwaneri?.fullName}`);
  console.log(`   status: ${nwaneri?.status} (expected: on_loan)`);
  console.log(`   currentClub: ${nwaneri?.currentClub?.name} (expected: Borussia Dortmund)`);
  console.log(`   parentClub: ${nwaneri?.parentClub?.name} (expected: Arsenal FC)`);
  console.log(`   loanUntil: ${nwaneri?.loanUntil?.toISOString()}`);
  const nwaneriOk = nwaneri?.status === 'on_loan' &&
    nwaneri?.currentClub?.name === 'Borussia Dortmund' &&
    nwaneri?.parentClub?.name === 'Arsenal FC';
  console.log(`   VERIFIED: ${nwaneriOk ? '✅ PASS' : '❌ FAIL'}\n`);

  // 2. Verify other example loan players
  const otherExamples = [
    { name: 'Wilfried Gnonto', expectedParent: 'Leeds United', expectedCurrent: 'ACF Fiorentina' },
    { name: 'Robert Sánchez', expectedParent: 'Chelsea FC', expectedCurrent: 'Como 1907' },
    { name: 'Marc Guiu', expectedParent: 'Chelsea FC', expectedCurrent: 'RB Leipzig' },
    { name: 'Pape Matar Sarr', expectedParent: 'Tottenham Hotspur', expectedCurrent: 'Juventus FC' },
    { name: 'Guglielmo Vicario', expectedParent: 'Tottenham Hotspur', expectedCurrent: 'Juventus FC' },
    { name: 'Tommy Setford', expectedParent: 'Arsenal FC', expectedCurrent: null }, // non-DB club
  ];

  console.log('2. Key Example Loan Players:');
  for (const ex of otherExamples) {
    const p = await prisma.player.findFirst({
      where: { fullName: { contains: ex.name, mode: 'insensitive' } },
      include: { currentClub: true, parentClub: true }
    });
    const pOk = p?.status === 'on_loan' &&
      p?.parentClub?.name === ex.expectedParent &&
      (ex.expectedCurrent === null ? p?.currentClub === null : p?.currentClub?.name === ex.expectedCurrent);
    console.log(`   - ${p?.fullName}: status=${p?.status}, parent=${p?.parentClub?.name}, current=${p?.currentClub?.name || 'NULL'} -> ${pOk ? '✅ PASS' : '❌ FAIL'}`);
  }

  // 3. Verify Chelsea's active roster
  const chelsea = await prisma.club.findFirst({
    where: { name: 'Chelsea FC' },
    include: {
      players: {
        where: { status: { not: 'departed' } },
        orderBy: { fullName: 'asc' }
      },
      loanedOutPlayers: true
    }
  });

  console.log('\n3. Chelsea FC Active Roster:');
  console.log(`   squadSize in Club table: ${chelsea?.squadSize}`);
  console.log(`   active players count: ${chelsea?.players.length}`);
  console.log(`   loanedOutPlayers count: ${chelsea?.loanedOutPlayers.length}`);

  // Check that NONE of Chelsea's loaned out players are in Chelsea's active players
  const chelseaLoanedOutIds = new Set(chelsea?.loanedOutPlayers.map(p => p.id));
  const activeHasLoanOut = chelsea?.players.some(p => chelseaLoanedOutIds.has(p.id));
  console.log(`   Active roster contains loan-outs? ${activeHasLoanOut ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);

  // Check that Chelsea active roster players are valid
  const chelseaPlayersSample = chelsea?.players.map(p => p.fullName);
  console.log(`   Active players sample: ${chelseaPlayersSample?.slice(0, 10).join(', ')}...`);

  // 4. Verify Arsenal squad totals exclude Ethan Nwaneri
  const arsenal = await prisma.club.findFirst({
    where: { name: 'Arsenal FC' },
    include: {
      players: {
        where: { status: { not: 'departed' } }
      },
      loanedOutPlayers: true
    }
  });
  const arsenalHasNwaneri = arsenal?.players.some(p => p.id === nwaneri?.id);
  console.log('\n4. Arsenal FC Active Roster:');
  console.log(`   squadSize: ${arsenal?.squadSize}`);
  console.log(`   Contains Ethan Nwaneri in active players? ${arsenalHasNwaneri ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);
  console.log(`   Contains Ethan Nwaneri in loanedOutPlayers? ${arsenal?.loanedOutPlayers.some(p => p.id === nwaneri?.id) ? '✅ YES (PASS)' : '❌ NO (FAIL)'}`);

  // 5. Verify Borussia Dortmund includes Ethan Nwaneri
  const bvb = await prisma.club.findFirst({
    where: { name: 'Borussia Dortmund' },
    include: {
      players: {
        where: { status: { not: 'departed' } }
      }
    }
  });
  const bvbHasNwaneri = bvb?.players.some(p => p.id === nwaneri?.id);
  console.log('\n5. Borussia Dortmund Active Roster:');
  console.log(`   squadSize: ${bvb?.squadSize}`);
  console.log(`   Contains Ethan Nwaneri in active players? ${bvbHasNwaneri ? '✅ YES (PASS)' : '❌ NO (FAIL)'}`);

  // 6. Overall loan count in DB
  const totalLoansInDb = await prisma.player.count({
    where: { status: 'on_loan' }
  });
  console.log(`\n6. Total players with status = 'on_loan' in DB: ${totalLoansInDb}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
