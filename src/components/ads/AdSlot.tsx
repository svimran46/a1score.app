"use client";

import React, { useState, useEffect } from "react";
import { ADS_ENABLED, AD_FORMATS, AdFormat } from "@/lib/ads/config";

interface AdSlotProps {
  id: string;
  format?: AdFormat;
  mock?: boolean;
  className?: string;
}

let adScriptLoaded = false;

function loadDeferredAdScript(scriptUrl?: string): void {
  if (typeof window === "undefined" || adScriptLoaded) return;

  const url = scriptUrl || process.env.NEXT_PUBLIC_AD_SCRIPT_URL;
  if (!url) return;

  const trigger = () => {
    if (adScriptLoaded) return;
    adScriptLoaded = true;

    window.removeEventListener("scroll", trigger);
    window.removeEventListener("pointerdown", trigger);
    window.removeEventListener("keydown", trigger);

    const script = document.createElement("script");
    script.async = true;
    script.src = url;
    document.body.appendChild(script);
  };

  const passiveOpts = { passive: true, once: true };
  window.addEventListener("scroll", trigger, passiveOpts);
  window.addEventListener("pointerdown", trigger, passiveOpts);
  window.addEventListener("keydown", trigger, passiveOpts);

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(trigger, { timeout: 5000 });
  } else {
    setTimeout(trigger, 4000);
  }
}

/**
 * High-performance Ad Slot with strict zero-CLS reserved container.
 * Returns null if ADS_ENABLED=false (default) unless in mock test mode.
 */
export function AdSlot({
  id,
  format = "rectangle",
  mock = false,
  className = "",
}: AdSlotProps) {
  const isEnabled = ADS_ENABLED || mock;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isEnabled) {
      loadDeferredAdScript();
    }
  }, [isEnabled]);

  // If feature flag is off and not explicitly testing mock, render nothing
  if (!isEnabled) {
    return null;
  }

  const spec = AD_FORMATS[format] || AD_FORMATS.rectangle;

  return (
    <aside
      aria-label="Advertisement"
      data-ad-slot={id}
      data-ad-format={format}
      className={`mx-auto my-6 flex flex-col items-center justify-center ${className}`}
    >
      {/* Required Accessible Label */}
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 select-none">
        Advertisement
      </span>

      {/* Reserved Fixed-Height Container Guarantees Zero CLS */}
      <div
        style={{ minHeight: `${spec.minHeightPx}px` }}
        className={`relative ${spec.containerClasses} bg-[var(--bg-card)] border border-[var(--divider)] rounded-[var(--card-radius)] flex items-center justify-center overflow-hidden transition-colors`}
      >
        {/* Placeholder / Mock Preview */}
        <div className="text-center p-4 space-y-1">
          <div className="text-xs font-semibold text-[var(--text-muted)]">
            Sponsorship &amp; Football Intelligence
          </div>
          <div className="text-[10px] text-[var(--text-muted)] opacity-75">
            Privacy-First • Zero Cross-Site Tracking
          </div>
        </div>
      </div>
    </aside>
  );
}
