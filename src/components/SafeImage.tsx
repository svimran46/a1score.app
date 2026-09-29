"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { User, Shield } from "lucide-react";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackType?: "player" | "club" | "generic";
}

export function SafeImage({
  src,
  alt,
  fallbackType = "generic",
  sizes,
  fill,
  className,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);

  // If no source or source errored out
  if (!src || error) {
    if (fallbackType === "club") {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 rounded-lg p-1">
          <Shield className="w-4/5 h-4/5" />
        </div>
      );
    }
    if (fallbackType === "player") {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 rounded-lg p-1">
          <User className="w-4/5 h-4/5" />
        </div>
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 rounded-lg" />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      // Always provide a conservative sizes fallback if fill is specified without sizes
      sizes={fill && !sizes ? "(max-width: 640px) 64px, 128px" : sizes}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}
