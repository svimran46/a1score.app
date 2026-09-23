"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Re-mounts on every route navigation, giving page content a short
 * fade-and-slide swap (150–200ms per Section 9). Static for users who
 * prefer reduced motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
