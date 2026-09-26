import Link from "next/link";
import Image from "next/image";
import { formatCompactEur } from "@/lib/utils";
import { User } from "lucide-react";

interface PlayerCardProps {
  player: {
    id: string;
    fullName: string;
    commonName?: string | null;
    position: string;
    nationality: string[];
    photoUrl?: string | null;
    transfermarktId?: string | null;
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
  const slug = `${player.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${
    player.transfermarktId || player.id
  }`;

  return (
    <Link
      href={`/players/${slug}`}
      className="group block rounded-2xl glass-panel glass-panel-hover p-4 border border-slate-800 transition-all overflow-hidden"
    >
      <div className="flex items-start gap-4">
        {/* Photo Container */}
        <div className="relative w-16 h-16 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700/60">
          {player.photoUrl ? (
            <Image
              src={player.photoUrl}
              alt={player.fullName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <User className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Player Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {player.position}
            </span>
            {player.latestMarketValue ? (
              <span className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                {formatCompactEur(player.latestMarketValue)}
              </span>
            ) : null}
          </div>

          <h3 className="text-base font-bold text-white tracking-tight truncate mt-1 group-hover:text-emerald-300 transition-colors">
            {player.commonName || player.fullName}
          </h3>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
            {player.currentClub && (
              <div className="flex items-center gap-1.5 truncate">
                {player.currentClub.logoUrl && (
                  <div className="relative w-3.5 h-3.5 flex-shrink-0">
                    <Image
                      src={player.currentClub.logoUrl}
                      alt={player.currentClub.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <span className="truncate">{player.currentClub.name}</span>
              </div>
            )}
            {player.nationality && player.nationality.length > 0 && (
              <span className="text-slate-500">• {player.nationality[0]}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
