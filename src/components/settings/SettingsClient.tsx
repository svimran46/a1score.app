"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  HelpCircle,
  Info,
  Mail,
  Share2,
  ShieldCheck,
  SunMoon,
} from "lucide-react";
import { MenuGroup, MenuRow } from "@/components/more/MenuRow";
import {
  THEME_CHANGE_EVENT,
  THEME_OPTIONS,
  readThemePreference,
  setThemePreference,
  themeLabel,
  type ThemePreference,
} from "@/lib/theme";

export const SUPPORT_EMAIL = "admin@a1score.app";

function ThemeSetting() {
  const [pref, setPref] = useState<ThemePreference | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setPref(readThemePreference());
    sync();
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, sync);
  }, []);

  return (
    <div>
      <MenuRow
        icon={SunMoon}
        label="Theme"
        description={pref ? themeLabel(pref) : " "}
        onClick={() => setOpen((o) => !o)}
        ariaExpanded={open}
        trailing={
          <ChevronDown
            aria-hidden="true"
            className={`w-4 h-4 shrink-0 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`}
          />
        }
      />
      {open && (
        <div role="radiogroup" aria-label="Theme" className="px-4 pb-3 pl-[58px] space-y-1">
          {THEME_OPTIONS.map((opt) => {
            const selected = pref === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setThemePreference(opt.value);
                  setPref(opt.value);
                }}
                className={`w-full flex items-center justify-between min-h-[44px] px-3 rounded-xl text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  selected
                    ? "bg-[var(--bg-chip)] text-[var(--text-primary)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <span>{opt.label}</span>
                {selected && <Check aria-hidden="true" className="w-4 h-4 text-[var(--accent)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ShareRow() {
  const [status, setStatus] = useState<string | null>(null);

  const share = async () => {
    const url = window.location.origin;
    const data = {
      title: "a1score",
      text: "Live scores, player market values and transfers on a1score.",
      url,
    };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("Link copied");
    } catch (err) {
      // AbortError = the user closed the share sheet; nothing to report.
      if (err instanceof Error && err.name === "AbortError") return;
      setStatus("Couldn't share — copy the link from the address bar");
    }
  };

  return (
    <MenuRow
      icon={Share2}
      label="Share a1score"
      description={status ? <span role="status">{status}</span> : undefined}
      onClick={share}
    />
  );
}

export function SettingsClient({ appVersion }: { appVersion: string }) {
  return (
    <div className="space-y-6">
      <MenuGroup>
        <ThemeSetting />
        <MenuRow
          icon={Bell}
          label="Notifications"
          description="Match, transfer and value alerts"
          href="/settings/notifications"
        />
      </MenuGroup>

      <MenuGroup title="Others">
        <ShareRow />
        <MenuRow
          icon={HelpCircle}
          label="Tips and support"
          description={SUPPORT_EMAIL}
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("a1score support")}`}
        />
        <MenuRow icon={BookOpen} label="How we value players" href="/methodology" />
        <MenuRow icon={ShieldCheck} label="Privacy policy" href="/privacy" />
        <MenuRow icon={FileText} label="Terms of use" href="/terms" />
        <MenuRow
          icon={Mail}
          label="Advertise with us"
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Advertising on a1score")}`}
        />
        <MenuRow icon={Info} label="App version" description={appVersion} />
      </MenuGroup>
    </div>
  );
}
