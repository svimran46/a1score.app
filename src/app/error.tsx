"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, Search } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in dev, could be wired to a reporting service
    console.error("[a1score] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-value-text" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
        <p className="text-sm text-text-muted max-w-md">
          An unexpected error occurred while loading this page. Please try again or search the platform.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-text-muted mt-2">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-ink-950 text-sm font-bold hover:bg-accent transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <Link
          href="/search"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-chip text-value-text text-sm font-semibold hover:bg-divider border border-divider transition-colors"
        >
          <Search className="w-4 h-4" />
          Search
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-card text-text-secondary text-sm font-semibold hover:bg-bg-chip border border-divider transition-colors"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
