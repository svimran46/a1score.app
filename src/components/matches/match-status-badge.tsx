import { isLiveStatus, statusChip } from "@/lib/match-status";
import { LiveDot } from "@/components/shared/live-dot";
import { cn } from "@/lib/utils";

/**
 * Status chip for a fixture: pulsing red live minute, muted FT, or plain
 * kickoff time. Reduced-motion users get a static badge.
 */
export function MatchStatusBadge({
  statusShort,
  elapsed,
  date,
  className,
}: {
  statusShort: string;
  elapsed: number | null;
  date: string;
  className?: string;
}) {
  const chip = statusChip({ statusShort, elapsed, date });
  const isLive = isLiveStatus(statusShort);

  return (
    <span
      className={cn(
        "tabnum inline-flex min-w-9 items-center justify-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-semibold",
        isLive && chip.tone === "live" && "bg-live/10 text-live",
        !isLive && chip.tone === "muted" && "bg-muted text-muted-foreground",
        chip.tone === "plain" && "text-muted-foreground",
        className,
      )}
    >
      {isLive ? <LiveDot /> : null}
      {chip.label}
    </span>
  );
}
