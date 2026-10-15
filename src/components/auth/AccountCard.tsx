"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, CloudOff, HardDrive, Loader2, UserCircle2 } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";
import { useSyncStatus } from "@/lib/sync/useSyncStatus";

const CARD = "flex items-start gap-4 px-4 py-4 rounded-[var(--card-radius)] bg-[var(--bg-card)]";

/** Top of the More hub: FotMob's "keep your settings safe" card, or who you're signed in as. */
export function AccountCard() {
  const { status, session } = useSession();
  const sync = useSyncStatus();

  if (status === "unavailable") {
    return (
      <div className={CARD}>
        <HardDrive aria-hidden="true" className="w-6 h-6 shrink-0 text-[var(--text-muted)] mt-0.5" />
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Your follows and settings are saved on this device. Clearing your browser data resets them.
        </p>
      </div>
    );
  }

  if (status === "signed-in" && session) {
    const email = session.user.email ?? "your account";
    return (
      <div className={CARD}>
        <span
          aria-hidden="true"
          className="w-10 h-10 shrink-0 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center text-lg font-black uppercase"
        >
          {email.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{email}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]" role="status">
            {sync === "syncing" ? (
              <>
                <Loader2 aria-hidden="true" className="w-3.5 h-3.5 animate-spin" /> Syncing…
              </>
            ) : sync === "error" ? (
              <>
                <CloudOff aria-hidden="true" className="w-3.5 h-3.5 text-[var(--trend-down)]" /> Couldn&apos;t sync. We&apos;ll retry
                on your next change.
              </>
            ) : (
              <>
                <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 text-[var(--live)]" /> Follows and settings synced
              </>
            )}
          </p>
        </div>
        <Link
          href="/settings#account"
          className="min-h-[44px] px-3 inline-flex items-center rounded-xl text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          Account
        </Link>
      </div>
    );
  }

  return (
    <div className={CARD}>
      <UserCircle2 aria-hidden="true" className="w-7 h-7 shrink-0 text-[var(--text-muted)]" />
      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-[15px] leading-relaxed text-[var(--text-primary)]">
          We can keep your follows and settings safe so you can sync them across devices or get them back on a new
          device.
        </p>
        <Link
          href="/signin"
          className="inline-flex min-h-[44px] items-center px-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-page)] text-[15px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
