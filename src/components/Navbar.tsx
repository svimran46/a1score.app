"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Search,
  Trophy,
  Users,
  Shield,
  TrendingUp,
  Menu,
  X,
  Radio,
  BookOpen,
} from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Detect OS for keyboard shortcut indicator
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

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-6 sm:gap-8">
              <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <span className="text-white font-black text-lg tracking-tighter">A1</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-tight text-white flex items-center">
                    a1score<span className="text-brand-400">.app</span>
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 -mt-1 hidden sm:inline">
                    Football Intelligence
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-300">
                <Link
                  href="/matches"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <div className="relative flex items-center justify-center">
                    <Radio className="w-4 h-4 text-rose-400" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  </div>
                  Live Matches
                </Link>
                <Link
                  href="/players"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  Players
                </Link>
                <Link
                  href="/clubs"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  Clubs
                </Link>
                <Link
                  href="/leagues"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Leagues
                </Link>
                <Link
                  href="/methodology"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  Methodology
                </Link>
              </nav>
            </div>

            {/* Header Search & Theme Trigger (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center gap-2 flex-1 max-w-sm justify-end">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-xs shadow-inner group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                  <span>Search players, clubs, leagues...</span>
                </div>
                <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded">
                  {isMac ? "⌘K" : "Ctrl+K"}
                </kbd>
              </button>
              <ThemeToggle />
            </div>

            {/* Mobile Actions */}
            <div className="flex sm:hidden items-center gap-1">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setCommandPaletteOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Search players, clubs, leagues...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 rounded border border-slate-700 text-slate-400">
                Tap
              </kbd>
            </button>

            <div className="flex flex-col space-y-1">
              <Link
                href="/matches"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg text-sm"
              >
                <Radio className="w-4 h-4 text-rose-400" />
                Live Matches
              </Link>
              <Link
                href="/players"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg text-sm"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                Players
              </Link>
              <Link
                href="/clubs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg text-sm"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                Clubs
              </Link>
              <Link
                href="/leagues"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg text-sm"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Leagues
              </Link>
              <Link
                href="/methodology"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg text-sm"
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                Methodology
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}
