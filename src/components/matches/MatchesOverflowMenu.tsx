"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, MoreVertical } from "lucide-react";

const ITEM_CLASS =
  "w-full flex items-center justify-between gap-6 min-h-[48px] px-4 text-left text-[15px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:bg-[var(--bg-hover)]";

/** ⋮ menu on the Matches header: view options that FotMob keeps one tap away. */
export function MatchesOverflowMenu({
  byTime,
  onToggleByTime,
  onCollapseAll,
  onExpandAll,
}: {
  byTime: boolean;
  onToggleByTime: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role^="menuitem"]:not([disabled])')?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Arrow keys move between menu items.
  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const run = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Match list options"
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        <MoreVertical aria-hidden="true" className="w-5 h-5" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Match list options"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full mt-1 z-50 min-w-[240px] py-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] shadow-2xl"
        >
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={byTime}
            onClick={run(onToggleByTime)}
            className={ITEM_CLASS}
          >
            <span>By time</span>
            <span
              aria-hidden="true"
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                byTime ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)]" : "border-[var(--text-muted)]"
              }`}
            >
              {byTime && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </span>
          </button>
          <button type="button" role="menuitem" onClick={run(onCollapseAll)} disabled={byTime} className={`${ITEM_CLASS} disabled:opacity-40`}>
            Collapse all leagues
          </button>
          <button type="button" role="menuitem" onClick={run(onExpandAll)} disabled={byTime} className={`${ITEM_CLASS} disabled:opacity-40`}>
            Expand all leagues
          </button>
          <Link href="/settings/notifications" role="menuitem" onClick={() => setOpen(false)} className={ITEM_CLASS}>
            Edit alerts
          </Link>
        </div>
      )}
    </div>
  );
}
