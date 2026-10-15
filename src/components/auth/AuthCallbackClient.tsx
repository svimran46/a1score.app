"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ensureAuth, useSession } from "@/lib/auth/useSession";

/** Landing page for the magic link / Google redirect: the SDK reads the session from the URL. */
export function AuthCallbackClient() {
  const router = useRouter();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
    const desc = params.get("error_description");
    if (desc) setError(desc.replace(/\+/g, " "));
    void ensureAuth();
  }, []);

  useEffect(() => {
    if (status === "signed-in") router.replace("/more");
  }, [status, router]);

  if (error || status === "signed-out" || status === "unavailable") {
    return (
      <div className="max-w-[440px] mx-auto space-y-4 py-8 text-center">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Couldn&apos;t sign you in</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {error ?? "This link has expired or was already used. Links work once, on the device that requested them."}
        </p>
        <Link
          href="/signin"
          className="inline-flex min-h-[44px] items-center px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-sm font-bold"
        >
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[440px] mx-auto flex items-center justify-center gap-2 py-16 text-[var(--text-secondary)]" role="status">
      <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" />
      Signing you in…
    </div>
  );
}
