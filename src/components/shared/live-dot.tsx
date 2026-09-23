import { cn } from "@/lib/utils";

/**
 * Small pulsing dot for LIVE states. The pulse is disabled automatically
 * for users who prefer reduced motion (see globals.css).
 */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("live-pulse relative inline-flex size-1.5 rounded-full bg-live text-live", className)}
    />
  );
}
