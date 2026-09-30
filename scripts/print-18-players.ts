import { prisma } from "../src/lib/prisma";

async function main() {
  const ids = [
    // Manchester City (6)
    "cmuihvxfp04e7sexpuxl5r6dm", // Nathan Aké
    "cmuihw3ek0bbasexpm5jfxo1v", // Max Alleyne
    "cmuihw0jk08eisexplqpqf0t0", // Tijjani Reijnders
    "cmuihw0jp08h7sexpvpztw1o9", // Nico González
    "cmuihw2q00avtsexppurxa90p", // Savinho
    "cmuihw3ez0bmlsexpk658e1si", // Sverre Nypan
    // Arsenal FC (4)
    "cmuihvwru03vysexpyx8qaql4", // Leandro Trossard
    "cmuihw3fc0bvvsexpksu1ma1l", // Alexéi Rojas
    "cmuihw24k0a6qsexp2t10fjmh", // Gabriel Martinelli
    "cmuihw3el0bc2sexp7tgcux59", // Tommy Setford
    // Real Madrid (1)
    "cmuihw43g0c1usexpoyvhnmbv", // Sergio Mestre
    // FC Barcelona (4)
    "cmuihvvss02q7sexpqzpx8ho5", // Marc-André ter Stegen
    "cmuihvyqs062usexp2dgrq0ia", // Iñaki Peña
    "cmuihw3fb0buzsexp1fp9wgz6", // Diego Kochen
    "cmuihw43y0cecsexpynmi2300", // Guille Fernández
    // Bayern Munich (3)
    "cmuihvxg504posexp15lk11oa", // Alexander Nübel
    "cmuihw1dh09f7sexpmr0846vg", // Armindo Sieb
    "cmuihw44a0cmgsexp04jlacss", // Wisdom Mike
  ];

  const players = await prisma.player.findMany({
    where: { id: { in: ids } },
    include: { currentClub: true },
    orderBy: [{ currentClubId: "asc" }, { fullName: "asc" }],
  });

  for (const p of players) {
    console.log(
      JSON.stringify({
        club: p.currentClub?.name,
        name: p.fullName,
        position: p.position,
        status: p.status,
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().split("T")[0] : null,
        marketValueEur: p.latestMarketValue ? Number(p.latestMarketValue) : 0,
        transfermarktId: p.transfermarktId,
        id: p.id,
      })
    );
  }
}

main().finally(() => prisma.$disconnect());
