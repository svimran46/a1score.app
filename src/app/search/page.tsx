import { searchPlayers } from "@/lib/data/players";
import { PlayerCard } from "@/components/PlayerCard";
import { Search, Filter } from "lucide-react";
import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const runtime = "edge";

interface SearchPageProps {
  searchParams: {
    q?: string;
    position?: string;
    filter?: string;
  };
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const query = searchParams.q ? `"${searchParams.q}"` : "Players & Clubs";
  return constructMetadata({
    title: `Search ${query}`,
    description: `Search results for ${query}. Browse player profiles, transfer values, and club squads on a1score.app.`,
    path: "/search",
    noIndex: true,
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";
  const position = searchParams.position || "";

  const players = await searchPlayers(query, {
    position: position || undefined,
    limit: 40,
  });

  const positions = ["Attack", "Midfield", "Defender", "Goalkeeper"];

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-divider bg-bg-card/40 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Player Search & Market Explorer
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Query across global football player databases and market valuation benchmarks
          </p>
        </div>

        {/* Filter controls */}
        <form method="GET" action="/search" className="space-y-4">
          <div className="relative">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by player name..."
              className="w-full bg-bg-page text-sm text-text-primary placeholder-slate-500 rounded-2xl pl-12 pr-4 py-3.5 border border-divider/80 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <Search className="w-5 h-5 text-text-muted absolute left-4 top-4" />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-text-muted mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Position:
            </span>
            <a
              href={`/search?q=${encodeURIComponent(query)}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                !position
                  ? "bg-brand-500 text-text-primary font-bold"
                  : "bg-bg-card text-text-secondary hover:bg-bg-chip border border-divider"
              }`}
            >
              All
            </a>
            {positions.map((pos) => {
              const active = position.toLowerCase() === pos.toLowerCase();
              return (
                <a
                  key={pos}
                  href={`/search?q=${encodeURIComponent(query)}&position=${encodeURIComponent(pos)}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    active
                      ? "bg-brand-500 text-text-primary font-bold"
                      : "bg-bg-card text-text-secondary hover:bg-bg-chip border border-divider"
                  }`}
                >
                  {pos}
                </a>
              );
            })}
          </div>
        </form>
      </div>

      {/* Results Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Found {players.length} player{players.length === 1 ? "" : "s"}</span>
          {query && (
            <span>Matching &quot;{query}&quot;</span>
          )}
        </div>

        {players.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {players.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl glass-panel p-12 border border-divider text-center space-y-2">
            <p className="text-sm font-semibold text-text-secondary">No players found</p>
            <p className="text-xs text-text-muted">
              Try adjusting your query or filter keywords.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
