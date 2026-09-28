import Link from "next/link";
import Image from "next/image";
import { FotmobMatch } from "@/lib/fotmob/client";
import { Shield } from "lucide-react";

interface MatchCardProps {
  match: FotmobMatch;
}

export function MatchCard({ match }: MatchCardProps) {
  const isLive = match.isLive;
  const isFinished = match.isFinished;

  // Format kickoff or status
  let statusText = match.time || "TBD";
  if (isLive) {
    statusText = match.status.liveTime?.short || "LIVE";
  } else if (isFinished) {
    statusText = "FT";
  }

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group rounded-2xl glass-panel glass-panel-hover p-4 border border-slate-800/80 flex flex-col justify-between transition-all"
    >
      {/* Header status */}
      <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/50">
        <span className="text-[11px] font-medium text-slate-400 truncate max-w-[180px]">
          {match.leagueName || "League Match"}
        </span>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          <span
            className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
              isLive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : isFinished
                ? "bg-slate-800 text-slate-400"
                : "bg-slate-800/60 text-slate-300"
            }`}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="py-3 space-y-2.5">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="relative w-6 h-6 rounded-md bg-slate-800/80 p-0.5 flex-shrink-0 flex items-center justify-center">
              {match.home.imageUrl ? (
                <Image
                  src={match.home.imageUrl}
                  alt={match.home.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              ) : (
                <Shield className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>
            <span
              className={`text-sm truncate font-medium ${
                isFinished && match.home.score !== undefined && match.away.score !== undefined && match.home.score > match.away.score
                  ? "text-white font-bold"
                  : "text-slate-200"
              }`}
            >
              {match.home.name}
            </span>
          </div>
          <span
            className={`text-base font-black px-1.5 ${
              isLive ? "text-emerald-400" : isFinished ? "text-white" : "text-slate-500"
            }`}
          >
            {isLive || isFinished ? match.home.score ?? 0 : "-"}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="relative w-6 h-6 rounded-md bg-slate-800/80 p-0.5 flex-shrink-0 flex items-center justify-center">
              {match.away.imageUrl ? (
                <Image
                  src={match.away.imageUrl}
                  alt={match.away.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              ) : (
                <Shield className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>
            <span
              className={`text-sm truncate font-medium ${
                isFinished && match.away.score !== undefined && match.home.score !== undefined && match.away.score > match.home.score
                  ? "text-white font-bold"
                  : "text-slate-200"
              }`}
            >
              {match.away.name}
            </span>
          </div>
          <span
            className={`text-base font-black px-1.5 ${
              isLive ? "text-emerald-400" : isFinished ? "text-white" : "text-slate-500"
            }`}
          >
            {isLive || isFinished ? match.away.score ?? 0 : "-"}
          </span>
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-500">
        <span>Match Center</span>
        <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
          Details →
        </span>
      </div>
    </Link>
  );
}
