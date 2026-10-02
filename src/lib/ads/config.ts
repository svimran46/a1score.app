/**
 * src/lib/ads/config.ts
 *
 * Feature flag & format configuration for non-intrusive, zero-CLS ad slots.
 * Disabled by default via NEXT_PUBLIC_ADS_ENABLED=false.
 */

export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

export type AdFormat = "banner" | "rectangle" | "leaderboard";

export interface AdFormatSpec {
  name: AdFormat;
  width: number;
  height: number;
  minHeightPx: number;
  containerClasses: string;
}

export const AD_FORMATS: Record<AdFormat, AdFormatSpec> = {
  rectangle: {
    name: "rectangle",
    width: 300,
    height: 250,
    minHeightPx: 250,
    containerClasses: "w-[300px] h-[250px] min-h-[250px]",
  },
  banner: {
    name: "banner",
    width: 320,
    height: 100,
    minHeightPx: 100,
    containerClasses: "w-full max-w-[320px] h-[100px] min-h-[100px]",
  },
  leaderboard: {
    name: "leaderboard",
    width: 728,
    height: 90,
    minHeightPx: 90,
    containerClasses: "w-full max-w-[728px] h-[90px] min-h-[90px]",
  },
};
