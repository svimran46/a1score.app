import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getClubDisplayName } from "@/lib/data/clubs";
import { getPlayerSlug } from "@/lib/slugs";

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
    getPlayerSlug({ ...player, transfermarktId: extId });

  return (
    <Link
      href={`/players/${slug}`}
      className="group block rounded-2xl glass-panel glass-panel-hover p-2.5 sm:p-3 border border-divider/80 hover:border-accent/30 transition-all overflow-hidden h-[88px] sm:h-[92px] max-h-[96px] flex items-center"
    >
      <div className="flex items-center gap-3 w-full min-w-0">
        {/* Photo Container (48px / 52px) */}
        <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl bg-bg-chip shrink-0 overflow-hidden border border-divider/60 group-hover:scale-105 transition-transform duration-200">
          <EntityImage
            src={player.photoUrl}
            alt=""
            fill
            entityType="player"
            className="object-cover"
            sizes="52px"
          />
        </div>

        {/* Player Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-accent/10 text-value-text border border-accent/20 whitespace-nowrap">
              {player.position}
            </span>
            {player.latestMarketValue ? (
              <span className="text-xs sm:text-sm font-black text-value-text figure tabular-nums whitespace-nowrap">
                {formatCompactEur(player.latestMarketValue)}
              </span>
            ) : null}
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-text-primary tracking-tight truncate mt-0.5 group-hover:text-value-text transition-colors">
            {player.commonName || player.fullName}
          </h3>

          <div className="flex items-center gap-1.5 text-[11px] text-text-muted truncate mt-0.5">
            {player.currentClub && (
              <div className="flex items-center gap-1 truncate min-w-0">
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
                <span className="truncate" title={player.currentClub.name}>
                  {getClubDisplayName(player.currentClub)}
                </span>
              </div>
            )}
            {player.nationality && player.nationality.length > 0 && (
              <span className="text-text-muted shrink-0">• {player.nationality[0]}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
