import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import Link from "next/link";

import { TeamLogo } from "@/components/shared/team-logo";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { getLeagues, POPULAR_LEAGUE_IDS } from "@/lib/api-football/leagues";
import type { LeagueSummary } from "@/lib/schemas";

export const metadata: Metadata = {
  title: "Leagues & cups",
  description: "Browse football leagues and cups by country.",
};

export const dynamic = "force-dynamic";

interface LeaguesPageProps {
  searchParams: Promise<{ q?: string }>;
}

function LeagueCard({ league }: { league: LeagueSummary }) {
  return (
    <Link
      href={`/leagues/${league.id}`}
      className="bg-card hover:border-primary/40 hover:shadow-sm flex items-center gap-3 rounded-xl border p-3 transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <TeamLogo src={league.logoUrl} alt={league.name} size={28} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{league.name}</span>
        <span className="text-muted-foreground block truncate text-xs">
          {league.countryName ?? "International"}
          {league.type === "Cup" ? " · Cup" : ""}
        </span>
      </span>
    </Link>
  );
}

function LeagueGrid({ leagues }: { leagues: LeagueSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {leagues.map((l) => (
        <LeagueCard key={l.id} league={l} />
      ))}
    </div>
  );
}

/**
 * Leagues (Section 8.2): Popular pinned, then grouped by country with a
 * search field. Server Component throughout.
 */
export default async function LeaguesPage({ searchParams }: LeaguesPageProps) {
  const [{ q }, leaguesResult] = await Promise.all([searchParams, getLeagues()]);

  if (!leaguesResult.ok) {
    return (
      <ErrorState
        title="Couldn't load leagues"
        message="The data source didn't respond. This is usually temporary."
      />
    );
  }

  const all = leaguesResult.data;
  const query = (q ?? "").trim().toLowerCase();
  const filtered = query
    ? all.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          (l.countryName ?? "").toLowerCase().includes(query),
      )
    : all;

  const popular = POPULAR_LEAGUE_IDS.map((id) => filtered.find((l) => l.id === id)).filter(
    (l): l is LeagueSummary => l !== undefined,
  );
  const rest = filtered.filter((l) => !(POPULAR_LEAGUE_IDS as readonly number[]).includes(l.id));

  const byCountry = new Map<string, LeagueSummary[]>();
  for (const l of rest) {
    const key = l.countryName ?? "International";
    const list = byCountry.get(key);
    if (list) list.push(l);
    else byCountry.set(key, [l]);
  }
  const countries = [...byCountry.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Leagues and cups</h1>

      <form action="/leagues" method="GET" className="relative">
        <label htmlFor="league-search" className="sr-only">
          Filter leagues by name or country
        </label>
        <input
          id="league-search"
          name="q"
          defaultValue={q ?? ""}
          type="search"
          placeholder="Filter by league or country…"
          className="bg-card h-10 w-full rounded-lg border pl-9 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <Trophy
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        />
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Trophy aria-hidden className="size-8" />}
          title="No leagues match"
          message={`Nothing found for “${q ?? ""}”. Try a different name or country.`}
        />
      ) : (
        <>
          {popular.length > 0 && !query ? (
            <section aria-labelledby="popular-heading" className="flex flex-col gap-2">
              <h2 id="popular-heading" className="text-sm font-semibold">
                Popular
              </h2>
              <LeagueGrid leagues={popular} />
            </section>
          ) : null}

          {countries.map(([country, list]) => (
            <section
              key={country}
              aria-labelledby={`country-${country.replace(/\s+/g, "-")}`}
              className="flex flex-col gap-2"
            >
              <h2
                id={`country-${country.replace(/\s+/g, "-")}`}
                className="text-sm font-semibold"
              >
                {country}
                <span className="text-muted-foreground ml-1.5 font-normal">{list.length}</span>
              </h2>
              <LeagueGrid leagues={list} />
            </section>
          ))}
        </>
      )}
    </div>
  );
}
