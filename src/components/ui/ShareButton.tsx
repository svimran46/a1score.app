"use client";

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ShareButtonProps {
  title?: string;
  url?: string;
  className?: string;
  /** "chip": the 44px pill used in the player hero. */
  variant?: "default" | "chip";
  /** Classes for the visible label (chip only), e.g. to make it sr-only on narrow containers. */
  labelClassName?: string;
}

const CHIP_CLASS =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-bg-chip px-2 text-sm font-semibold text-text-primary hover:bg-bg-hover @[560px]/profile:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card select-none cursor-pointer";

export function ShareButton({ title, url, className = "", variant = "default", labelClassName = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    trackEvent("share");
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const shareTitle = title || (typeof document !== "undefined" ? document.title : "a1score");

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

  if (variant === "chip") {
    // The live region sits outside the button so the button's name stays "Share";
    // it is absolutely positioned (sr-only), so it never takes a grid or flex slot.
    return (
      <>
        <button type="button" onClick={handleShare} className={`${CHIP_CLASS} ${className}`}>
          {copied ? (
            <Check aria-hidden="true" className="size-4 shrink-0 text-text-muted" />
          ) : (
            <Share2 aria-hidden="true" className="size-4 shrink-0 text-text-muted" />
          )}
          <span className={labelClassName}>Share</span>
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? "Link copied to clipboard" : ""}
        </span>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`relative min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] shrink-0 cursor-pointer ${className}`}
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
