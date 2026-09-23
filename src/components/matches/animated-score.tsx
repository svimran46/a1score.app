"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Score numeral that pulses briefly when its value changes between polls.
 * Respects prefers-reduced-motion (renders statically).
 */
export function AnimatedScore({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  const previous = useRef<number | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (previous.current !== null && previous.current !== value && !shouldReduceMotion) {
      setPulseKey((k) => k + 1);
    }
    previous.current = value;
  }, [value, shouldReduceMotion]);

  return (
    <motion.span
      key={pulseKey}
      initial={pulseKey === 0 ? false : { scale: 1.45, backgroundColor: "var(--color-live)" }}
      animate={{ scale: 1, backgroundColor: "rgba(0,0,0,0)" }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "tabnum inline-flex size-6 items-center justify-center rounded-md text-sm font-bold",
        className,
      )}
    >
      {value ?? "–"}
    </motion.span>
  );
}
