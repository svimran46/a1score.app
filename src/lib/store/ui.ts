"use client";

/**
 * Small client-only UI state (Section 10). Shareable filter state that
 * belongs in the URL (selected date) intentionally does NOT live here.
 */

import { create } from "zustand";

interface UiState {
  /** Matches page: show only in-play fixtures. */
  liveOnly: boolean;
  setLiveOnly: (value: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  liveOnly: false,
  setLiveOnly: (liveOnly) => set({ liveOnly }),
}));
