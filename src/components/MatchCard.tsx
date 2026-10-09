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

  const hasSquadValues =
    typeof homeSquadValue === "number" &&
    homeSquadValue > 0 &&
    typeof awaySquadValue === "number" &&
    awaySquadValue > 0;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group block rounded-2xl glass-panel glass-panel-hover p-2.5 sm:p-3 border border-divider/80 hover:border-accent/30 transition-all max-h-[96px] h-[92px] flex flex-col justify-between overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 min-w-0">
        {/* Teams and Scores (2 compact rows) */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Home Team */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-4 h-4 shrink-0 overflow-hidden">
                <EntityImage
                  src={match.home.imageUrl}
                  alt={match.home.name}
                  width={16}
                  height={16}
                  entityType="club"
                  className="object-contain"
                />
              </div>
              <span
                title={match.home.name}
                className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                  isFinished &&
                  match.home.score !== undefined &&
                  match.away.score !== undefined &&
                  match.home.score > match.away.score
                    ? "text-text-primary"
                    : "text-text-secondary"
                }`}
              >
                {getClubDisplayName(match.home.name)}
              </span>
            </div>
            <span
              className={`text-xs sm:text-sm font-black figure px-1 ${
                isLive ? "text-value-text" : isFinished ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {isLive || isFinished ? match.home.score ?? 0 : "-"}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-4 h-4 shrink-0 overflow-hidden">
                <EntityImage
                  src={match.away.imageUrl}
                  alt={match.away.name}
                  width={16}
                  height={16}
                  entityType="club"
                  className="object-contain"
                />
              </div>
              <span
                title={match.away.name}
                className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                  isFinished &&
                  match.away.score !== undefined &&
                  match.home.score !== undefined &&
                  match.away.score > match.home.score
                    ? "text-text-primary"
                    : "text-text-secondary"
                }`}
              >
                {getClubDisplayName(match.away.name)}
              </span>
            </div>
            <span
              className={`text-xs sm:text-sm font-black figure px-1 ${
                isLive ? "text-value-text" : isFinished ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {isLive || isFinished ? match.away.score ?? 0 : "-"}
            </span>
          </div>
        </div>

        {/* Right Status Badge */}
        <div className="shrink-0 flex flex-col items-end justify-center pl-2 border-l border-divider/80 min-w-[68px]">
          {isLive ? (
            <div className="font-bold px-2 py-0.5 rounded-md text-[11px] tabular-nums bg-trend-down/15 border border-trend-down/30 flex items-center">
              <LiveMinute
                shortTime={match.status.liveTime?.short}
                longTime={match.status.liveTime?.long}
                isLive={true}
                isHT={isHT}
                showPulsingDot={true}
                className="text-[11px] text-trend-down font-bold"
              />
            </div>
          ) : (
            <span
              className={`font-bold px-2 py-0.5 rounded-md text-[11px] tabular-nums ${
                isFinished ? "bg-bg-chip/80 text-text-secondary" : "bg-bg-chip/40 text-text-muted"
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
          <span className="text-[10px] text-text-muted mt-1 truncate max-w-[80px]">
            {match.leagueName || "Match"}
          </span>
        </div>
      </div>

      {/* Disparity Bar (if available) or footer line */}
      {hasSquadValues ? (
        <div className="w-full h-1 bg-bg-chip rounded-full overflow-hidden flex mt-1">
          <div
            className="h-full bg-accent/80 transition-all"
            style={{
              width: `${Math.round(
                (homeSquadValue! / (homeSquadValue! + awaySquadValue!)) * 100
              )}%`,
            }}
          />
          <div
            className="h-full bg-divider transition-all"
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
      ) : (
        <div className="flex items-center justify-between text-[10px] text-text-muted mt-1">
          <span className="truncate">{match.leagueName || "Match Details"}</span>
          <span className="text-value-text/80 font-medium">Details →</span>
        </div>
      )}
    </Link>
  );
}
