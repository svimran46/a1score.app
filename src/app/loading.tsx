export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 py-8">
      {/* Page title skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-64 bg-slate-800 rounded-xl" />
        <div className="h-4 w-96 bg-slate-800/60 rounded-lg" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-slate-800 rounded" />
                <div className="h-3 w-1/2 bg-slate-800/60 rounded" />
              </div>
            </div>
            <div className="h-2 w-full bg-slate-800/40 rounded-full" />
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-slate-800/60 rounded" />
              <div className="h-3 w-20 bg-slate-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
