"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { EntityImage } from "./EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getClubDisplayName } from "@/lib/data/clubs";
import { getPlayerSlug } from "@/lib/slugs";
import { trackEvent } from "@/lib/analytics";
import {
  Search,
  X,
  User,
  Shield,
  Trophy,
  ArrowRight,
  TrendingUp,
  Radio,
  Newspaper,
} from "lucide-react";

interface SearchResultPlayer {
  id: string;
  fullName: string;
  commonName?: string | null;
  position: string;
  photoUrl?: string | null;
  latestMarketValue?: number | null;
  sourceId?: string | null;
  externalId?: string | null;
  slug?: string | null;
  currentClub?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
}

const QUICK_LEAGUES = [
  { name: "Premier League", id: "cmuihndux0003b23fizizm4a0", code: "GB1", country: "England" },
  { name: "LaLiga", id: "cmuihncv70001b23frvqgzdp6", code: "ES1", country: "Spain" },
  { name: "Serie A", id: "cmuihnegb0004b23fhslrse6b", code: "IT1", country: "Italy" },
  { name: "Bundesliga", id: "cmuihneym0005b23fkpqbo0uj", code: "L1", country: "Germany" },
  { name: "Ligue 1", id: "cmuihnddf0002b23fskdzdx29", code: "FR1", country: "France" },
  { name: "Champions League", id: "cmuihncd80000b23f6khust90", code: "CL", country: "Europe" },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<SearchResultPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setPlayers([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle global Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setPlayers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const json = await res.json();
          const playerList = Array.isArray(json)
            ? json
            : Array.isArray(json?.data)
            ? json.data
            : [];
          setPlayers(playerList.slice(0, 6));
        }
      } catch {
        // Fallback gracefully on search error
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter local leagues based on search query
  const matchingLeagues = query.trim()
    ? QUICK_LEAGUES.filter(
        (l) =>
          l.name.toLowerCase().includes(query.toLowerCase()) ||
          l.country.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const totalResults = players.length + matchingLeagues.length;

  const navigateTo = (path: string) => {
    trackEvent("search used");
    onClose();
    router.push(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      navigateTo(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Database quick search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-[var(--card-radius)] bg-[var(--bg-card)] border border-[var(--divider)] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--divider)] gap-3">
          <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search players, clubs, competitions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search players, clubs, competitions"
            className="w-full bg-transparent text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--bg-chip)] rounded-[var(--chip-radius)] border border-[var(--divider)]">
              ESC
            </kbd>
          )}
        </div>

        {/* Results / Suggestions Container */}
        <div className="overflow-y-auto p-3 space-y-4 divide-y divide-[var(--divider)]">
          {/* Empty query state: Quick Links */}
          {!query.trim() && (
            <div className="space-y-3 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 block">
                Quick Navigation
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => navigateTo("/matches")}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-left text-xs text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <Radio className="w-4 h-4 text-[var(--live)]" />
                  <span className="font-semibold">Live Matches</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo("/values")}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-left text-xs text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <TrendingUp className="w-4 h-4 text-[var(--value-text)]" />
                  <span className="font-semibold">Top Valuations</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo("/leagues")}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-left text-xs text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <Trophy className="w-4 h-4 text-[var(--accent)]" />
                  <span className="font-semibold">All Leagues</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo("/news")}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-left text-xs text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <Newspaper className="w-4 h-4 text-[var(--accent)]" />
                  <span className="font-semibold">Football News</span>
                </button>
              </div>

              {/* Top Leagues */}
              <div className="pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 block mb-2">
                  Featured Leagues
                </span>
                <div className="space-y-1">
                  {QUICK_LEAGUES.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => navigateTo(`/leagues/${l.id}`)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-hover)] text-xs text-[var(--text-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Trophy className="w-4 h-4 text-[var(--accent)]" />
                        <span className="font-semibold text-[var(--text-primary)]">{l.name}</span>
                        <span className="text-[var(--text-muted)]">• {l.country}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              Searching players, clubs and leagues...
            </div>
          )}

          {/* Players Results */}
          {!isLoading && players.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 block mb-1">
                Players ({players.length})
              </span>
              {players.map((p) => {
                const extId = p.sourceId || p.externalId || p.id;
                const slug = p.slug || getPlayerSlug({ ...p, transfermarktId: extId });
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigateTo(`/players/${slug}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-8 h-8 rounded-lg bg-[var(--bg-chip)] overflow-hidden shrink-0 flex items-center justify-center">
                        <EntityImage
                          src={p.photoUrl}
                          alt={p.fullName}
                          fill
                          sizes="32px"
                          entityType="player"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text-primary)] text-xs truncate group-hover:text-[var(--accent)] transition-colors">
                          {p.commonName || p.fullName}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-1.5">
                          <span>{p.position}</span>
                          {p.currentClub?.name && (
                            <>
                              <span>•</span>
                              <span title={p.currentClub.name}>{getClubDisplayName(p.currentClub.name)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      {p.latestMarketValue ? (
                        <span className="text-xs font-bold text-[var(--value-text)] figure tabular-nums">
                          {formatCompactEur(p.latestMarketValue)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">—</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Competitions Results */}
          {!isLoading && matchingLeagues.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 block mb-1">
                Competitions
              </span>
              {matchingLeagues.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => navigateTo(`/leagues/${l.id}`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-[var(--accent)]" />
                    <span className="font-semibold text-[var(--text-primary)] text-xs">{l.name}</span>
                    <span className="text-[var(--text-muted)] text-xs">• {l.country}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && query.trim() && totalResults === 0 && (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-[var(--text-muted)]">No results found for &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                onClick={() => navigateTo(`/search?q=${encodeURIComponent(query.trim())}`)}
                className="text-xs font-semibold text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded px-1"
              >
                Perform full search across database →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {query.trim() && (
          <div className="p-3 bg-bg-page/80 border-t border-[var(--divider)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Press Enter to view all results</span>
            <button
              type="button"
              onClick={() => navigateTo(`/search?q=${encodeURIComponent(query.trim())}`)}
              className="text-[var(--accent)] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded px-1"
            >
              See all results →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
