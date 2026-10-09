"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatValueEur, spokenEur } from "@/lib/format-value";

export interface ProfileNavSection {
  id: string;
  label: string;
}

interface ProfileSectionNavProps {
  /** Sections the server rendered, in DOM order. Streamed sections add themselves. */
  sections: ProfileNavSection[];
  valueEur: number | null;
}

/** 72px TopNav + 56px (48px bar + 8px air); matches each section's scroll-mt. */
const SPY_TOP = 128;
const BAR_H = 48;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function navHeight(): number {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height"));
  return Number.isFinite(v) ? v : 72;
}

/** Rendered sections inside the profile root, in DOM order (streamed, still-hidden chunks excluded). */
function readSections(root: ParentNode): ProfileNavSection[] {
  return Array.from(root.querySelectorAll<HTMLElement>("section[data-nav-label][id]"))
    .filter((el) => !el.closest("[hidden]"))
    .map((el) => ({ id: el.id, label: el.dataset.navLabel || el.id }));
}

const sameIds = (a: ProfileNavSection[], b: ProfileNavSection[]) =>
  a.length === b.length && a.every((s, i) => s.id === b[i].id && s.label === b[i].label);

function openValuationsIfTargeted() {
  if (window.location.hash !== "#valuations") return;
  const el = document.getElementById("valuations");
  if (el instanceof HTMLDetailsElement && !el.open) {
    el.open = true;
    el.scrollIntoView({ block: "start" });
  }
}

/**
 * Sticky section bar for the one-page profile: plain anchor links (they work
 * without JS), scrollspy via aria-current="location", and a mini value pill
 * once the hero has scrolled away. It never writes the URL on passive scroll.
 */
