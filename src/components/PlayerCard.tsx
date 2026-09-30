import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";

interface PlayerCardProps {
  player: {
    id: string;
    fullName: string;
    commonName?: string | null;
    position: string;
    nationality: string[];
    photoUrl?: string | null;
    sourceId?: string | null;
    externalId?: string | null;
    slug?: string | null;
    latestMarketValue?: number;
    currentClub?: {
      id: string;
      name: string;
      logoUrl?: string | null;
      league?: { name: string } | null;
    } | null;
  };
}

export function PlayerCard({ player }: PlayerCardProps) {
  const extId = player.sourceId || player.externalId || player.id;
  const slug =
    player.slug ||
    `${player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`;

  return (
    <Link
      href={`/players/${slug}`}
      className="group block rounded-2xl glass-panel glass-panel-hover p-3 sm:p-4 border border-slate-800/80 hover:border-amber-500/30 transition-all overflow-hidden"
    >
      <div className="flex items-center sm:items-start gap-3 sm:gap-4">
        {/* Photo Container */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800 shrink-0 overflow-hidden border border-slate-700/60">
          <EntityImage
            src={player.photoUrl}
            alt=""
            fill
            entityType="player"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="64px"
          />
        </div>

        {/* Player Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
              {player.position}
            </span>
            {player.latestMarketValue ? (
              <span className="text-xs sm:text-sm font-extrabold text-amber-400 tabular-nums whitespace-nowrap">
                {formatCompactEur(player.latestMarketValue)}
              </span>
            ) : null}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate mt-1 group-hover:text-amber-300 transition-colors">
            {player.commonName || player.fullName}
          </h3>

          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[11px] sm:text-xs text-slate-400 min-w-0">
            {player.currentClub && (
              <div className="flex items-center gap-1.5 truncate min-w-0">
                {player.currentClub.logoUrl && (
                  <div className="relative w-3.5 h-3.5 shrink-0">
                    <EntityImage
                      src={player.currentClub.logoUrl}
                      alt=""
                      fill
                      sizes="14px"
                      entityType="club"
                      className="object-contain"
                    />
                  </div>
                )}
                <span className="truncate">{player.currentClub.name}</span>
              </div>
            )}
            {player.nationality && player.nationality.length > 0 && (
              <span className="text-slate-500 shrink-0">• {player.nationality[0]}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
