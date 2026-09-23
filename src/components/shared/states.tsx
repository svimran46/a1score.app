import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Empty state with icon, title and message. */
export function EmptyState({
  icon = null,
  title,
  message,
  className,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-muted-foreground [&_svg]:size-8">{icon}</div>
      ) : null}
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      </div>
    </div>
  );
}

/** Error state with a retry action. */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <AlertTriangle className="size-8 text-destructive" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Generic skeleton card shaped like a list row (zero layout shift). */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border p-3", className)}>
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-8" />
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-5 w-10" />
    </div>
  );
}

/** Stack of skeleton rows for list placeholders. */
export function SkeletonList({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
