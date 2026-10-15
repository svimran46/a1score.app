import type { NewsItem } from "@/types/news";

export type NewsTab = "for-you" | "latest" | "transfers" | "leagues";

export const NEWS_TABS: { id: NewsTab; label: string }[] = [
  { id: "for-you", label: "For you" },
  { id: "latest", label: "Latest" },
  { id: "transfers", label: "Transfers" },
  { id: "leagues", label: "Leagues" },
];

export const NEWS_LEAGUES = ["Premier League", "LaLiga", "Serie A", "Bundesliga", "Ligue 1"];

/** Lower-case, strip accents, spaces, dashes and underscores. */
export function normalizeTopic(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s\-_.]+/g, "");
}

/** True when the item's title, tags or entity tags mention `topic`. */
export function mentionsTopic(item: NewsItem, topic: string): boolean {
  const target = normalizeTopic(topic);
  if (!target) return false;
  if (normalizeTopic(item.title).includes(target)) return true;
  if (item.tags.some((t) => normalizeTopic(t).includes(target))) return true;
  return (item.entityTags ?? []).some((t) => normalizeTopic(t.name) === target);
}

export function newestFirst(items: NewsItem[]): NewsItem[] {
  const ts = (i: NewsItem) => {
    const t = Date.parse(i.publishedAt);
    return Number.isFinite(t) ? t : 0;
  };
  return [...items].sort((a, b) => ts(b) - ts(a));
}

/** Articles that mention anything the user follows, newest first. */
export function forYouFeed(items: NewsItem[], followedNames: string[]): NewsItem[] {
  const names = followedNames.filter((n) => normalizeTopic(n).length >= 3);
  if (names.length === 0) return [];
  return newestFirst(items.filter((item) => names.some((n) => mentionsTopic(item, n))));
}

export function transfersFeed(items: NewsItem[]): NewsItem[] {
  return newestFirst(items.filter((item) => mentionsTopic(item, "transfer")));
}

export function leagueFeed(items: NewsItem[], league: string | null): NewsItem[] {
  const filtered = league ? items.filter((item) => mentionsTopic(item, league)) : items.filter((item) => NEWS_LEAGUES.some((l) => mentionsTopic(item, l)));
  return newestFirst(filtered);
}
