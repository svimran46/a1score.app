import { ShieldCheck, Database, Zap, RefreshCw, BarChart3, TrendingUp, Layers } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 86400; // 24h ISR
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Data Methodology & Architecture | a1score.app",
  description:
    "Explore how a1score.app powers 'Money meets the pitch' through our dual data architecture: Transfermarkt market valuation intelligence and FotMob live match feeds.",
};

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-4">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          Editorial Transparency & Integrity
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          How A1Score Operates
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          &ldquo;Money meets the pitch.&rdquo; Most football platforms present either live scores or financial valuations in isolation. A1Score synthesizes both into a unified intelligence engine.
        </p>
      </div>

      {/* Core Dual Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source 1: Transfermarkt */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Financial & Valuation Layer
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Transfermarkt Intelligence
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Market values, career valuation trajectories, historical transfers, contract durations, and club squad values are sourced directly from curated Transfermarkt data feeds and real-time edge scrapers.
          </p>
          <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Valuation Model:</strong> Community consensus, scout evaluations, age curve analysis, contract tenure, and competitive transfer market demand.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Career Trajectory:</strong> Historical valuation snapshots tracing a player&apos;s growth from youth academy to peak market value.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Fee Categorization:</strong> Explicit separation between free transfers, undisclosed fees, and verified multi-million euro transactions.</span>
            </li>
          </ul>
        </div>

        {/* Source 2: FotMob API */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Pitch & Match Center Layer
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              FotMob Match Intelligence
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Live fixtures, in-play scores, confirmed tactical lineups with pitch formations, real-time match events, official league tables, and player tournament performance are powered by edge-authenticated FotMob protocols.
          </p>
          <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>5-Second Silent Refresh:</strong> Live scores and match clocks synchronize silently in the background, pausing when tabs are hidden to conserve battery and bandwidth.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Official League Tables:</strong> Standings reflect exact active top-flight member clubs (e.g. 20 Premier League, 20 LaLiga, 18 Bundesliga).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>No Third-Party Paywall Proxies:</strong> Zero reliance on restrictive quota APIs like API-Football.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Data Refresh Lifecycle */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Cache Protocols & Refresh Rates
            </h3>
            <p className="text-xs text-slate-400">
              How Cloudflare Pages Edge Workers deliver sub-50ms latency across global edge points
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-emerald-400 font-bold text-sm">5 Seconds</span>
            <h4 className="text-white font-semibold">Live Match Intelligence</h4>
            <p className="text-slate-400">
              Scores, minute counters, timeline cards, goals, and confirmed tactical lineups.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-amber-400 font-bold text-sm">5 Minutes</span>
            <h4 className="text-white font-semibold">Official League Standings</h4>
            <p className="text-slate-400">
              League points, goal differentials, and tournament qualification indicators.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-blue-400 font-bold text-sm">1 Hour (ISR)</span>
            <h4 className="text-white font-semibold">Valuations & Player Profiles</h4>
            <p className="text-slate-400">
              Market value curve graphs, transfer ledgers, career statistics, and bio details.
            </p>
          </div>
        </div>
      </div>

      {/* Zero Fabricated Data Statement */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/30 bg-emerald-950/10 space-y-3">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          The Zero Fabricated Data Commitment
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Every statistic, transfer fee, lineup position, and market value displayed on A1Score is grounded in real, verifiable football feeds. When a fee is not officially disclosed by clubs, we transparently mark it as &ldquo;Undisclosed&rdquo; rather than fabricating an estimate. When an academy player transitions through youth ranks, we explicitly flag the move as an internal promotion rather than blending it with senior market transfers.
        </p>
      </div>
    </div>
  );
}
