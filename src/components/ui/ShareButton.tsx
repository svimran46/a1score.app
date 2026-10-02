"use client";

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ShareButtonProps {
  title?: string;
  url?: string;
  className?: string;
}

export function ShareButton({ title, url, className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    trackEvent("share");
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const shareTitle = title || (typeof document !== "undefined" ? document.title : "a1score.app");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`relative min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--value-text)] shrink-0 cursor-pointer ${className}`}
      aria-label={copied ? "Link copied to clipboard" : "Share this page"}
      title={copied ? "Copied!" : "Share"}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-[var(--trend-positive)]" />
          <span className="text-xs font-semibold text-[var(--trend-positive)] hidden sm:inline">Copied</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span className="text-xs font-semibold hidden sm:inline">Share</span>
        </>
      )}
    </button>
  );
}
