"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import {
  THEME_CHANGE_EVENT,
  applyResolvedTheme,
  currentResolvedTheme,
  readThemePreference,
  setThemePreference,
  type ResolvedTheme,
} from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ResolvedTheme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => {
      const resolved = currentResolvedTheme();
      applyResolvedTheme(resolved);
      setTheme(resolved);
    };
    sync();

    // Stay in sync with the Settings page and, in "system" mode, the OS.
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    const mq = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const onSystemChange = () => {
      if (readThemePreference() === "system") sync();
    };
    mq?.addEventListener?.("change", onSystemChange);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
      mq?.removeEventListener?.("change", onSystemChange);
    };
  }, []);

  // The quick toggle always sets an explicit theme; "System default" is
  // chosen from Settings.
  const toggleTheme = () => {
    setTheme(setThemePreference(theme === "dark" ? "light" : "dark"));
  };

  if (!mounted) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[var(--bg-chip)]" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-[var(--accent)]" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--text-primary)]" />
      )}
    </button>
  );
}
