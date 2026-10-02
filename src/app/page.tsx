import { getMostValuablePlayers } from "@/lib/data/players";
import { getTopClubs } from "@/lib/data/clubs";
import { getMatchesByDate } from "@/lib/fotmob/client";
import { supabase } from "@/lib/supabase";
import {
  Card,
  SectionHeader,
  MatchRow,
  PlayerRow,
  ClubRow,
  TransferRow,
} from "@/components/ui";
import { sanitizeImageUrl } from "@/lib/image-sanitize";
import { formatDate } from "@/lib/utils";
import type { FotmobMatch } from "@/lib/fotmob/client";

export const revalidate = 30;
export const runtime = "edge";

interface HomeTransferItem {
  id: string;
  playerName: string;
  playerSlug?: string | null;
  playerAvatar?: string | null;
  playerPosition?: string | null;
  fromClubName?: string | null;
  toClubName?: string | null;
  fee?: number | string | null;
  date?: string | null;
}

const FALLBACK_TRANSFERS: HomeTransferItem[] = [
  {
    id: "t1",
    playerName: "Kylian Mbappé",
    playerPosition: "Centre-Forward",
    fromClubName: "Paris Saint-Germain",
    toClubName: "Real Madrid",
    fee: "Free",
    date: "Jul 1, 2024",
  },
  {
    id: "t2",
    playerName: "Julián Álvarez",
    playerPosition: "Centre-Forward",
    fromClubName: "Manchester City",
    toClubName: "Atlético Madrid",
    fee: 75000000,
    date: "Aug 12, 2024",
  },
  {
    id: "t3",
    playerName: "Dani Olmo",
    playerPosition: "Attacking Midfield",
    fromClubName: "RB Leipzig",
    toClubName: "Barcelona",
    fee: 55000000,
    date: "Aug 9, 2024",
  },
  {
    id: "t4",
    playerName: "Pedro Neto",
    playerPosition: "Right Winger",
    fromClubName: "Wolverhampton Wanderers",
    toClubName: "Chelsea",
    fee: 60000000,
    date: "Aug 11, 2024",
  },
  {
    id: "t5",
    playerName: "João Félix",
    playerPosition: "Second Striker",
    fromClubName: "Atlético Madrid",
    toClubName: "Chelsea",
    fee: 52000000,
    date: "Aug 21, 2024",
  },
];

const FALLBACK_TOP_CLUBS = [
  {
    id: "cmuihn2f40001b23f2qf4z79i",
    name: "Real Madrid",
    leagueName: "LaLiga",
    country: "Spain",
    squadSize: 24,
    totalSquadValue: 1360000000,
  },
  {
    id: "cmuihn2f40002b23f2qf4z79i",
    name: "Manchester City",
    leagueName: "Premier League",
    country: "England",
    squadSize: 23,
    totalSquadValue: 1260000000,
  },
  {
    id: "cmuihn2f40003b23f2qf4z79i",
    name: "Arsenal",
    leagueName: "Premier League",
    country: "England",
    squadSize: 24,
    totalSquadValue: 1170000000,
  },
  {
    id: "cmuihn2f40004b23f2qf4z79i",
    name: "Barcelona",
    leagueName: "LaLiga",
    country: "Spain",
    squadSize: 25,
    totalSquadValue: 940000000,
  },
  {
    id: "cmuihn2f40005b23f2qf4z79i",
    name: "Bayern Munich",
    leagueName: "Bundesliga",
    country: "Germany",
    squadSize: 25,
    totalSquadValue: 940000000,
  },
];

