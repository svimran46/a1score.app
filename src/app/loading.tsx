import { SkeletonList } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";

/** Matches-page loading skeleton — shaped like the real content. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <SkeletonList rows={7} />
    </div>
  );
}
