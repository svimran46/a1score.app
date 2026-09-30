"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, Search, Users } from "lucide-react";
import Link from "next/link";

export default function PlayerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[a1score] Player profile error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
        <Users className="w-8 h-8 text-amber-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Player Profile Unavailable</h1>
        <p className="text-sm text-slate-400 max-w-md">
          Something went wrong loading this player profile. Please try again or search for another player.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-slate-600 mt-2">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-ink-950 text-sm font-bold hover:bg-amber-400 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <Link
          href="/players"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-amber-400 text-sm font-semibold hover:bg-slate-700 border border-slate-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          Browse Players
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-slate-300 text-sm font-semibold hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
