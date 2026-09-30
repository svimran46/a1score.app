import { constructMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ShieldCheck, Database, Lock, Eye, Mail, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Privacy Policy",
  description: "Privacy policy, data collection practices, and cookie disclosures for a1score.app.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const lastUpdated = "September 30, 2026";

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-400">
              Last updated: {lastUpdated} • Transparency & Data Practices
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-slate-900/40 space-y-6 text-sm text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" /> 1. Data Collection & Analytics
          </h2>
          <p>
            a1score.app is an independent football market intelligence and match analytics platform. We prioritize user privacy and strictly avoid invasive behavioral tracking or cross-site data harvesting.
          </p>
          <p>
            We do not sell, rent, or trade your personal information to third parties. We do not require account registration or collect personal names, telephone numbers, or physical addresses for general site browsing.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" /> 2. Cookies & Local Storage
          </h2>
          <p>
            We utilize browser <code>localStorage</code> strictly for technical user interface preferences:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li><strong>Theme Preference:</strong> Storing your selection of Dark or Light visual display mode.</li>
            <li><strong>Live Polling Toggle:</strong> Remembering your preference for enabling or pausing the 5-second match refresher.</li>
          </ul>
          <p>
            We do not deploy third-party advertising cookies or tracking pixels.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" /> 3. Data Sources & Attribution
          </h2>
          <p>
            All football statistics, tactical pitch coordinates, live match events, and competition standings are sourced through public endpoints provided by the FotMob API engine. Player market valuations, historical valuation curves, and commercial transfer ledgers are sourced from Transfermarkt.
          </p>
          <p>
            Valuation figures represent estimated economic market capital and do not constitute certified accounting audits or official club balance sheets.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-400" /> 4. Contact & Inquiries
          </h2>
          <p>
            If you have questions, corrections regarding player data, or privacy requests, please contact our team via email at{" "}
            <a href="mailto:privacy@a1score.app" className="text-amber-400 hover:underline">
              privacy@a1score.app
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
