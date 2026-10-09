"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";

const CONSENT_STORAGE_KEY = "a1score_privacy_consent_v1";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) {
        // Small delay to ensure initial paint has completed without layout shift
        const timer = setTimeout(() => {
          setVisible(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleChoice = (accepted: boolean) => {
    try {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        accepted ? "accepted" : "declined"
      );
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      role="region"
      aria-label="Privacy and cookies"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] inset-x-4 sm:left-auto sm:right-6 lg:bottom-6 sm:max-w-md z-50 bg-[var(--bg-card)] border border-[var(--divider)] rounded-[var(--card-radius)] p-4 sm:p-5 shadow-2xl transition-all duration-300 ease-out transform translate-y-0 opacity-100"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-[var(--bg-chip)] border border-[var(--divider)] shrink-0 text-[var(--accent)] mt-0.5">
          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Privacy & Data Transparency
            </h3>
            <button
              type="button"
              onClick={() => handleChoice(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer"
              aria-label="Dismiss privacy banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            We use cookie-free, privacy-first analytics and local storage to remember your preferences. No cross-site profiling or selling of personal data. Learn more in our{" "}
            <Link
              href="/privacy"
              className="text-[var(--accent)] hover:underline font-medium focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] rounded-xs"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleChoice(true)}
              className="min-h-[44px] sm:min-h-[36px] h-9 px-4 rounded-[var(--chip-radius)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={() => handleChoice(false)}
              className="min-h-[44px] sm:min-h-[36px] h-9 px-3 rounded-[var(--chip-radius)] text-xs font-semibold bg-[var(--bg-chip)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer"
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
