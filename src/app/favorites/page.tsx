"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import { TeamLogo } from "@/components/shared/team-logo";
import { EmptyState } from "@/components/shared/states";
import { useFavoritesHydrated } from "@/lib/hooks/use-favorites";
import type { FavoriteItem } from "@/lib/store/favorites";

/**
 * Favorites (Section 8.8): favorited teams/leagues from the persisted
 * Zustand store. No account system in this build (scope choice).
 */
export default function FavoritesPage() {
  const favorites = useFavoritesHydrated();
  const teams = favorites.filter((f): f is FavoriteItem & { kind: "team" } => f.kind === "team");
  const leagues = favorites.filter((f): f is FavoriteItem & { kind: "league" } => f.kind === "league");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Favorites</h1>

      {favorites.length === 0 ? (
        <EmptyState
          icon={<Star aria-hidden className="size-8" />}
          title="No favorites yet"
          message="Star teams and leagues to keep them one tap away."
        />
      ) : (
        <>
          {teams.length > 0 ? (
            <section aria-labelledby="fav-teams" className="flex flex-col gap-2">
              <h2 id="fav-teams" className="text-sm font-semibold">
                Teams
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((f) => (
                  <li key={`team-${f.id}`}>
                    <Link
                      href={`/teams/${f.id}`}
                      className="bg-card hover:border-primary/40 flex items-center gap-3 rounded-xl border p-3 transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <TeamLogo src={f.logoUrl} alt={f.name} size={28} />
                      <span className="truncate text-sm font-medium">{f.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {leagues.length > 0 ? (
            <section aria-labelledby="fav-leagues" className="flex flex-col gap-2">
              <h2 id="fav-leagues" className="text-sm font-semibold">
                Leagues
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {leagues.map((f) => (
                  <li key={`league-${f.id}`}>
                    <Link
                      href={`/leagues/${f.id}`}
                      className="bg-card hover:border-primary/40 flex items-center gap-3 rounded-xl border p-3 transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <TeamLogo src={f.logoUrl} alt={f.name} size={28} />
                      <span className="truncate text-sm font-medium">{f.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
