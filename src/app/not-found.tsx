import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="relative">
        <span className="text-[120px] font-black text-slate-800/50 leading-none select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="w-12 h-12 text-amber-400/60" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="text-sm text-slate-400 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Try searching for a player, club, or league instead.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-ink-950 text-sm font-bold hover:bg-amber-400 transition-colors"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 border border-slate-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          Search
        </Link>
      </div>
    </div>
  );
}
