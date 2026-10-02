"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  Check,
  Smartphone,
  Info,
  Send,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useNotifications } from "@/lib/notifications/useNotifications";

export function NotificationSettingsCard() {
  const {
    isMounted,
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    threshold,
    setThreshold,
    subscribe,
    unsubscribe,
    sendTestNotification,
    isIOS,
    needsInstallForPush,
    showInstallGuide,
    setShowInstallGuide,
  } = useNotifications();

  const [testSent, setTestSent] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  if (!isMounted) {
    return (
      <div className="p-4 sm:p-5 rounded-[var(--card-radius)] bg-[var(--bg-card)] border border-[var(--divider)] shadow-xs animate-pulse">
        <div className="h-5 w-44 bg-[var(--bg-chip)] rounded mb-2" />
        <div className="h-4 w-64 bg-[var(--bg-chip)] rounded" />
      </div>
    );
  }

  const thresholdOptions = [
    { label: "±3%", value: 0.03 },
    { label: "±5%", value: 0.05 },
    { label: "±10%", value: 0.10 },
  ];

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe(threshold);
    }
  };

  const handleTest = async () => {
    setTestLoading(true);
    const success = await sendTestNotification(false);
    setTestLoading(false);
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-[var(--card-radius)] bg-[var(--bg-card)] border border-[var(--divider)] shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-chip)] flex items-center justify-center shrink-0">
            {isSubscribed ? (
              <Bell className="w-4 h-4 text-[var(--accent)]" />
            ) : (
              <BellOff className="w-4 h-4 text-[var(--text-muted)]" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Value Update Alerts
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Get an alert when a player you follow has a market valuation update.
            </p>
          </div>
        </div>

        {/* Action Toggle / Button */}
        <div className="shrink-0 flex items-center gap-2">
          {permission === "denied" ? (
            <span className="text-xs font-semibold text-[var(--trend-down)] bg-[var(--bg-chip)] px-2.5 py-1.5 rounded-lg">
              Blocked in Browser
            </span>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              disabled={isLoading || !isSupported}
              className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] select-none ${
                isSubscribed
                  ? "bg-[var(--bg-chip)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--divider)]"
                  : "bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95"
              } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSubscribed ? (
                <span>Turn off alerts</span>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Get alerts</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* iOS Installation Guidance Banner */}
      {needsInstallForPush && (
        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--divider)] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--value-text)]">
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>iOS Web Push Setup</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            On iPhone and iPad, Apple requires installing the app to the home screen to receive push notifications.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span>Tap</span>
            <span className="font-semibold text-[var(--text-primary)]">Share</span>
            <span>in Safari and choose</span>
            <span className="font-semibold text-[var(--text-primary)]">&apos;Add to Home Screen&apos;</span>.
          </div>
        </div>
      )}

      {/* Settings Row when Subscribed */}
      {isSubscribed && (
        <div className="pt-3 border-t border-[var(--divider)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">
                Alert Threshold
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Only notify when value changes by at least this amount
              </span>
            </div>

            {/* Threshold Chips */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-chip)] p-1 rounded-xl">
              {thresholdOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setThreshold(opt.value)}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                    threshold === opt.value
                      ? "bg-[var(--bg-card)] text-[var(--accent)] shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test Push Button */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              Verify notifications on this device
            </span>
            <button
              type="button"
              onClick={handleTest}
              disabled={testLoading}
              className="min-h-[36px] px-3 rounded-lg bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              {testLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : testSent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[var(--trend-up)]" />
                  <span>Alert sent</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send test alert</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Privacy Note */}
      <div className="pt-2 border-t border-[var(--divider)] flex items-start gap-2 text-[11px] text-[var(--text-muted)] leading-relaxed">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--accent)]" />
        <p>
          We only store your anonymous push endpoint, encryption keys, and followed player IDs.
          No names, emails, or personal information are collected. You can turn off alerts at any time to delete your stored subscription.
        </p>
      </div>
    </div>
  );
}
