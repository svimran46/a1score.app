"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";
import { MenuGroup, MenuRow } from "@/components/more/MenuRow";

/** Settings → Account: only shown while signed in. */
export function AccountSettings() {
  const router = useRouter();
  const { status, session, client } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "signed-in" || !session || !client) return null;

  const signOut = async () => {
    setBusy(true);
    await client.auth.signOut().catch(() => {});
    setBusy(false);
    router.push("/more");
  };

  const deleteAccount = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await client.rpc("delete_my_account");
    if (err) {
      setBusy(false);
      setError("Couldn't delete your account. Please try again, or email admin@a1score.app.");
      return;
    }
    // The session is no longer valid; clear it locally.
    await client.auth.signOut({ scope: "local" }).catch(() => {});
    setBusy(false);
    router.push("/more");
  };

  return (
    <div id="account" className="scroll-mt-24">
      <MenuGroup title="Account">
        <MenuRow icon={LogOut} label="Sign out" description={session.user.email ?? undefined} onClick={signOut} />
        <MenuRow
          icon={Trash2}
          label="Delete account"
          description="Removes your account and everything synced to it"
          onClick={() => setConfirming((c) => !c)}
          ariaExpanded={confirming}
        />
        {confirming && (
          <div className="px-4 py-4 space-y-3" role="alertdialog" aria-labelledby="delete-account-title">
            <p id="delete-account-title" className="text-sm text-[var(--text-primary)]">
              Delete your a1score account? Your synced follows and settings are removed from our servers. This
              device keeps its own copy.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={deleteAccount}
                disabled={busy}
                className="min-h-[44px] px-4 rounded-xl bg-[var(--trend-down)] text-[var(--accent-contrast)] text-sm font-bold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                Delete account
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-[44px] px-4 rounded-xl bg-[var(--bg-chip)] text-sm font-semibold text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                Cancel
              </button>
            </div>
            {error && (
              <p role="alert" className="text-sm text-[var(--trend-down)]">
                {error}
              </p>
            )}
          </div>
        )}
      </MenuGroup>
    </div>
  );
}
