import { ShieldCheck, Database, Zap, RefreshCw, BarChart3, TrendingUp, Layers } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 86400; // 24h ISR
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Data Methodology & Architecture",
  description:
    "Explore how a1score.app powers 'Money meets the pitch' through our unified data architecture: market valuation modelling, squad analytics, and real-time match operations.",
};

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 py-2 sm:py-4">
      {/* Header */}
      <div className="space-y-3 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold whitespace-nowrap">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Editorial Transparency & Integrity
        </div>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight [text-wrap:balance]">
          How A1Score Operates
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl [text-wrap:balance]">
          &ldquo;Money meets the pitch.&rdquo; Most football platforms present either live scores or financial valuations in isolation. A1Score synthesizes both into a unified intelligence engine.
        </p>
      </div>

      {/* Core Dual Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Layer 1: Valuation Intelligence */}
        <div className="rounded-3xl glass-panel p-4 sm:p-8 border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Financial & Valuation Layer
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1 [text-wrap:balance]">
              Valuation Intelligence
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Market values, career valuation trajectories, historical transfers, contract durations, and club squad values are maintained through our automated data ingestion, multi-point verification, and valuation modelling pipeline. Values refresh continuously across major transfer windows and active competitive seasons.
          </p>
          <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">•</span>
              <span><strong>Valuation Modelling:</strong> Quantitative analysis combining age curve models, position-specific value baselines, contract tenure, and competitive transfer market demand.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">•</span>
              <span><strong>Career Trajectory:</strong> Longitudinal valuation points charting a player&apos;s development from initial professional registration to career peak.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">•</span>
              <span><strong>Commercial Ledger:</strong> Systematic accounting separating free moves, loan agreements, and multi-million euro transactions without ambiguity.</span>
            </li>
          </ul>
        </div>

        {/* Layer 2: Match Intelligence */}
        <div className="rounded-3xl glass-panel p-4 sm:p-8 border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Pitch & Match Center Layer
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1 [text-wrap:balance]">
              Match Intelligence
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Live fixtures, in-play scores, confirmed tactical lineups with pitch formations, real-time match events, domestic league tables, and player tournament performance are processed through our low-latency edge synchronisation layer.
          </p>
          <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">•</span>
              <span><strong>Edge Synchronization:</strong> Live scores and match clocks synchronize efficiently with shared edge caching, preventing redundant upstream calls and conserving bandwidth.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">•</span>
              <span><strong>Active League Rosters:</strong> Standings and club allocations strictly reflect active season memberships (e.g. 20 Premier League, 20 LaLiga, 18 Bundesliga).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">•</span>
              <span><strong>Disciplinary Reconciliation:</strong> Clear distinction between aggregate match referee reports and active on-pitch timeline incidents.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Squad Metrics & Tier Classification Standard (R2-1) */}
      <div className="rounded-3xl glass-panel p-4 sm:p-8 border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight [text-wrap:balance]">
              First-Team Squad & Valuation Methodology
            </h3>
            <p className="text-xs text-slate-400 [text-wrap:balance]">
              Strict unified definitions governing squad counts, total squad valuations, and average squad age across all platform views
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-amber-400 font-bold text-sm">First-Team Tier Definition</span>
            <h4 className="text-white font-semibold">Active Senior Roster</h4>
            <p className="text-slate-400 leading-relaxed">
              Players currently contracted for the active campaign (<code className="text-amber-300">lastSeason &ge; 2025</code>) with an established transfer market valuation (<code className="text-amber-300">&gt; €0</code>) or aged 20+. Academy/youth registrants under 20 without active market valuations are classified into the academy tier and isolated from senior averages.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-emerald-400 font-bold text-sm">Squad Valuation Parity</span>
            <h4 className="text-white font-semibold">Total Market Value</h4>
            <p className="text-slate-400 leading-relaxed">
              Every club squad valuation is the exact arithmetic sum of its active first-team players&apos; individual valuations. The same canonical figure is enforced across club directory cards, club profile hero headers, domestic league tables, parity charts, meta descriptions, and OpenGraph cards.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-blue-400 font-bold text-sm">Authentic Demographic Age</span>
            <h4 className="text-white font-semibold">Real Average Age</h4>
            <p className="text-slate-400 leading-relaxed">
              Squad average age is calculated directly from verifiable birth dates (<code className="text-blue-300">2026 - birthYear</code>) of active first-team players, rounded to one decimal place. If birth dates are unavailable, the metric displays &ldquo;N/A&rdquo; rather than an estimated figure.
            </p>
          </div>
        </div>
      </div>

      {/* Data Refresh Lifecycle */}
      <div className="rounded-3xl glass-panel p-4 sm:p-8 border border-slate-800 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight [text-wrap:balance]">
              Cache Protocols & Refresh Rates
            </h3>
            <p className="text-xs text-slate-400 [text-wrap:balance]">
              How Cloudflare Pages Edge Workers deliver sub-50ms latency across global edge points
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-emerald-400 font-bold text-sm">5 Seconds</span>
            <h4 className="text-white font-semibold">Live Match Intelligence</h4>
            <p className="text-slate-400">
              Scores, minute counters, timeline cards, goals, and confirmed tactical lineups.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-amber-400 font-bold text-sm">5 Minutes</span>
            <h4 className="text-white font-semibold">Domestic League Standings</h4>
            <p className="text-slate-400">
              League points, goal differentials, and tournament qualification indicators.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-blue-400 font-bold text-sm">1 Hour (ISR)</span>
            <h4 className="text-white font-semibold">Valuations & Player Profiles</h4>
            <p className="text-slate-400">
              Market value curve graphs, transfer ledgers, career statistics, and bio details.
            </p>
          </div>
        </div>
      </div>

      {/* Zero Fabricated Data Statement */}
      <div className="rounded-3xl glass-panel p-4 sm:p-8 border border-emerald-500/30 bg-emerald-950/10 space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 [text-wrap:balance]">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          The Zero Fabricated Data Commitment
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Every statistic, transfer fee, lineup position, and market value displayed on a1score.app is grounded in real, verifiable football feeds. When a fee is not publicly disclosed by clubs, we transparently mark it as &ldquo;Undisclosed&rdquo; rather than fabricating an estimate. When an academy player transitions through youth ranks, we explicitly flag the move as an internal promotion rather than blending it with senior market transfers.
        </p>
      </div>
    </div>
  );
}
