import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/shared/states";
import { getPlayerProfile } from "@/lib/api-football/players";

interface PlayerPageProps {
  params: Promise<{ playerId: string }>;
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { playerId } = await params;
  const id = Number.parseInt(playerId, 10);
  if (!Number.isInteger(id)) return { title: "Player" };
  const result = await getPlayerProfile(id, new Date().getUTCFullYear() - 1);
  if (!result.ok || !result.data) return { title: "Player" };
  return {
    title: result.data.name,
    description: `Season stats and profile for ${result.data.name}.`,
  };
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-xl border p-3 text-center">
      <p className="tabnum text-xl font-bold">{value ?? "–"}</p>
      <p className="text-muted-foreground text-2xs">{label}</p>
    </div>
  );
}

/**
 * Player detail (Section 8.6): photo, position, age, nationality, season
 * stats. Server Component.
 */
export default async function PlayerPage({ params }: PlayerPageProps) {
  const { playerId } = await params;
  const id = Number.parseInt(playerId, 10);
  if (!Number.isInteger(id)) notFound();

  const season = new Date().getUTCFullYear() - 1;
  const result = await getPlayerProfile(id, season);

  if (!result.ok) {
    return <ErrorState title="Couldn't load player" message="The data source didn't respond." />;
  }
  const player = result.data;
  if (!player) notFound();

  return (
    <div className="flex flex-col gap-4">
      <header className="bg-card flex items-center gap-4 rounded-xl border p-4">
        {player.photoUrl ? (
          <Image
            src={player.photoUrl}
            alt={`${player.name} photo`}
            width={64}
            height={64}
            className="rounded-full border object-cover"
            sizes="64px"
          />
        ) : (
          <span className="bg-muted flex size-16 items-center justify-center rounded-full text-xl font-bold">
            {player.name.charAt(0)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{player.name}</h1>
          <p className="text-muted-foreground text-sm">
            {[player.position, player.nationality, player.age !== null ? `${player.age} yrs` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {player.currentTeamId ? (
            <Link
              href={`/teams/${player.currentTeamId}`}
              className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1.5 rounded-sm text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              View team profile →
            </Link>
          ) : null}
        </div>
      </header>

      <section aria-labelledby="season-stats">
        <h2 id="season-stats" className="mb-2 text-sm font-semibold">
          {season} season
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Appearances" value={player.seasonAppearances ?? "–"} />
          <StatTile label="Goals" value={player.seasonGoals ?? "–"} />
          <StatTile label="Assists" value={player.seasonAssists ?? "–"} />
          <StatTile
            label="Avg rating"
            value={player.seasonRating !== null ? player.seasonRating.toFixed(2) : "–"}
          />
        </div>
      </section>

      <EmptyState
        title="More detail coming with more data"
        message="Per-match player statistics and shot maps arrive with a higher-tier data plan."
      />
    </div>
  );
}