export function ProfileSectionNav({ sections, valueEur }: ProfileSectionNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLAnchorElement>(null);
  const initialIds = useRef(new Set(sections.map((s) => s.id)));
  const pendingHash = useRef<string | null>(null);
  const userScrolled = useRef(false);

  const [items, setItems] = useState<ProfileNavSection[]>(sections);
  const [active, setActive] = useState<string | null>(null);
  const [pillVisible, setPillVisible] = useState(false);
  const [pillWidth, setPillWidth] = useState(0);
  const [fade, setFade] = useState({ start: false, end: false });

  const value = formatValueEur(valueEur);
  // Presence is decided on the server, so the bar never pops in and shifts the page.
  const enabled = sections.length >= 3;

  // Late (streamed) sections: add their chips in DOM order, and honour a hash that pointed at them.
  useEffect(() => {
    if (!enabled) return;
    const nav = navRef.current;
    const root: ParentNode = nav?.closest("article") ?? document;

    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash && !document.getElementById(hash)) pendingHash.current = hash;
    openValuationsIfTargeted();

    const markScrolled = () => {
      userScrolled.current = true;
    };
    window.addEventListener("wheel", markScrolled, { passive: true, once: true });
    window.addEventListener("touchmove", markScrolled, { passive: true, once: true });
    window.addEventListener("keydown", markScrolled, { once: true });

    const sync = () => {
      const next = readSections(root);
      setItems((prev) => (sameIds(prev, next) ? prev : next));
      const pending = pendingHash.current;
      if (pending) {
        const target = document.getElementById(pending);
        if (target && !target.closest("[hidden]")) {
          pendingHash.current = null;
          if (!userScrolled.current) target.scrollIntoView({ block: "start" });
        }
      }
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root instanceof Document ? root.body : (root as Node), { childList: true, subtree: true });

    window.addEventListener("hashchange", openValuationsIfTargeted);
    return () => {
      mo.disconnect();
      window.removeEventListener("hashchange", openValuationsIfTargeted);
      window.removeEventListener("wheel", markScrolled);
      window.removeEventListener("touchmove", markScrolled);
      window.removeEventListener("keydown", markScrolled);
    };
  }, [enabled]);

  // Scrollspy on the section headings. The band starts under the sticky chrome.
  const idsKey = items.map((s) => s.id).join(",");
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const ids = idsKey.split(",").filter(Boolean);
    const headings = ids
      .map((id) => document.getElementById(id)?.querySelector<HTMLElement>("h2"))
      .filter((h): h is HTMLElement => !!h);
    if (headings.length === 0) return;
    const sectionOf = (h: Element) => h.closest("section")?.id ?? null;
    const visible = new Set<string>();

    const io = new IntersectionObserver(
      (entries) => {
        let leftBelow: string | null = null;
        for (const e of entries) {
          const id = sectionOf(e.target);
          if (!id) continue;
          if (e.isIntersecting) visible.add(id);
          else {
            visible.delete(id);
            // Heading dropped below the band while scrolling up: the previous section is current.
            if (e.boundingClientRect.top > (e.rootBounds?.bottom ?? Infinity)) leftBelow = id;
          }
        }
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
        else if (leftBelow) {
          const i = ids.indexOf(leftBelow);
          setActive((cur) => (cur === leftBelow ? (i > 0 ? ids[i - 1] : null) : cur));
        }
      },
      { rootMargin: `-${SPY_TOP}px 0px -60% 0px` }
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [enabled, idsKey]);

  // Mini value pill: shown once the hero has scrolled under the sticky chrome.
  useEffect(() => {
    if (!enabled || !value || typeof IntersectionObserver === "undefined") return;
    const hero =
      document.getElementById("profile-hero") ?? navRef.current?.closest("article")?.querySelector("header");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([e]) => setPillVisible(!e.isIntersecting && e.boundingClientRect.top < 0),
      { rootMargin: `-${navHeight() + BAR_H}px 0px 0px 0px` }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [enabled, value]);

  // Edge fades on the side that hides chips.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!enabled || !scroller || typeof IntersectionObserver === "undefined") return;
    const links = scroller.querySelectorAll<HTMLElement>("a[data-chip]");
    const firstChip = links[0];
    const lastChip = links[links.length - 1];
    if (!firstChip || !lastChip) return;
    const io = new IntersectionObserver(
      (entries) => {
        setFade((prev) => {
          const next = { ...prev };
          for (const e of entries) {
            const hidden = e.intersectionRatio < 0.99;
            if (e.target === firstChip) next.start = hidden;
            if (e.target === lastChip) next.end = hidden;
          }
          return next.start === prev.start && next.end === prev.end ? prev : next;
        });
      },
      { root: scroller, threshold: [0.99] }
    );
    io.observe(firstChip);
    if (lastChip !== firstChip) io.observe(lastChip);
    return () => io.disconnect();
  }, [enabled, idsKey, pillVisible]);

  useIsoLayoutEffect(() => {
    if (pillRef.current) setPillWidth(pillRef.current.offsetWidth);
  }, [value]);

  // Keep the active chip inside the bar without ever scrolling the page.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!active || !scroller) return;
    const chip = scroller.querySelector<HTMLElement>(`a[data-chip="${CSS.escape(active)}"]`);
    if (!chip) return;
    const s = scroller.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    const pad = 24;
    let delta = 0;
    if (c.left < s.left + pad) delta = c.left - s.left - pad;
    else if (c.right > s.right - pad) delta = c.right - s.right + pad;
    if (delta !== 0) {
      scroller.scrollTo({ left: scroller.scrollLeft + delta, behavior: reducedMotion() ? "auto" : "smooth" });
    }
  }, [active]);

  const onChipClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const section = document.getElementById(id);
    if (!section) return;
    e.preventDefault();
    window.history.replaceState(window.history.state, "", `#${id}`);
    section.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
    section.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    setActive(id);
  }, []);

  const onPillClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const top = document.getElementById("top");
    if (!top) return;
    e.preventDefault();
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    top.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
    const h1 = document.getElementById("player-name");
    if (h1) {
      if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
    }
    setActive(null);
  }, []);

  if (!enabled) return null;

  const mask =
    fade.start && fade.end
      ? "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)"
      : fade.start
        ? "linear-gradient(to right, transparent, black 24px)"
        : fade.end
          ? "linear-gradient(to right, black calc(100% - 24px), transparent)"
          : undefined;

  const shift = pillVisible && value ? pillWidth + 4 : 0;

  return (
    <nav
      ref={navRef}
      aria-label="Profile sections"
      className="sticky top-[var(--nav-height)] z-30 -mx-4 h-12 border-b border-divider/60 bg-bg-page/95 px-4 backdrop-blur-sm lg:mx-0 lg:px-0"
    >
      <div className="relative h-full">
        {value && valueEur != null ? (
          <a
            ref={pillRef}
            href="#top"
            onClick={onPillClick}
            aria-label={`Back to top, market value ${spokenEur(valueEur)}`}
            aria-hidden={pillVisible ? undefined : true}
            tabIndex={pillVisible ? undefined : -1}
            className={`group absolute left-0 top-0 z-10 flex h-12 min-w-11 items-center rounded-full transition-[opacity,transform] duration-[160ms] ease-[var(--ease-out)] focus-visible:outline-none ${
              pillVisible ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-1 opacity-0"
            }`}
          >
            <span className="figure inline-flex h-8 items-center rounded-full border border-divider/60 bg-bg-card px-2.5 text-[15px] font-extrabold leading-none text-value-text group-focus-visible:ring-2 group-focus-visible:ring-[var(--focus-ring)]">
              {value}
            </span>
          </a>
        ) : null}
        <div
          ref={scrollerRef}
          className="no-scrollbar h-full overflow-x-auto overflow-y-hidden overscroll-x-contain"
          style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
        >
          <ul
            className="flex h-full w-max items-center gap-1 transition-transform duration-[160ms] ease-[var(--ease-out)]"
            style={shift ? { transform: `translateX(${shift}px)` } : undefined}
          >
            {items.map((s) => {
              const isActive = s.id === active;
              const isLate = !initialIds.current.has(s.id);
              return (
                <li key={s.id} className={isLate ? "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-[160ms]" : undefined}>
                  <a
                    href={`#${s.id}`}
                    data-chip={s.id}
                    aria-current={isActive ? "location" : undefined}
                    onClick={(e) => onChipClick(e, s.id)}
                    className={`inline-flex h-11 items-center whitespace-nowrap rounded-full px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] ${
                      isActive
                        ? "bg-bg-chip font-semibold text-text-primary"
                        : "font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`}
                  >
                    {/* The bold copy reserves width so the weight change never shifts the row */}
                    <span className="grid">
                      <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-semibold">
                        {s.label}
                      </span>
                      <span className="col-start-1 row-start-1">{s.label}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
