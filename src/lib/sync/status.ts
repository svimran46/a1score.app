/** Sync status shared by the engine and the account UI (kept separate so the UI doesn't pull in the engine). */
export type SyncStatus = "idle" | "syncing" | "synced" | "error";

let status: SyncStatus = "idle";
const listeners = new Set<() => void>();

export function setSyncStatus(next: SyncStatus) {
  status = next;
  listeners.forEach((l) => l());
}
export const getSyncStatus = () => status;
export function subscribeSyncStatus(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
