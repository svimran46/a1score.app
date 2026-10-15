"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { GOOGLE_SIGN_IN_ENABLED, authRedirectUrl } from "@/lib/auth/client";
import { ensureAuth, useSession } from "@/lib/auth/useSession";
import { SubPageHeader } from "@/components/more/SubPageHeader";

const INPUT =
  "w-full min-h-[52px] px-4 rounded-xl bg-[var(--bg-chip)] text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]";
const PRIMARY =
  "w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-sm font-bold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]";

function friendlyError(message: string): string {
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a minute and try again.";
  if (/expired|invalid/i.test(message)) return "That code didn't work. Check it, or request a new email.";
  return "Something went wrong. Please try again.";
}

export function SignInClient() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "sent">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the SDK as soon as this page opens.
  useEffect(() => {
    void ensureAuth();
  }, []);

  useEffect(() => {
    if (status === "signed-in") router.replace("/more");
  }, [status, router]);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const client = await ensureAuth();
      if (!client) throw new Error("unavailable");
      const { error: err } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: authRedirectUrl(), shouldCreateUser: true },
      });
      if (err) throw err;
      setStep("sent");
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const client = await ensureAuth();
      if (!client) throw new Error("unavailable");
      const { error: err } = await client.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
      if (err) throw err;
      // useSession picks up the new session and redirects.
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const client = await ensureAuth();
    const { error: err } = (await client?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authRedirectUrl() },
    })) ?? { error: new Error("unavailable") };
    if (err) setError(friendlyError(err.message));
  };

  return (
    <div className="max-w-[440px] mx-auto space-y-6 pb-8">
      <SubPageHeader title="Sign in" backHref="/more" backLabel="Back to More" />

      {status === "unavailable" ? (
        <p className="text-sm text-[var(--text-secondary)]">Accounts aren&apos;t available on this version of a1score yet.</p>
      ) : step === "email" ? (
        <div className="space-y-5">
          <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Sign in to keep your follows and settings in sync on every device. No password: we email you a link.
          </p>
          <form onSubmit={sendLink} className="space-y-3">
            <label htmlFor="signin-email" className="block text-sm font-semibold text-[var(--text-primary)]">
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={INPUT}
            />
            <button type="submit" disabled={busy || !email.trim()} className={PRIMARY}>
              {busy ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Mail aria-hidden="true" className="w-4 h-4" />}
              Email me a sign-in link
            </button>
          </form>
          {GOOGLE_SIGN_IN_ENABLED && (
            <button
              type="button"
              onClick={google}
              className="w-full min-h-[48px] rounded-xl bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              Continue with Google
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div role="status" className="p-4 rounded-[var(--card-radius)] bg-[var(--bg-card)] text-[15px] leading-relaxed text-[var(--text-secondary)]">
            We sent a sign-in link to <strong className="text-[var(--text-primary)]">{email.trim()}</strong>. Open it on this
            device to finish signing in.
          </div>
          <form onSubmit={verifyCode} className="space-y-3">
            <label htmlFor="signin-code" className="block text-sm font-semibold text-[var(--text-primary)]">
              Or enter the 6-digit code from the email
            </label>
            <input
              id="signin-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`${INPUT} tracking-[0.4em] text-center tabular-nums`}
            />
            <button type="submit" disabled={busy || code.length !== 6} className={PRIMARY}>
              {busy && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="min-h-[44px] text-sm font-semibold text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
          >
            Use a different email
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-[var(--trend-down)]">
          {error}
        </p>
      )}

      <p className="text-xs leading-relaxed text-[var(--text-muted)]">
        Signing in stores your email, follows and settings with your account. See our{" "}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        . You can delete your account any time from Settings.
      </p>
    </div>
  );
}
