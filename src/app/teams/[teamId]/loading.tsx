import { Skeleton } from "@/components/ui/skeleton";

/** Team-detail loading skeleton — header + tabs + rows. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card flex items-center gap-3 rounded-xl border p-4">
        <Skeleton className="size-11 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-1.5 h-5 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>
      <Skeleton className="h-9 w-full max-w-md rounded-lg" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-card flex items-center gap-3 rounded-xl border p-3">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
