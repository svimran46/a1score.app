/**
 * Lets any component open the global search palette owned by TopNav without
 * prop-drilling: dispatch the event, TopNav listens for it.
 */
export const OPEN_SEARCH_EVENT = "a1score:open-search";

export function openSearch(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
  }
}
