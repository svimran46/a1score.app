import { Skeleton } from "@/components/ui/skeleton";

/** Match-detail loading skeleton — sticky header + tab row + timeline. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-xl border p-4">
        <Skeleton className="mx-auto mb-3 h-4 w-56" />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Skeleton className="mx-auto h-9 w-24" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="mx-auto h-9 w-24" />
        </div>
        <Skeleton className="mx-auto mt-3 h-3 w-40" />
      </div>
      <Skeleton className="h-9 w-full max-w-md rounded-lg" />
      <div className="bg-card rounded-xl border">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b px-4 py-2.5 last:border-0">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
