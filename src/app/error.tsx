"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** Route error boundary with a retry action. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center"
    >
      <p className="font-medium">Something went wrong</p>
      <p className="text-muted-foreground max-w-sm text-sm">
        An unexpected error occurred while rendering this page. It has been logged.
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
