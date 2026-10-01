"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, Radio } from "lucide-react";
import Link from "next/link";

export default function MatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[a1score] Match center error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-[20px] font-semibold text-[var(--color-text)]">Match details unavailable</h1>
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Could not load match details. Please try again.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="min-h-[44px] px-5 py-2 rounded-lg bg-[var(--color-accent)] text-[#0B0F17] text-[13px] font-semibold transition-colors"
        >
          Retry
        </button>
        <Link
          href="/matches"
          className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-[13px] font-medium flex items-center justify-center transition-colors"
        >
          All matches
        </Link>
      </div>
    </div>
  );
}
