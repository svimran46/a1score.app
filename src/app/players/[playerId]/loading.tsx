import { Skeleton } from "@/components/ui/skeleton";

/** Player-detail loading skeleton — profile header + stat tiles. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card flex items-center gap-4 rounded-xl border p-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-1.5 h-5 w-44" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-card rounded-xl border p-3 text-center">
            <Skeleton className="mx-auto mb-1 h-7 w-10" />
            <Skeleton className="mx-auto h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
