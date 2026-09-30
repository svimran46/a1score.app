import { notFound } from "next/navigation";
import { EntityImage } from "@/components/EntityImage";
import Link from "next/link";
import { getLeagueById } from "@/lib/data/leagues";
import { formatCompactEur } from "@/lib/utils";
import { Trophy, Clock } from "lucide-react";
import { LeagueFinancialParity } from "@/components/LeagueFinancialParity";
import { LeagueStandingsTable } from "@/components/LeagueStandingsTable";
import { LeagueLeaders } from "@/components/LeagueLeaders";
import { constructMetadata, SITE_URL } from "@/lib/metadata";
import type { Metadata } from "next";

export const revalidate = 3600;
export const runtime = "edge";

interface LeaguePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: LeaguePageProps): Promise<Metadata> {
  const league = await getLeagueById(params.id);
  if (!league) {
    return constructMetadata({
      title: "Competition Not Found",
      description: "The requested football competition could not be located.",
      path: `/leagues/${params.id}`,
    });
  }

  return constructMetadata({
    title: `${league.name} — Standings, Club Valuations & Stats`,
    description: `${league.name} standings (${league.season || "2026/2027"}), competition table, ${league.clubCount} participating clubs, and squad market valuation analytics on a1score.app.`,
    path: `/leagues/${params.id}`,
    image: league.logoUrl || undefined,
  });
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const league = await getLeagueById(params.id);

  if (!league) {
    return notFound();
  }

  const totalLeagueValue = league.clubs.reduce((acc, c) => acc + c.totalSquadValue, 0);
  const hasStandings = league.standings && league.standings.length > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: league.name,
    sport: "Football",
    url: `${SITE_URL}/leagues/${params.id}`,
    subOrganization: league.clubs?.slice(0, 30).map((c) => ({
      "@type": "SportsTeam",
      name: c.name,
      url: `${SITE_URL}/clubs/${c.id}`,
    })),
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* League Header */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-slate-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center justify-center shadow-xl flex-shrink-0">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {league.country} • Tier {league.tier || 1}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {league.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{league.clubCount} Clubs</span>
                <span>•</span>
                <span>Season {league.season || "2026/2027"}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3" />
                  Updated {new Date(league.lastUpdated || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:items-end justify-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total Competition Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mt-1 tabular-nums">
              {formatCompactEur(totalLeagueValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Parity & Disparity Barometer */}
      <LeagueFinancialParity
        clubs={league.clubs}
        standings={league.standings || []}
        totalLeagueValue={totalLeagueValue}
        leagueName={league.name}
      />

      {/* Unified Standings & Squad Valuation Table (F1 & F3) */}
      {hasStandings && (
        <LeagueStandingsTable
          standings={league.standings}
          leagueName={league.name}
          season={league.season}
          legend={league.legend}
        />
      )}

      {/* League Leaders & Quick Switcher to Other European Leagues (F5) */}
      <LeagueLeaders
        topScorers={league.topScorers || []}
        topAssists={league.topAssists || []}
        otherLeagues={league.otherLeagues || []}
        currentLeagueId={league.id}
        season={league.season}
      />

      {/* Transparent Data Attribution Footer */}
      <div className="text-center text-xs text-slate-500 py-2 space-y-1">
        <p>
          Data sources: FotMob match engine & Transfermarkt squad market valuations.
        </p>
        <p className="text-[11px] text-slate-600">
          Standings and form reflect the active 2026/2027 domestic season.
        </p>
      </div>
    </div>
  );
}
