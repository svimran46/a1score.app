"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth/useSession";

/** Mounted once in the root layout: keeps follows and settings in sync while signed in. */
export function AccountSync() {
  const { status, session, client } = useSession();
  const userId = session?.user.id ?? null;
  const previousUser = useRef<string | null>(null);

  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      // The sync engine is only downloaded for signed-in visitors.
      const { forgetSyncedUser, startSync } = await import("@/lib/sync/engine");
      if (cancelled) return;
      if (status === "signed-out" && previousUser.current) {
        forgetSyncedUser();
        previousUser.current = null;
      }
      if (status === "signed-in" && userId && client) {
        previousUser.current = userId;
        stop = startSync(client, userId);
      }
    })();
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [status, userId, client]);

  return null;
}
