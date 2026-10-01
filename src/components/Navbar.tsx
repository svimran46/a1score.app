"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import {
  Home,
  Radio,
  Users,
  Shield,
  Trophy,
  TrendingUp,
  ArrowLeftRight,
  BookOpen,
  Search,
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavCategory {
  name: string;
  shortName: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isLiveMatches?: boolean;
  isActive: (pathname: string, filter: string | null) => boolean;
}

export const CATEGORIES: NavCategory[] = [
  {
    name: "Matches",
    shortName: "Matches",
    href: "/matches",
    icon: Radio,
    isLiveMatches: true,
    isActive: (p) => p === "/matches" || p.startsWith("/matches/") || p.startsWith("/match/"),
  },
  {
    name: "Players",
    shortName: "Players",
    href: "/players",
    icon: Users,
    isActive: (p) => p === "/players" || p.startsWith("/players/") || p.startsWith("/player/"),
  },
  {
    name: "Clubs",
    shortName: "Clubs",
    href: "/clubs",
    icon: Shield,
    isActive: (p) => p === "/clubs" || p.startsWith("/clubs/") || p.startsWith("/club/"),
  },
  {
    name: "Leagues",
    shortName: "Leagues",
    href: "/leagues",
    icon: Trophy,
    isActive: (p) => p === "/leagues" || p.startsWith("/leagues/") || p.startsWith("/league/"),
  },
  {
    name: "Market Values",
    shortName: "Values",
    href: "/values",
    icon: TrendingUp,
    isActive: (p, f) => p === "/values" || (p === "/search" && f === "valuable"),
  },
  {
    name: "Transfers",
    shortName: "Transfers",
    href: "/transfers",
    icon: ArrowLeftRight,
    isActive: (p) => p === "/transfers" || p.startsWith("/transfers/") || p.startsWith("/transfer"),
  },
];

