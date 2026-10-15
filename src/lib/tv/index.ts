import { fotmobTvProvider } from "./fotmobProvider";
import type { TvProvider } from "./types";

/**
 * The active TV listings source. Today: FotMob's public endpoint (unofficial).
 * To switch to an official provider, implement TvProvider and change this line.
 */
export const tvProvider: TvProvider = fotmobTvProvider;

export type { TvChannel, TvListing, TvProvider, TvTeam } from "./types";
