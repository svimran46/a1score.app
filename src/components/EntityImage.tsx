"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps, StaticImageData } from "next/image";
import { User, Shield, Trophy } from "lucide-react";

export type EntityType = "player" | "club" | "league" | "generic";

export interface EntityImageProps extends Omit<ImageProps, "onError" | "src"> {
  src?: string | null | StaticImageData;
  entityType?: EntityType;
  fallbackType?: EntityType; // Backward compatibility with SafeImage
  fallbackIconClassName?: string;
}

export function EntityImage({
  src,
  alt,
  entityType,
  fallbackType,
  sizes,
  fill,
  className = "",
  fallbackIconClassName = "",
  ...props
}: EntityImageProps) {
  const resolvedType: EntityType = entityType || fallbackType || "generic";
  const [currentSrc, setCurrentSrc] = useState<string | StaticImageData | null>(src || null);
  const [triedR2Fallback, setTriedR2Fallback] = useState(false);
  const [hasError, setHasError] = useState(!src);

  // Sync if src prop changes
  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setTriedR2Fallback(false);
      setHasError(false);
    } else {
      setCurrentSrc(null);
      setHasError(true);
    }
  }, [src]);

  const handleError = () => {
    const r2Base = process.env.NEXT_PUBLIC_R2_URL;

    // If R2 mirror is available and we haven't tried the R2 mirror fallback yet
    if (r2Base && typeof currentSrc === "string" && !triedR2Fallback) {
      try {
        const parsed = new URL(currentSrc);
        const cleanBase = r2Base.replace(/\/$/, "");
        const r2Url = `${cleanBase}${parsed.pathname}`;
        
        // Only try if R2 URL is different from current failed URL
        if (r2Url !== currentSrc) {
          setTriedR2Fallback(true);
          setCurrentSrc(r2Url);
          return;
        }
      } catch {
        // Invalid URL, fall through to error
      }
    }

    // Otherwise mark as failed and show resilient SVG icon
    setHasError(true);
  };

  if (!currentSrc || hasError) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded p-0.5 select-none ${className}`}
        role="img"
        aria-label={alt || `${resolvedType} icon`}
      >
        {resolvedType === "club" && (
          <Shield className={`w-3/5 h-3/5 text-text-muted/90 ${fallbackIconClassName}`} />
        )}
        {resolvedType === "player" && (
          <User className={`w-3/5 h-3/5 text-text-muted/90 ${fallbackIconClassName}`} />
        )}
        {resolvedType === "league" && (
          <Trophy className={`w-3/5 h-3/5 text-text-muted/90 ${fallbackIconClassName}`} />
        )}
        {resolvedType === "generic" && (
          <Shield className={`w-3/5 h-3/5 text-text-muted/90 ${fallbackIconClassName}`} />
        )}
      </div>
    );
  }

  // Conservative sizes fallback if fill is passed without sizes (prevents w=3840 Next.js default)
  const effectiveSizes = fill && !sizes ? "(max-width: 640px) 48px, 96px" : sizes;

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      sizes={effectiveSizes}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}

// Backward-compatible alias for existing components
export const SafeImage = EntityImage;
export default EntityImage;
