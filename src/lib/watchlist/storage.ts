/**
 * Watchlist Storage Adapter Architecture
 * Encapsulates client-side favorite persistence behind a modular interface
 * so it can be swapped for an authenticated server-backed API in future phases.
 */

export interface WatchlistItem {
  id: string;
  type: "player" | "club";
  name: string;
  slug?: string;
  avatarUrl?: string | null;
  clubName?: string | null;
  clubCrest?: string | null;
  position?: string | null;
  savedAt: string; // ISO date
  initialValueEur?: number;
  currentValueEur?: number;
  trendPercentage?: number | null;
}

export interface WatchlistAdapter {
  getFavorites(): WatchlistItem[];
  addFavorite(item: Omit<WatchlistItem, "savedAt"> & { savedAt?: string }): boolean;
  removeFavorite(id: string, type: "player" | "club"): boolean;
  isFavorite(id: string, type: "player" | "club"): boolean;
  clearFavorites(type?: "player" | "club"): boolean;
  isStorageAvailable(): boolean;
  subscribe(callback: () => void): () => void;
}

const STORAGE_KEY = "a1score_watchlist_v1";

class LocalStorageWatchlistAdapter implements WatchlistAdapter {
  private inMemoryFallback: WatchlistItem[] = [];
  private listeners: Set<() => void> = new Set();
  private storageSupported: boolean | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) {
          this.notify();
        }
      });
    }
  }

  isStorageAvailable(): boolean {
    if (this.storageSupported !== null) {
      return this.storageSupported;
    }
    if (typeof window === "undefined" || !window.localStorage) {
      this.storageSupported = false;
      return false;
    }
    try {
      const testKey = "__a1score_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      this.storageSupported = true;
      return true;
    } catch {
      this.storageSupported = false;
      return false;
    }
  }

  getFavorites(): WatchlistItem[] {
    if (!this.isStorageAvailable()) {
      return [...this.inMemoryFallback];
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.warn("[Watchlist] Failed to read from localStorage:", e);
      return [...this.inMemoryFallback];
    }
  }

  addFavorite(item: Omit<WatchlistItem, "savedAt"> & { savedAt?: string }): boolean {
    const fullItem: WatchlistItem = {
      ...item,
      savedAt: item.savedAt || new Date().toISOString(),
      initialValueEur: item.initialValueEur ?? item.currentValueEur ?? 0,
    };

    const current = this.getFavorites();
    const filtered = current.filter((f) => !(f.id === item.id && f.type === item.type));
    const next = [fullItem, ...filtered];

    if (!this.isStorageAvailable()) {
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this.notify();
      return true;
    } catch (e) {
      console.warn("[Watchlist] Failed to write to localStorage:", e);
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }
  }

  removeFavorite(id: string, type: "player" | "club"): boolean {
    const current = this.getFavorites();
    const next = current.filter((f) => !(f.id === id && f.type === type));

    if (!this.isStorageAvailable()) {
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this.notify();
      return true;
    } catch (e) {
      console.warn("[Watchlist] Failed to remove from localStorage:", e);
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }
  }

  isFavorite(id: string, type: "player" | "club"): boolean {
    const current = this.getFavorites();
    return current.some((f) => f.id === id && f.type === type);
  }

  clearFavorites(type?: "player" | "club"): boolean {
    let next: WatchlistItem[] = [];
    if (type) {
      const current = this.getFavorites();
      next = current.filter((f) => f.type !== type);
    }

    if (!this.isStorageAvailable()) {
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }

    try {
      if (next.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      this.notify();
      return true;
    } catch (e) {
      console.warn("[Watchlist] Failed to clear localStorage:", e);
      this.inMemoryFallback = next;
      this.notify();
      return false;
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error("[Watchlist] Error in subscriber callback:", err);
      }
    });
  }
}

// Singleton storage adapter instance
export const watchlistAdapter: WatchlistAdapter = new LocalStorageWatchlistAdapter();
