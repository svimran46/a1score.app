import Link from "next/link";
import { getMostValuablePlayers, getMarketValueMovers } from "@/lib/data/players";
import { getLeagues } from "@/lib/data/leagues";
import { getMatchesByDate } from "@/lib/fotmob/client";
import { SectionHeader } from "@/components/SectionHeader";
import { HomeMatchRow } from "@/components/HomeMatchRow";
import { HomePlayerRow } from "@/components/HomePlayerRow";
import { EntityImage } from "@/components/EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getLeagueSlug } from "@/lib/slugs";
import type { FotmobMatch } from "@/lib/fotmob/client";

export const revalidate = 30;
export const runtime = "edge";

export default async function HomePage() {
  const [valuablePlayers, leagues, matchesData, movers] = await Promise.all([
    getMostValuablePlayers(5),
    getLeagues(),
    getMatchesByDate().catch(() => null),
    getMarketValueMovers(5).catch(() => ({ risers: [], fallers: [] })),
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
    matchSectionTitle = "Today";
    // Sort upcoming kickoffs by timeTS
    const upcomingMatches = allMatches.filter((m) => m.isUpcoming || !m.isFinished);
    upcomingMatches.sort((a, b) => a.timeTS - b.timeTS);
    displayedMatches = (upcomingMatches.length > 0 ? upcomingMatches : allMatches).slice(0, 3);
  }

  // Movers: select top 3 risers (or fallers if risers empty)
  const moverList =
    movers.risers.length > 0
      ? movers.risers.slice(0, 3)
      : movers.fallers.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 2. Section "Live now" / "Today" */}
      <section>
        <SectionHeader
          title={matchSectionTitle}
          href="/matches"
          actionLabel="All matches"
        />
        <div
          className="rounded-[12px] divide-y overflow-hidden"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            borderWidth: "1px",
          }}
        >
          {displayedMatches.length > 0 ? (
            displayedMatches.map((match) => (
              <HomeMatchRow key={match.id} match={match} />
            ))
          ) : (
            <div
              className="px-3 py-4 text-center text-[13px] font-normal"
              style={{ color: "var(--color-text-secondary)" }}
            >
              No fixtures scheduled for today
            </div>
          )}
        </div>
      </section>

      {/* 3. Section "Most valuable" */}
      <section>
        <SectionHeader
          title="Most valuable"
          href="/players"
          actionLabel="See all"
        />
        <div
          className="rounded-[12px] divide-y overflow-hidden"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            borderWidth: "1px",
          }}
        >
          {valuablePlayers.slice(0, 5).map((player, idx) => (
            <HomePlayerRow
              key={player.id}
              rank={idx + 1}
              id={player.id}
              name={player.fullName}
              slug={player.slug}
              photoUrl={player.photoUrl}
              club={player.currentClub}
              marketValue={player.latestMarketValue}
            />
          ))}
        </div>
      </section>

      {/* 4. Section "Biggest movers" */}
      {moverList.length > 0 && (
        <section>
          <SectionHeader
            title="Biggest movers"
            href="/players?view=movers"
            actionLabel="See all"
          />
          <div
            className="rounded-[12px] divide-y overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              borderWidth: "1px",
            }}
          >
            {moverList.map((m, idx) => (
              <HomePlayerRow
                key={m.id}
                rank={idx + 1}
                id={m.id}
                name={m.fullName}
                slug={m.slug}
                photoUrl={m.photoUrl}
                club={m.currentClub}
                marketValue={m.latestValue}
                change={m.diff}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. Section "Leagues" */}
      <section>
        <SectionHeader
          title="Leagues"
          href="/leagues"
          actionLabel="See all"
        />
        <div
          className="rounded-[12px] divide-y overflow-hidden"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            borderWidth: "1px",
          }}
        >
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${getLeagueSlug(league)}`}
              className="h-12 min-h-[48px] px-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
                  <EntityImage
                    src={league.logoUrl}
                    alt={league.name}
                    width={24}
                    height={24}
                    entityType="league"
                    className="object-contain w-6 h-6"
                  />
                </div>
                <span
                  className="text-[15px] font-medium leading-tight truncate"
                  style={{ color: "var(--color-text)" }}
                >
                  {league.name}
                </span>
              </div>
              <span
                className="text-[15px] font-semibold tabular-nums leading-tight shrink-0 pl-3"
                style={{ color: "var(--color-accent)" }}
              >
                {formatCompactEur(league.totalMarketValue)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Footer line */}
      <div
        className="text-center py-6 text-[13px] font-normal"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Data from FotMob and Transfermarkt
      </div>
    </div>
  );
}
