/**
 * Browser Supabase client for optional accounts. Separate from the shared
 * server client in lib/supabase.ts, which never keeps a session.
 *
 * The SDK is imported lazily: visitors who never sign in don't download it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qqjpgehtutdmkkkxnefu.supabase.co";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const STORAGE_KEY = "a1score-auth";

/** False when the deployment has no real anon key (local dev, CI): sign-in is hidden. */
export const AUTH_CONFIGURED = /^eyJ/.test(ANON_KEY) && !ANON_KEY.endsWith(".placeholder");

/** Google sign-in needs provider credentials in Supabase; opt in per deployment. */
export const GOOGLE_SIGN_IN_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";

let clientPromise: Promise<SupabaseClient> | null = null;

export function loadAuthClient(): Promise<SupabaseClient> | null {
  if (!AUTH_CONFIGURED || typeof window === "undefined") return null;
  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(SUPABASE_URL, ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Picks up the session from the magic-link / OAuth redirect.
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
      },
    })
  );
  return clientPromise;
}

/** A session saved by a previous sign-in on this device (no SDK needed to check). */
export function hasStoredSession(): boolean {
  try {
    return !!window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export function authRedirectUrl(): string {
  return `${window.location.origin}/auth/callback`;
}
