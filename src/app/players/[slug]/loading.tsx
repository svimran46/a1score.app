import { ChartSkeleton } from "@/components/players/ChartSkeleton";

// Mirrors PlayerHero, the section bar and the top of the Value section at the
// same container breakpoints, so the streamed page replaces it without shift.
const bar = "rounded-md bg-bg-elevated motion-safe:animate-pulse";

export default function PlayerProfileLoading() {
  return (
    <div className="@container/profile max-w-[720px] mx-auto" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading player profile</span>

      <div className="hidden sm:block h-[30px]" aria-hidden="true" />

      <div className="rounded-[var(--card-radius)] bg-bg-card p-3 @[560px]/profile:p-5" aria-hidden="true">
        <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-3 @[560px]/profile:grid-cols-[64px_minmax(0,1fr)] @[560px]/profile:gap-x-4">
          <div className="size-14 @[560px]/profile:size-16 rounded-full bg-bg-elevated motion-safe:animate-pulse" />
          <div className="space-y-2 pt-1">
            <div className={`${bar} h-6 w-3/4 @[560px]/profile:h-8`} />
            <div className={`${bar} h-[14px] w-1/2`} />
          </div>
        </div>
        <div className="mt-3 @[560px]/profile:mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <div className={`${bar} h-12 w-36 @[560px]/profile:h-[60px] @[560px]/profile:w-48`} />
              <div className="space-y-1.5 mt-1">
                <div className={`${bar} h-3 w-20`} />
                <div className={`${bar} h-3 w-24`} />
              </div>
            </div>
            <div className={`${bar} mt-1.5 h-[18px] w-52`} />
          </div>
          <div className="hidden @[560px]/profile:flex gap-2">
            <div className={`${bar} h-11 w-[7.5rem] rounded-full`} />
            <div className={`${bar} h-11 w-24 rounded-full`} />
            <div className={`${bar} h-11 w-11 rounded-full`} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 @[560px]/profile:hidden">
          <div className={`${bar} h-11 rounded-full`} />
          <div className={`${bar} h-11 rounded-full`} />
          <div className={`${bar} h-11 rounded-full`} />
        </div>
      </div>

      <div className="h-12 my-1" aria-hidden="true" />

      <div className="space-y-4 pt-4" aria-hidden="true">
        <div className={`${bar} h-[22px] w-16`} />
        <div className="grid grid-cols-2 @[560px]/profile:grid-cols-4 gap-x-4 gap-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className={`${bar} h-3 w-20`} />
              <div className={`${bar} h-4 w-28`} />
              <div className={`${bar} h-3 w-16`} />
            </div>
          ))}
        </div>
        <ChartSkeleton />
      </div>
    </div>
  );
}
