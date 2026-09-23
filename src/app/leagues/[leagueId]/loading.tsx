import { Skeleton } from "@/components/ui/skeleton";

/** League-detail loading skeleton — header card + tab row + table body. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card flex items-center gap-3 rounded-xl border p-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-1.5 h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-9 w-full max-w-md rounded-lg" />
      <div className="bg-card rounded-xl border p-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b py-2.5 last:border-0">
            <Skeleton className="h-4 w-5" />
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
