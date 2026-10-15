"use client";

import { useSyncExternalStore } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { AUTH_CONFIGURED, hasStoredSession, loadAuthClient } from "./client";

export type AuthStatus = "loading" | "signed-out" | "signed-in" | "unavailable";
type AuthState = { status: AuthStatus; session: Session | null; client: SupabaseClient | null };

let state: AuthState = { status: "loading", session: null, client: null };
let loading: Promise<SupabaseClient | null> | null = null;
const listeners = new Set<() => void>();

function set(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

/**
 * Loads the SDK and starts tracking the session. Called by the sign-in pages,
 * and automatically when this device already has a saved session.
 */
export function ensureAuth(): Promise<SupabaseClient | null> {
  if (loading) return loading;
  const pending = loadAuthClient();
  if (!pending) {
    set({ status: "unavailable" });
    return Promise.resolve(null);
  }
  loading = pending.then(async (client) => {
    client.auth.onAuthStateChange((_event, session) => {
      set({ status: session ? "signed-in" : "signed-out", session, client });
    });
    const { data } = await client.auth.getSession().catch(() => ({ data: { session: null } }));
    set({ status: data.session ? "signed-in" : "signed-out", session: data.session, client });
    return client;
  });
  return loading;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (state.status === "loading") {
    if (!AUTH_CONFIGURED) set({ status: "unavailable" });
    else if (hasStoredSession() || window.location.pathname.startsWith("/auth/")) void ensureAuth();
    // No saved session: signed out, without downloading the SDK.
    else if (!loading) set({ status: "signed-out" });
  }
  return () => listeners.delete(listener);
}

const serverState: AuthState = { status: "loading", session: null, client: null };

/** Current account session. "unavailable" means sign-in isn't configured on this deployment. */
export function useSession(): AuthState {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}