export default async function HomePage() {
  const [valuablePlayers, topClubs, matchesData, latestTransfersRes] = await Promise.all([
    getMostValuablePlayers(5).catch(() => []),
    getTopClubs(5).catch(() => []),
    getMatchesByDate().catch(() => null),
    supabase
      .from("Transfer")
      .select(`
        id,
        fromClubName,
        toClubName,
        date,
        feeEur,
        transferType,
        player:Player (
          id,
          fullName,
          commonName,
          photoUrl,
          position,
          transfermarktId
        )
      `)
      .order("date", { ascending: false, nullsFirst: false })
      .limit(5)
      .then(
        (res) => res.data || [],
        () => []
      ),
  ]);

  // Extract up to 3 highlighted matches (prioritizing live, else next 3 kickoffs)
  const allMatches: FotmobMatch[] = (matchesData?.leagues || []).flatMap((l) => l.matches);
  const liveMatches = allMatches.filter((m) => m.isLive);

  let matchSectionTitle = "Live now";
  let displayedMatches: FotmobMatch[] = [];

  if (liveMatches.length > 0) {
    matchSectionTitle = "Live now";
    displayedMatches = liveMatches.slice(0, 3);
  } else {
    matchSectionTitle = "Today's Matches";
    const upcomingMatches = allMatches.filter((m) => m.isUpcoming || !m.isFinished);
    upcomingMatches.sort((a, b) => a.timeTS - b.timeTS);
    displayedMatches = (upcomingMatches.length > 0 ? upcomingMatches : allMatches).slice(0, 3);
  }

  // Map database transfers or fallback
  const transfers =
    latestTransfersRes && latestTransfersRes.length > 0
      ? latestTransfersRes.map((t: any) => {
          const rawPlayer = t.player;
          const p = Array.isArray(rawPlayer) ? rawPlayer[0] : rawPlayer;
          return {
            id: t.id,
            playerName: p?.commonName || p?.fullName || "Player",
            playerSlug: p ? `${(p.fullName || "player").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${p.transfermarktId || p.id}` : null,
            playerAvatar: p ? sanitizeImageUrl(p.photoUrl, "player", p.transfermarktId || p.id) : null,
            playerPosition: p?.position || null,
            fromClubName: t.fromClubName,
            toClubName: t.toClubName,
            fee: t.feeEur ? Number(t.feeEur) : t.transferType,
            date: t.date ? formatDate(t.date) : null,
          };
        })
      : FALLBACK_TRANSFERS;

  // Map top clubs or fallback
  const clubs = topClubs && topClubs.length > 0 ? topClubs.slice(0, 5) : FALLBACK_TOP_CLUBS;

  return (
    <div className="space-y-6 max-w-[720px] mx-auto">
      {/* 1. COMPACT LIVE NOW STRIP (Match rows) */}
      <section>
        <SectionHeader
          title={matchSectionTitle}
          href="/matches"
          actionLabel="All matches"
        />
        <Card className="p-1 space-y-0.5">
          {displayedMatches.length > 0 ? (
            displayedMatches.map((match) => (
              <MatchRow
                key={match.id}
                id={match.id}
                homeName={match.home.name}
                homeCrest={match.home.imageUrl}
                awayName={match.away.name}
                awayCrest={match.away.imageUrl}
                homeScore={match.home.score}
                awayScore={match.away.score}
                isLive={match.isLive}
                liveMinute={match.status?.liveTime?.short || match.status?.reason?.short || "LIVE"}
                isFinished={match.isFinished}
                statusText={match.status?.scoreStr || (match.isFinished ? "FT" : undefined)}
                kickoffTime={match.time}
              />
            ))
          ) : (
            <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
              No live matches right now. Check upcoming fixtures.
            </div>
          )}
        </Card>
      </section>

      {/* 2. MOST VALUABLE (Player rows, top 5, "See all" link) */}
      <section>
        <SectionHeader
          title="Most Valuable Players"
          href="/values"
          actionLabel="See all"
        />
        <Card className="p-1 space-y-0.5">
          {valuablePlayers.slice(0, 5).map((player, idx) => (
            <PlayerRow
              key={player.id}
              rank={idx + 1}
              id={player.id}
              name={player.fullName}
              slug={player.slug}
              avatarUrl={player.photoUrl}
              clubName={player.currentClub?.name}
              clubCrest={player.currentClub?.logoUrl}
              position={player.position}
              marketValue={player.latestMarketValue}
            />
          ))}
        </Card>
      </section>

      {/* 3. LATEST TRANSFERS (Transfer rows) */}
      <section>
        <SectionHeader
          title="Latest Transfers"
          href="/transfers"
          actionLabel="See all"
        />
        <Card className="p-1 space-y-0.5">
          {transfers.slice(0, 5).map((transfer) => (
            <TransferRow
              key={transfer.id}
              playerName={transfer.playerName}
              playerSlug={transfer.playerSlug}
              playerAvatar={transfer.playerAvatar}
              playerPosition={transfer.playerPosition}
              fromClubName={transfer.fromClubName}
              toClubName={transfer.toClubName}
              fee={transfer.fee}
              date={transfer.date}
            />
          ))}
        </Card>
      </section>

      {/* 4. TOP CLUBS BY SQUAD VALUE (Club rows) */}
      <section>
        <SectionHeader
          title="Top Clubs by Squad Value"
          href="/clubs"
          actionLabel="See all"
        />
        <Card className="p-1 space-y-0.5">
          {clubs.map((club: any, idx: number) => (
            <ClubRow
              key={club.id}
              rank={idx + 1}
              id={club.id}
              name={club.name}
              crestUrl={club.logoUrl}
              leagueName={club.leagueName}
              country={club.country}
              squadSize={club.playerCount || club.squadSize}
              squadValue={club.totalSquadValue}
            />
          ))}
        </Card>
      </section>
    </div>
  );
}
