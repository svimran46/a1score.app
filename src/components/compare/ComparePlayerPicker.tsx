"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, X, Loader2, User } from "lucide-react";
import { EntityImage } from "@/components/EntityImage";
import { formatCompactEur } from "@/lib/utils";
import { getPlayerSlug } from "@/lib/slugs";

interface SearchPlayerResult {
  id: string;
  fullName: string;
  commonName?: string | null;
  photoUrl?: string | null;
  position?: string;
  latestMarketValue?: number;
  currentClub?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
}

interface ComparePlayerPickerProps {
  currentSlugs: string[];
  onAddPlayer: (slug: string) => void;
  maxPlayers?: number;
}

export function ComparePlayerPicker({
  currentSlugs,
  onAddPlayer,
  maxPlayers = 3,
}: ComparePlayerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPlayerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = currentSlugs.length < maxPlayers;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(query.trim())}&limit=8`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setResults(json.data);
          }
        }
      } catch (err) {
        console.warn("Player search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (player: SearchPlayerResult) => {
    const slug = getPlayerSlug(player);
    onAddPlayer(slug);
    setIsOpen(false);
    setQuery("");
  };

  if (!canAddMore) return null;

  return (
    <div className="relative">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-[var(--value-text)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-xs sm:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] shadow-xs"
        >
          <Plus className="w-4 h-4 text-[var(--value-text)]" />
          <span>Add Player to Compare ({currentSlugs.length}/{maxPlayers})</span>
        </button>
      ) : (
        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg space-y-3 max-w-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--divider)]">
            <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              Search Player to Compare
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by player name (e.g. Haaland, Saka, Bellingham)..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 text-[var(--text-muted)] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="max-h-60 overflow-y-auto divide-y divide-[var(--divider)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              {results.map((player) => {
                const slug = getPlayerSlug(player);
                const isAlreadySelected = currentSlugs.some(
                  (s) => s.toLowerCase() === slug.toLowerCase() || s.includes(player.id)
                );

                return (
                  <button
                    key={player.id}
                    type="button"
                    disabled={isAlreadySelected}
                    onClick={() => handleSelect(player)}
                    className={`w-full p-2.5 flex items-center justify-between gap-3 text-left transition-colors ${
                      isAlreadySelected
                        ? "opacity-40 cursor-not-allowed bg-[var(--bg-page)]"
                        : "hover:bg-[var(--bg-hover)] cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-chip)] overflow-hidden shrink-0 relative flex items-center justify-center">
                        <EntityImage
                          src={player.photoUrl}
                          alt={player.fullName}
                          width={32}
                          height={32}
                          entityType="player"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {player.fullName}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {player.currentClub?.name || "Player"} • {player.position || "Forward"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isAlreadySelected ? (
                        <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                          Added
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-bold text-[var(--value-text)] figure tabular-nums">
                          {player.latestMarketValue ? formatCompactEur(player.latestMarketValue) : "—"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {query.trim().length > 1 && !isLoading && results.length === 0 && (
            <p className="text-center py-4 text-xs text-[var(--text-muted)]">
              No matching players found for &quot;{query}&quot;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
