"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const ITEM_CLASS =
  "w-full flex items-center justify-between gap-6 min-h-[48px] px-4 text-left text-[15px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:bg-[var(--bg-hover)] disabled:opacity-40";
const FOCUSABLE = '[role^="menuitem"]:not([disabled])';

const CloseContext = createContext<() => void>(() => {});

/**
 * A button that opens a menu (role="menu"). Closes on outside tap, Escape
 * (focus returns to the button) or choosing an item; arrow keys move between
 * items. Use the Menu* items below as children.
 */
export function MenuButton({
  label,
  ariaLabel,
  buttonClassName,
  align = "right",
  children,
}: {
  label: React.ReactNode;
  ariaLabel: string;
  buttonClassName: string;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
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

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={buttonClassName}
      >
        {label}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={ariaLabel}
          onKeyDown={onMenuKeyDown}
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-1 z-50 min-w-[240px] max-h-[70vh] overflow-y-auto py-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] shadow-2xl`}
        >
          <CloseContext.Provider value={() => setOpen(false)}>{children}</CloseContext.Provider>
        </div>
      )}
    </div>
  );
}

/** A small heading that groups the items below it. */
export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div role="presentation" className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
      {children}
    </div>
  );
}

export function MenuItem({
  onSelect,
  disabled,
  children,
}: {
  onSelect: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const close = useContext(CloseContext);
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onSelect();
        close();
      }}
      className={ITEM_CLASS}
    >
      {children}
    </button>
  );
}

export function MenuLinkItem({ href, children }: { href: string; children: React.ReactNode }) {
  const close = useContext(CloseContext);
  return (
    <Link href={href} role="menuitem" onClick={close} className={ITEM_CLASS}>
      {children}
    </Link>
  );
}

/** One choice in a single-select group. The menu stays open so related choices can be made together. */
export function MenuRadioItem({
  checked,
  onSelect,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" role="menuitemradio" aria-checked={checked} onClick={onSelect} className={ITEM_CLASS}>
      <span>{children}</span>
      {checked && <Check aria-hidden="true" className="w-4 h-4 shrink-0 text-[var(--accent)]" />}
    </button>
  );
}

export function MenuCheckboxItem({
  checked,
  onToggle,
  closeOnSelect = false,
  disabled,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  closeOnSelect?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const close = useContext(CloseContext);
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        onToggle();
        if (closeOnSelect) close();
      }}
      className={ITEM_CLASS}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center ${
          checked ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)]" : "border-[var(--text-muted)]"
        }`}
      >
        {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}