export const DRAWER_ITEMS: Array<{
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isLiveMatches?: boolean;
  isActive: (pathname: string, filter: string | null) => boolean;
}> = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    isActive: (p) => p === "/",
  },
  {
    name: "Live Matches",
    href: "/matches",
    icon: Radio,
    isLiveMatches: true,
    isActive: (p) => p === "/matches" || p.startsWith("/matches/") || p.startsWith("/match/"),
  },
  {
    name: "Players",
    href: "/players",
    icon: Users,
    isActive: (p) => p === "/players" || p.startsWith("/players/") || p.startsWith("/player/"),
  },
  {
    name: "Clubs",
    href: "/clubs",
    icon: Shield,
    isActive: (p) => p === "/clubs" || p.startsWith("/clubs/") || p.startsWith("/club/"),
  },
  {
    name: "Leagues",
    href: "/leagues",
    icon: Trophy,
    isActive: (p) => p === "/leagues" || p.startsWith("/leagues/") || p.startsWith("/league/"),
  },
  {
    name: "Market Values",
    href: "/values",
    icon: TrendingUp,
    isActive: (p, f) => p === "/values" || (p === "/search" && f === "valuable"),
  },
  {
    name: "Transfers",
    href: "/transfers",
    icon: ArrowLeftRight,
    isActive: (p) => p === "/transfers" || p.startsWith("/transfers/") || p.startsWith("/transfer"),
  },
  {
    name: "Methodology",
    href: "/methodology",
    icon: BookOpen,
    isActive: (p) => p === "/methodology" || p.startsWith("/methodology/"),
  },
];

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [liveCount, setLiveCount] = useState<number | null>(null);

  // Top bar scroll auto-hide & border state
  const [showTopBar, setShowTopBar] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollYRef = useRef(0);

  // Mobile virtual keyboard detection (to hide bottom tab bar while keyboard is open)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Drawer accessibility & gesture refs
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Fetch live matches count on mount and every 30s
  useEffect(() => {
    let isMounted = true;
    const fetchLiveCount = async () => {
      try {
        const res = await fetch("/api/matches?filter=live", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.liveMatchesCount === "number") {
            setLiveCount(data.liveMatchesCount);
          }
        }
      } catch {
        // Fallback gracefully on network error
      }
    };

    fetchLiveCount();
    const interval = setInterval(fetchLiveCount, 30_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Detect OS for shortcut indicator
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
    }
  }, []);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scroll listener for Top Bar (auto-hide on scroll-down, show on scroll-up, 1px bottom border on scroll)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollYRef.current;

      setIsScrolled(currentScrollY > 10);

      if (currentScrollY <= 20) {
        setShowTopBar(true);
      } else if (deltaY > 6 && currentScrollY > 56) {
        // Scrolling down -> hide top bar
        setShowTopBar(false);
      } else if (deltaY < -6) {
        // Scrolling up -> show top bar
        setShowTopBar(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mobile virtual keyboard detection via visualViewport and input focus
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (window.visualViewport) {
        // If viewport is shorter than 80% of screen height, virtual keyboard is active
        setIsKeyboardOpen(window.visualViewport.height < window.innerHeight * 0.8);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname, searchParams]);

  // Drawer keyboard & focus trap management
  useEffect(() => {
    if (!drawerOpen) return;

    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setDrawerOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Drawer touch swipe-right to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    if (deltaX > 50 && Math.abs(deltaY) < 60) {
      setDrawerOpen(false);
      menuButtonRef.current?.focus();
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Determine active state for mobile bottom tab bar items
  const isHomeActive = pathname === "/";
  const isMatchesActive = pathname === "/matches" || pathname.startsWith("/match/");
  const isPlayersActive = pathname === "/players" || pathname.startsWith("/player/");
  const isClubsActive = pathname === "/clubs" || pathname.startsWith("/club/");
  const isMoreActive =
    drawerOpen ||
    pathname === "/leagues" ||
    pathname.startsWith("/league/") ||
    (pathname === "/search" && filterParam === "valuable") ||
    pathname === "/transfers" ||
    pathname.startsWith("/transfer") ||
    pathname === "/methodology";

  return (
    <>
      {/* 
        TOP BAR (56px mobile / 64px desktop / 80px TV)
        Sticky with backdrop blur and 1px bottom border on scroll.
        Auto-hide on scroll-down, show on scroll-up.
      */}
      <header
        className={`sticky top-0 z-40 w-full bg-[var(--color-bg)]/90 backdrop-blur-xl transition-all duration-300 ease-in-out ${
          isScrolled ? "border-b border-[var(--color-border)] shadow-sm" : "border-b border-transparent"
        } ${
          showTopBar || drawerOpen || commandPaletteOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 2xl:h-20 gap-2 sm:gap-4">
            {/* Left: Logo (A1 mark + wordmark, links to /) - Separate Home button removed */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2 group flex-shrink-0 min-h-[44px] py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-xl"
                aria-label="a1score.app home"
              >
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--color-accent)" }}
                >
                  <span className="text-[#0B0F17] font-black text-base sm:text-lg tracking-tighter">
                    A1
                  </span>
                </div>
                <div className="flex flex-col md:hidden lg:flex">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-[var(--color-text)] flex items-center leading-tight">
                    a1score<span className="text-[var(--color-accent)]">.app</span>
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop & Tablet Navigation (>=1024px: icon + label | 768-1023px: icon + short label) */}
            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-0.5 lg:gap-1 text-xs lg:text-sm font-medium text-slate-300"
            >
              {CATEGORIES.map((cat) => {
                const active = cat.isActive(pathname, filterParam);
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className={`flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      active
                        ? "text-amber-400 bg-amber-500/10 border border-amber-500/30 font-semibold shadow-sm shadow-amber-500/10"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <div className="relative flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      {cat.isLiveMatches && liveCount !== null && liveCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: "var(--color-positive)" }} />
                      )}
                    </div>
                    {/* Full label on >=1024px, short label on 768-1023px */}
                    <span className="hidden lg:inline">{cat.name}</span>
                    <span className="lg:hidden">{cat.shortName}</span>
                    {/* Live count badge */}
                    {cat.isLiveMatches && liveCount !== null && liveCount > 0 && (
                      <span className="ml-0.5 lg:ml-1 inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "var(--color-positive)", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                        {liveCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Search + Theme Toggle + Menu Button */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Desktop Command Palette Trigger (>=1024px) */}
              <button
                type="button"
                data-search-trigger="desktop"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden lg:flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all text-xs shadow-inner min-h-[44px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Search players, clubs, leagues"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                  <span className="text-slate-400">Search database...</span>
                </div>
                <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-xs">
                  {isMac ? "⌘K" : "Ctrl+K"}
                </kbd>
              </button>

              {/* Tablet & Mobile Search Icon Button (<1024px) */}
              <button
                type="button"
                data-search-trigger="compact"
                onClick={() => setCommandPaletteOpen(true)}
                className="lg:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                aria-label="Search players, clubs, leagues"
                title="Search (Ctrl+K)"
              >
                <Search className="w-5 h-5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors" />
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Hamburger Menu Button (Drawer trigger, visible on tablet 768-1279px; mobile uses bottom More tab) */}
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="hidden md:flex xl:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                aria-controls="navigation-drawer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 
        FIXED BOTTOM TAB BAR (mobile < 768px)
        5 items: Home, Matches (live-count badge), Players, Clubs, More (opens drawer).
        56px + safe-area inset, blurred background, active tab in accent colour.
        Hidden while the keyboard is open.
      */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className={`fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--color-surface)]/95 border-t border-[var(--color-border)] backdrop-blur-xl transition-transform duration-200 ${
          isKeyboardOpen ? "translate-y-full pointer-events-none" : "translate-y-0"
        }`}
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="grid grid-cols-5 h-14 items-center">
          {/* 1. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center min-h-[44px] h-full py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
              isHomeActive
                ? "text-[var(--color-accent)] font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
            aria-label="Home"
          >
            <Home className="w-5 h-5" />
            <span className="tracking-tight mt-0.5">Home</span>
          </Link>

          {/* 2. Matches (live-count badge) */}
          <Link
            href="/matches"
            className={`flex flex-col items-center justify-center min-h-[44px] h-full py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
              isMatchesActive
                ? "text-[var(--color-accent)] font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
            aria-label="Matches"
          >
            <div className="relative flex items-center justify-center">
              <Radio className="w-5 h-5" />
              {liveCount !== null && liveCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none" style={{ backgroundColor: "var(--color-positive)" }}>
                  {liveCount}
                </span>
              )}
            </div>
            <span className="tracking-tight mt-0.5">Matches</span>
          </Link>

          {/* 3. Players */}
          <Link
            href="/players"
            className={`flex flex-col items-center justify-center min-h-[44px] h-full py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
              isPlayersActive
                ? "text-[var(--color-accent)] font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
            aria-label="Players"
          >
            <Users className="w-5 h-5" />
            <span className="tracking-tight mt-0.5">Players</span>
          </Link>

          {/* 4. Clubs */}
          <Link
            href="/clubs"
            className={`flex flex-col items-center justify-center min-h-[44px] h-full py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
              isClubsActive
                ? "text-[var(--color-accent)] font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
            aria-label="Clubs"
          >
            <Shield className="w-5 h-5" />
            <span className="tracking-tight mt-0.5">Clubs</span>
          </Link>

          {/* 5. More (opens drawer with Leagues, Values, Transfers, Methodology) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[44px] h-full py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
              isMoreActive
                ? "text-[var(--color-accent)] font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
            aria-label="More navigation options"
            aria-expanded={drawerOpen}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="tracking-tight mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* TV Left Rail (>=1920px: 72px icon rail expanding to 240px on focus/hover) */}
      <aside
        aria-label="TV Quick Navigation"
        className="hidden [@media(min-width:1920px)]:flex fixed top-20 left-0 bottom-0 w-[72px] hover:w-[240px] focus-within:w-[240px] z-30 bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl transition-[width] duration-200 overflow-hidden flex-col py-4 group shadow-2xl"
      >
        <div className="flex flex-col space-y-1.5 px-2">
          {DRAWER_ITEMS.map((item) => {
            const active = item.isActive(pathname, filterParam);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                className={`h-12 px-3.5 rounded-xl flex items-center gap-4 whitespace-nowrap font-medium text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:scale-105 ${
                  active
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0 relative">
                  <Icon className="w-5 h-5 text-slate-300 group-hover:text-amber-400 group-focus-within:text-amber-400 transition-colors" />
                  {item.isLiveMatches && liveCount !== null && liveCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: "var(--color-positive)" }} />
                  )}
                </div>
                <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 text-slate-200">
                  {item.name}
                </span>
                {item.isLiveMatches && liveCount !== null && liveCount > 0 && (
                  <span className="ml-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "var(--color-positive)", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                    {liveCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Slim Sidebar / Drawer Backdrop (<1280px) */}
      {drawerOpen && (
        <div
          onClick={() => {
            setDrawerOpen(false);
            menuButtonRef.current?.focus();
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Slim Sidebar / Drawer (<1280px, max 280px, items only, no extra text) */}
      <div
        id="navigation-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        aria-hidden={!drawerOpen}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 bottom-0 right-0 z-50 w-[min(280px,80vw)] max-w-[280px] bg-slate-950 border-l border-slate-800/90 shadow-2xl flex flex-col transform transition-transform duration-200 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drawer Header: Title + Close Button (48px height) */}
        <div className="h-12 px-4 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
          <span className="text-[13px] font-medium text-slate-400">
            Menu
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              menuButtonRef.current?.focus();
            }}
            className="min-h-[44px] min-w-[44px] -mr-2 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content: Navigation items only, exactly 48px row height */}
        <nav
          aria-label="Drawer Navigation"
          className="flex-1 overflow-y-auto py-2 divide-y divide-transparent"
        >
          {DRAWER_ITEMS.map((item) => {
            const active = item.isActive(pathname, filterParam);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`h-12 px-4 flex items-center justify-between text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  active
                    ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-400 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-900 border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.isLiveMatches && liveCount !== null && liveCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "var(--color-positive)", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                    {liveCount} Live
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer: Appearance Toggle ONLY */}
        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between flex-shrink-0 bg-slate-950/60">
          <span className="text-xs text-slate-400 font-medium">Appearance</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}

export function Navbar() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl h-14 sm:h-16 2xl:h-20" />
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
