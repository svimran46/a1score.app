"use client";

import { useState } from "react";
import { Share2, Users, X, RefreshCw, Plus, Sparkles, Check } from "lucide-react";
import { FORMATIONS, FormationKey, LineupSlot, calculateLineupMetrics } from "@/lib/lineup/types";
import { useMoney } from "@/lib/useMoney";

interface CandidatePlayer {
  id: string;
  name: string;
  club: string;
  position: string;
  role: "GK" | "DEF" | "MID" | "ATT";
  marketValueEur: number;
  age: number;
}

const CANDIDATE_PLAYERS: CandidatePlayer[] = [
  // Attackers
  { id: "haaland", name: "Erling Haaland", club: "Manchester City", position: "ST", role: "ATT", marketValueEur: 200_000_000, age: 24 },
  { id: "vinicius", name: "Vinícius Júnior", club: "Real Madrid", position: "LW", role: "ATT", marketValueEur: 200_000_000, age: 24 },
  { id: "mbappe", name: "Kylian Mbappé", club: "Real Madrid", position: "ST", role: "ATT", marketValueEur: 180_000_000, age: 25 },
  { id: "yamal", name: "Lamine Yamal", club: "Barcelona", position: "RW", role: "ATT", marketValueEur: 150_000_000, age: 17 },
  { id: "saka", name: "Bukayo Saka", club: "Arsenal", position: "RW", role: "ATT", marketValueEur: 140_000_000, age: 23 },
  { id: "palmer", name: "Cole Palmer", club: "Chelsea", position: "RW", role: "ATT", marketValueEur: 90_000_000, age: 22 },

  // Midfielders
  { id: "bellingham", name: "Jude Bellingham", club: "Real Madrid", position: "CAM", role: "MID", marketValueEur: 180_000_000, age: 21 },
  { id: "rodri", name: "Rodri", club: "Manchester City", position: "CDM", role: "MID", marketValueEur: 130_000_000, age: 28 },
  { id: "musiala", name: "Jamal Musiala", club: "Bayern Munich", position: "CAM", role: "MID", marketValueEur: 130_000_000, age: 21 },
  { id: "wirtz", name: "Florian Wirtz", club: "Bayer Leverkusen", position: "CAM", role: "MID", marketValueEur: 130_000_000, age: 21 },
  { id: "valverde", name: "Federico Valverde", club: "Real Madrid", position: "CM", role: "MID", marketValueEur: 130_000_000, age: 26 },
  { id: "rice", name: "Declan Rice", club: "Arsenal", position: "CDM", role: "MID", marketValueEur: 120_000_000, age: 25 },
  { id: "odegaard", name: "Martin Ødegaard", club: "Arsenal", position: "CAM", role: "MID", marketValueEur: 110_000_000, age: 25 },

  // Defenders
  { id: "saliba", name: "William Saliba", club: "Arsenal", position: "CB", role: "DEF", marketValueEur: 80_000_000, age: 23 },
  { id: "dias", name: "Rúben Dias", club: "Manchester City", position: "CB", role: "DEF", marketValueEur: 80_000_000, age: 27 },
  { id: "gvardiol", name: "Joško Gvardiol", club: "Manchester City", position: "LB", role: "DEF", marketValueEur: 75_000_000, age: 22 },
  { id: "gabriel", name: "Gabriel Magalhães", club: "Arsenal", position: "CB", role: "DEF", marketValueEur: 75_000_000, age: 26 },
  { id: "trent", name: "Trent Alexander-Arnold", club: "Liverpool", position: "RB", role: "DEF", marketValueEur: 70_000_000, age: 26 },
  { id: "davies", name: "Alphonso Davies", club: "Bayern Munich", position: "LB", role: "DEF", marketValueEur: 50_000_000, age: 23 },
  { id: "vandijk", name: "Virgil van Dijk", club: "Liverpool", position: "CB", role: "DEF", marketValueEur: 30_000_000, age: 33 },

  // Goalkeepers
  { id: "raya", name: "David Raya", club: "Arsenal", position: "GK", role: "GK", marketValueEur: 40_000_000, age: 29 },
  { id: "ederson", name: "Ederson", club: "Manchester City", position: "GK", role: "GK", marketValueEur: 35_000_000, age: 31 },
  { id: "alisson", name: "Alisson Becker", club: "Liverpool", position: "GK", role: "GK", marketValueEur: 28_000_000, age: 32 },
  { id: "courtois", name: "Thibaut Courtois", club: "Real Madrid", position: "GK", role: "GK", marketValueEur: 25_000_000, age: 32 },
];

