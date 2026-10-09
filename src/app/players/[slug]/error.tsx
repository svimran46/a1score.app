"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/ui";

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
    <div className="max-w-[720px] mx-auto space-y-4">
      <ErrorState
        title="Couldn't load this player right now."
        message="The profile data didn't arrive. Try again, or browse other players."
        onRetry={reset}
      />
      <p className="text-center">
        <Link
          href="/players"
          className="inline-flex items-center min-h-11 px-3 text-sm font-semibold text-text-primary hover:underline rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          Browse players
        </Link>
      </p>
    </div>
  );
}
