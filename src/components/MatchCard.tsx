import Link from "next/link";
import { EntityImage } from "./EntityImage";
import { FotmobMatch } from "@/lib/fotmob/client";
import { formatCompactEur } from "@/lib/utils";
import { getClubDisplayName } from "@/lib/data/clubs";
import { LiveMinute } from "./LiveMinute";
import { KickoffTime } from "./KickoffTime";

interface MatchCardProps {
  match: FotmobMatch;
  homeSquadValue?: number | null;
  awaySquadValue?: number | null;
}

export function MatchCard({
  match,
  homeSquadValue,
  awaySquadValue,
}: MatchCardProps) {
  const isLive = match.isLive;
  const isFinished = match.isFinished;
  const isHT =
    match.status.liveTime?.short?.toUpperCase() === "HT" ||
    match.status.reason?.short?.toUpperCase() === "HT" ||
    match.status.liveTime?.short?.toLowerCase() === "half time";

  // Format kickoff or status
  let statusText = match.time || "TBD";
  if (isLive) {
    statusText = isHT ? "HT" : match.status.liveTime?.short || "LIVE";
  } else if (isFinished) {
    statusText = "FT";
  }

  const hasSquadValues =
    typeof homeSquadValue === "number" &&
    homeSquadValue > 0 &&
    typeof awaySquadValue === "number" &&
    awaySquadValue > 0;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group rounded-2xl glass-panel glass-panel-hover p-4 border border-slate-800/80 hover:border-amber-500/30 flex flex-col justify-between transition-all"
    >
      {/* Header status */}
      <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/50">
        <span className="text-[11px] font-medium text-slate-400 truncate max-w-[180px]">
          {match.leagueName || "League Match"}
        </span>
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <div className="font-bold px-2 py-0.5 rounded-md text-[11px] tabular-nums bg-rose-500/15 border border-rose-500/30 flex items-center">
              <LiveMinute
                shortTime={match.status.liveTime?.short}
                longTime={match.status.liveTime?.long}
                isLive={true}
                isHT={isHT}
                showPulsingDot={true}
                className="text-[11px] text-rose-400"
              />
            </div>
          ) : (
            <span
              className={`font-bold px-2 py-0.5 rounded-md text-[11px] tabular-nums ${
                isFinished
                  ? "bg-slate-800 text-slate-400"
                  : "bg-slate-800/60 text-slate-300"
              }`}
            >
              {isFinished ? (
                "FT"
              ) : match.timeTS ? (
                <KickoffTime date={match.timeTS} />
              ) : match.time ? (
                match.time.includes("UTC") ? match.time : `${match.time} UTC`
              ) : (
                "TBD"
              )}
            </span>
          )}
        </div>
      </div>

      {/* Teams & Score */}
      <div className="py-3 space-y-2.5">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="relative w-6 h-6 rounded-md bg-slate-800/80 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <EntityImage
                src={match.home.imageUrl}
                alt={match.home.name}
                width={20}
                height={20}
                entityType="club"
                className="object-contain"
              />
            </div>
            <span
              title={match.home.name}
              className={`text-sm truncate font-medium ${
                isFinished &&
                match.home.score !== undefined &&
                match.away.score !== undefined &&
                match.home.score > match.away.score
                  ? "text-white font-bold"
                  : "text-slate-200"
              }`}
            >
              {getClubDisplayName(match.home.name)}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {typeof homeSquadValue === "number" && homeSquadValue > 0 && (
              <span className="text-[10px] font-semibold text-amber-400/80 tabular-nums hidden sm:inline">
                {formatCompactEur(homeSquadValue)}
              </span>
            )}
            <span
              className={`text-base font-black px-1.5 tabular-nums ${
                isLive ? "text-pitch-400" : isFinished ? "text-white" : "text-slate-500"
              }`}
            >
              {isLive || isFinished ? match.home.score ?? 0 : "-"}
            </span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="relative w-6 h-6 rounded-md bg-slate-800/80 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <EntityImage
                src={match.away.imageUrl}
                alt={match.away.name}
                width={20}
                height={20}
                entityType="club"
                className="object-contain"
              />
            </div>
            <span
              title={match.away.name}
              className={`text-sm truncate font-medium ${
                isFinished &&
                match.away.score !== undefined &&
                match.home.score !== undefined &&
                match.away.score > match.home.score
                  ? "text-white font-bold"
                  : "text-slate-200"
              }`}
            >
              {getClubDisplayName(match.away.name)}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {typeof awaySquadValue === "number" && awaySquadValue > 0 && (
              <span className="text-[10px] font-semibold text-amber-400/80 tabular-nums hidden sm:inline">
                {formatCompactEur(awaySquadValue)}
              </span>
            )}
            <span
              className={`text-base font-black px-1.5 tabular-nums ${
                isLive ? "text-pitch-400" : isFinished ? "text-white" : "text-slate-500"
              }`}
            >
              {isLive || isFinished ? match.away.score ?? 0 : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Disparity Bar (if squad values available) */}
      {hasSquadValues && (
        <div className="py-1">
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-amber-500/80 transition-all"
              style={{
                width: `${Math.round(
                  (homeSquadValue! / (homeSquadValue! + awaySquadValue!)) * 100
                )}%`,
              }}
            />
            <div
              className="h-full bg-slate-700 transition-all"
              style={{
                width: `${
                  100 -
                  Math.round(
                    (homeSquadValue! / (homeSquadValue! + awaySquadValue!)) * 100
                  )
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 font-medium">
          <span className="text-amber-400">Squad Values</span> & Match Center
        </span>
        <span className="text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
          Details →
        </span>
      </div>
    </Link>
  );
}
