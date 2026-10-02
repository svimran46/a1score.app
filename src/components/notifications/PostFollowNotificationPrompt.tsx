"use client";

import { useState, useEffect } from "react";
import { Bell, X, Smartphone, Check } from "lucide-react";
import { useNotifications } from "@/lib/notifications/useNotifications";

export function PostFollowNotificationPrompt() {
  const {
    isMounted,
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    needsInstallForPush,
    syncFollowedPlayers,
  } = useNotifications();

  const [promptState, setPromptState] = useState<{
    visible: boolean;
    playerName: string;
  }>({
    visible: false,
    playerName: "",
  });

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePlayerFollowed = (e: Event) => {
      const customEvent = e as CustomEvent<{ name: string; id: string }>;
      const name = customEvent.detail?.name || "this player";

      // If user is already subscribed, silently sync the new player ID
      if (isSubscribed) {
        syncFollowedPlayers();
        return;
      }

      // Never prompt if notifications are blocked or unsupported
      if (!isSupported || permission === "denied") {
        return;
      }

      // Check if user previously dismissed prompt in this session
      const dismissed = sessionStorage.getItem("a1score_push_dismissed");
      if (dismissed === "1") {
        return;
      }

      setPromptState({
        visible: true,
        playerName: name,
      });
    };

    window.addEventListener("a1score:player-followed", handlePlayerFollowed);
    return () => {
      window.removeEventListener("a1score:player-followed", handlePlayerFollowed);
    };
  }, [isSubscribed, isSupported, permission, syncFollowedPlayers]);

  if (!isMounted || !promptState.visible) {
    return null;
  }

  const handleDismiss = () => {
    setPromptState((prev) => ({ ...prev, visible: false }));
    try {
      sessionStorage.setItem("a1score_push_dismissed", "1");
    } catch {}
  };

  const handleEnableAlerts = async () => {
    const success = await subscribe(0.05);
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setPromptState({ visible: false, playerName: "" });
        setIsSuccess(false);
      }, 2000);
    } else if (!needsInstallForPush) {
      handleDismiss();
    }
  };

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] shadow-2xl space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-chip)] flex items-center justify-center shrink-0">
              {isSuccess ? (
                <Check className="w-4 h-4 text-[var(--trend-up)]" />
              ) : needsInstallForPush ? (
                <Smartphone className="w-4 h-4 text-[var(--value-text)]" />
              ) : (
                <Bell className="w-4 h-4 text-[var(--accent)]" />
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {needsInstallForPush ? "Home Screen Alert" : "Value update alert"}
              </h3>
              <p className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                {needsInstallForPush
                  ? `Followed ${promptState.playerName}`
                  : `Get an alert when ${promptState.playerName} changes in value by more than 5%`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss alert prompt"
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Actions */}
        {needsInstallForPush ? (
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              To receive valuation alerts on iOS, tap <span className="font-bold text-[var(--text-primary)]">Share</span> in Safari and choose <span className="font-bold text-[var(--text-primary)]">&apos;Add to Home Screen&apos;</span>.
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              Got it
            </button>
          </div>
        ) : isSuccess ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--trend-up)] py-1">
            <Check className="w-4 h-4" />
            <span>Alerts enabled for players you follow.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleEnableAlerts}
              className="flex-1 min-h-[44px] px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95 text-xs font-bold transition-opacity flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Get alerts</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="min-h-[44px] px-4 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
