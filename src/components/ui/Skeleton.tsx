import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base shimmer pulse skeleton
 */
export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--bg-chip)] rounded-lg ${className}`}
      {...props}
    />
  );
}

/**
 * Card skeleton placeholder with fixed card radius and padding
 */
export function CardSkeleton({
  className = "",
  rows = 3,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div
      className={`bg-[var(--bg-card)] rounded-[var(--card-radius)] p-[var(--card-padding)] space-y-4 animate-pulse ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-4 w-12 rounded-md" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * MatchRow skeleton with fixed height (56px) and centered score/time placeholder
 */
export function MatchRowSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-[1fr_80px_1fr] items-center gap-2 sm:gap-3 px-3 sm:px-4 h-14 min-h-[56px] rounded-xl animate-pulse ${className}`}
    >
      {/* Home: Name + Crest */}
      <div className="flex items-center justify-end gap-2.5 pr-1">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="w-6 h-6 rounded-md shrink-0" />
      </div>

      {/* Center: Score/Time */}
      <div className="flex flex-col items-center justify-center gap-1">
        <Skeleton className="h-4 w-12 rounded" />
        <Skeleton className="h-3 w-8 rounded" />
      </div>

      {/* Away: Crest + Name */}
      <div className="flex items-center justify-start gap-2.5 pl-1">
        <Skeleton className="w-6 h-6 rounded-md shrink-0" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    </div>
  );
}

/**
 * PlayerRow skeleton with fixed height (64px) matching PlayerRow
 */
export function PlayerRowSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3 sm:px-4 h-[var(--row-height)] min-h-[64px] rounded-xl animate-pulse ${className}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton className="w-6 h-4 rounded shrink-0" />
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
    </div>
  );
}

/**
 * ClubRow skeleton with fixed height (64px) matching ClubRow
 */
export function ClubRowSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3 sm:px-4 h-[var(--row-height)] min-h-[64px] rounded-xl animate-pulse ${className}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton className="w-6 h-4 rounded shrink-0" />
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  );
}

/**
 * TransferRow skeleton with fixed height (64px) matching TransferRow
 */
export function TransferRowSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3 sm:px-4 h-[var(--row-height)] min-h-[64px] rounded-xl animate-pulse ${className}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 px-2 sm:px-4">
        <Skeleton className="w-7 h-7 rounded-lg" />
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-7 h-7 rounded-lg" />
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  );
}
