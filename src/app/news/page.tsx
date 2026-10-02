import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "News — a1score.app",
  description: "Latest football news, transfer market rumors, and player valuation movements.",
};

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[var(--card-radius)] bg-[var(--bg-card)] p-[var(--card-padding)] text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[var(--bg-chip)] flex items-center justify-center mx-auto text-[var(--accent)]">
          <Newspaper className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Latest Football News
          </h1>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Curated football reporting, market valuation updates, and transfer insights are coming soon in Phase 4.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--chip-radius)] bg-[var(--accent)] text-[var(--accent-contrast)] text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
