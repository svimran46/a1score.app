"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trophy, Users, Shield, TrendingUp, Menu, X } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg tracking-tighter">A1</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white flex items-center">
                  a1score<span className="text-brand-400">.app</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 -mt-1">
                  Football Intelligence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
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
                href="/search?filter=valuable"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Market Values
              </Link>
            </nav>
          </div>

          {/* Search bar */}
          <div className="hidden sm:flex items-center flex-1 max-w-xs ml-4">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder="Search player, club, league..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 text-sm text-slate-200 placeholder-slate-500 rounded-full pl-9 pr-4 py-1.5 border border-slate-700/60 focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/80 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </form>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
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
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search player, club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-sm text-slate-200 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2 border border-slate-700/60 focus:outline-none focus:border-brand-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>
          <div className="flex flex-col space-y-1">
            <Link
              href="/players"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              Players
            </Link>
            <Link
              href="/clubs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg"
            >
              <Shield className="w-4 h-4 text-blue-400" />
              Clubs
            </Link>
            <Link
              href="/leagues"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Leagues
            </Link>
            <Link
              href="/search?filter=valuable"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg"
            >
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Market Values
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