export function LineupBuilderClient() {
  const [formationKey, setFormationKey] = useState<FormationKey>("4-3-3");
  const [slots, setSlots] = useState<LineupSlot[]>(FORMATIONS["4-3-3"].slots);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const { compact } = useMoney();
  const metrics = calculateLineupMetrics(slots);

  const handleFormationChange = (newKey: FormationKey) => {
    setFormationKey(newKey);
    // Keep previously assigned players if matching by slot index
    const templateSlots = FORMATIONS[newKey].slots;
    setSlots(
      templateSlots.map((newSlot, idx) => {
        const old = slots[idx];
        return {
          ...newSlot,
          playerId: old?.playerId,
          playerName: old?.playerName,
          clubName: old?.clubName,
          marketValueEur: old?.marketValueEur,
          age: old?.age,
        };
      })
    );
  };

  const handleSelectPlayer = (player: CandidatePlayer) => {
    if (!activeSlotId) return;
    setSlots((prev) =>
      prev.map((s) =>
        s.id === activeSlotId
          ? {
              ...s,
              playerId: player.id,
              playerName: player.name,
              clubName: player.club,
              marketValueEur: player.marketValueEur,
              age: player.age,
            }
          : s
      )
    );
    setActiveSlotId(null);
    setSearchQuery("");
  };

  const handleRemovePlayer = (slotId: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              playerId: undefined,
              playerName: undefined,
              clubName: undefined,
              marketValueEur: undefined,
              age: undefined,
            }
          : s
      )
    );
  };

  const handleClearAll = () => {
    setSlots(FORMATIONS[formationKey].slots);
  };

  const handleShare = () => {
    const filledNames = slots.filter((s) => s.playerName).map((s) => `${s.position}: ${s.playerName}`);
    const text = `⚽ My a1score Dream XI (${formationKey})\n💰 Squad Value: ${compact(metrics.totalValueEur)}\n\n${filledNames.join("\n")}\n\nBuild yours at https://a1score.app/lineup-builder`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const filteredCandidates = CANDIDATE_PLAYERS.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || p.position.toLowerCase().includes(q);
  });

  const activeSlot = slots.find((s) => s.id === activeSlotId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-surface-card to-surface-card border border-emerald-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Phase 6c Lineup Builder
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Lineup & Squad Builder</h1>
          <p className="text-sm text-text-secondary mt-1">
            Build your ultimate dream XI and track live combined squad market valuation.
          </p>
        </div>

        {/* Squad Valuation Card */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-surface-subtle border border-border-subtle text-center min-w-[120px]">
            <div className="text-xl font-bold text-emerald-400">{compact(metrics.totalValueEur)}</div>
            <div className="text-[11px] font-medium text-text-muted">Total Squad Value</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-surface-subtle border border-border-subtle text-center min-w-[85px]">
            <div className="text-xl font-bold text-text-primary">{metrics.averageAge ? `${metrics.averageAge}y` : "—"}</div>
            <div className="text-[11px] font-medium text-text-muted">Avg Age</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Formations & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-card border border-border-subtle">
        {/* Formation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(Object.keys(FORMATIONS) as FormationKey[]).map((fKey) => (
            <button
              key={fKey}
              onClick={() => handleFormationChange(fKey)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                formationKey === fKey
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "bg-surface-subtle text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              {fKey}
            </button>
          ))}
        </div>

        {/* Share & Reset Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearAll}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-lg transition-colors text-xs flex items-center gap-1.5"
            title="Reset lineup"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-subtle border border-border-subtle text-text-primary hover:bg-surface-elevated flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Share Lineup"}
          </button>
        </div>
      </div>

      {/* The Pitch */}
      <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-emerald-900/40 shadow-2xl bg-[#0e1e17] aspect-[3/4] min-h-[560px] select-none"> {/* color-ignore: Pitch grass surface */}
        {/* Pitch Lines (SVG overlay) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-emerald-500/25" strokeWidth="2" fill="none">
          {/* Outer Boundary */}
          <rect x="16" y="16" width="calc(100% - 32px)" height="calc(100% - 32px)" />
          {/* Halfway Line */}
          <line x1="16" y1="50%" x2="calc(100% - 16px)" y2="50%" />
          {/* Center Circle */}
          <circle cx="50%" cy="50%" r="55" />
          <circle cx="50%" cy="50%" r="3" fill="currentColor" />
          {/* Top Penalty Box */}
          <rect x="22%" y="16" width="56%" height="18%" />
          <rect x="34%" y="16" width="32%" height="7%" />
          {/* Bottom Penalty Box */}
          <rect x="22%" y="calc(100% - 18% - 16px)" width="56%" height="18%" />
          <rect x="34%" y="calc(100% - 7% - 16px)" width="32%" height="7%" />
        </svg>

        {/* Pitch Nodes / Slots */}
        {slots.map((slot) => {
          const isFilled = !!slot.playerName;
          const isSelected = activeSlotId === slot.id;

          return (
            <div
              key={slot.id}
              onClick={() => setActiveSlotId(slot.id)}
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={`absolute cursor-pointer flex flex-col items-center group transition-transform active:scale-95 ${
                isSelected ? "z-20 scale-105" : "z-10"
              }`}
            >
              {/* Node Circle */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shadow-md ${
                  isFilled
                    ? "bg-surface-elevated border-emerald-400 text-emerald-400"
                    : isSelected
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                    : "bg-surface-card/90 border-emerald-500/40 text-text-muted hover:border-emerald-400 hover:text-emerald-300"
                }`}
              >
                {isFilled ? (
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {slot.playerName?.split(" ").slice(-1)[0].slice(0, 3)}
                  </span>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </div>

              {/* Node Tag */}
              <div className="mt-1 flex flex-col items-center max-w-[90px] text-center">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/75 text-text-primary backdrop-blur-sm truncate w-full">
                  {slot.playerName ? slot.playerName.split(" ").slice(-1)[0] : slot.position}
                </span>
                {isFilled && slot.marketValueEur && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-black/75 px-1 rounded mt-0.5">
                    {compact(slot.marketValueEur)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Player Picker Modal / Drawer */}
      {activeSlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface-card border border-border-subtle rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  Select {activeSlot?.position} Player
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Slot role: {activeSlot?.role} ({activeSlot?.position})
                </p>
              </div>
              <button
                onClick={() => setActiveSlotId(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="py-3">
              <input
                type="text"
                placeholder="Search player, club, position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-subtle border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => handleSelectPlayer(candidate)}
                  className="p-3 rounded-xl bg-surface-subtle border border-border-subtle hover:border-emerald-500/50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-sm font-bold text-text-primary">{candidate.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {candidate.club} • {candidate.position} • {candidate.age} yrs
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">
                      {compact(candidate.marketValueEur)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer / Remove Action */}
            {activeSlot?.playerName && (
              <div className="pt-3 border-t border-border-subtle mt-3 flex justify-between">
                <button
                  onClick={() => {
                    handleRemovePlayer(activeSlotId);
                    setActiveSlotId(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Clear Position
                </button>
                <button
                  onClick={() => setActiveSlotId(null)}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
