"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TeamLogoProps {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}

/**
 * Crest/logo image served from the allow-listed API CDN. Falls back to a
 * neutral initial tile when the URL is missing or fails to load.
 */
export function TeamLogo({ src, alt, size = 24, className }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.45) }}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground uppercase",
          className,
        )}
      >
        {alt.charAt(0)}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={`${alt} crest`}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      onError={() => setFailed(true)}
      sizes={`${size}px`}
    />
  );
}
