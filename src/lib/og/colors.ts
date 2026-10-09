/**
 * src/lib/og/colors.ts
 *
 * Design token hex mappings for Next.js ImageResponse (@vercel/og / next/og).
 * Edge runtime ImageResponse cannot evaluate CSS variables (var(--...)), so
 * this file serves as the canonical static mapping strictly verified against
 * src/app/tokens.css by tests/share-cards.test.ts.
 *
 * NOTE: This is the ONLY file in the codebase where raw hex codes are permitted.
 * Whitelisted explicitly in scripts/check-hardcoded-colors.ts.
 */

export const OG_COLORS = {
  // Primitives from tokens.css Layer 1
  ink950: "#07080b",
  ink900: "#0f1116",
  ink800: "#181b22",
  ink700: "#232733",
  gray100: "#f4f5f7",
  gray300: "#c4c9d2",
  gray400: "#9aa1ae",
  amber400: "#ffb020",
  amber500: "#f59e0b",
  green500: "#2ecc71",
  red500: "#ff5a5f",
  blue500: "#2563eb",
  white: "#ffffff",

  // Semantic tokens mapped from Layer 2
  bgPage: "#07080b",
  bgCard: "#0f1116",
  bgElevated: "#181b22",
  bgChip: "#181b22",
  divider: "#232733",
  textPrimary: "#f4f5f7",
  textSecondary: "#c4c9d2",
  textMuted: "#9aa1ae",
  accent: "#ffb020",
  accentContrast: "#07080b",
  valueText: "#ffb020",
  trendUp: "#2ecc71",
  trendDown: "#ff5a5f",
} as const;

export type OgColorKey = keyof typeof OG_COLORS;
