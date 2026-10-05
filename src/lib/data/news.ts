import { NewsItem, NewsEntityTag } from "@/types/news";

const RSS_FEEDS = [
  {
    name: "Sky Sports",
    url: "https://www.skysports.com/rss/12691", // Transfer Centre
  },
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/football/rss",
  },
  {
    name: "BBC Sport",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
  },
  {
    name: "Marca (English)",
    url: "https://e00-marca.uecdn.es/rss/en/football.xml", // Spanish / European Football
  },
  {
    name: "Football Italia",
    url: "https://football-italia.net/feed/", // Italian Serie A coverage
  },
];

const NON_FOOTBALL_PATTERN = /\b(cricket|formula 1|f1|golf|horse racing|rugby|darts|nba|nfl|tennis|boxing|ufc|mma|snooker|motogp)\b/i;

// Curated entity keywords to detect and link in headlines
const ENTITY_DICTIONARY: Array<{
  pattern: RegExp;
  tag: string;
  type: "player" | "club" | "competition" | "topic";
  href: string;
}> = [
  // Topics & Competitions
  { pattern: /\b(transfer|transfers|fee|signed|signing|contract|rumour|rumor|bid|deal|deadline)\b/i, tag: "Transfers", type: "topic", href: "/transfers" },
  { pattern: /\b(premier league|epl)\b/i, tag: "Premier League", type: "competition", href: "/leagues/premier-league" },
  { pattern: /\b(la\s*liga|primera divisi[oó]n)\b/i, tag: "LaLiga", type: "competition", href: "/leagues/laliga" },
  { pattern: /\b(serie a)\b/i, tag: "Serie A", type: "competition", href: "/leagues/serie-a" },
  { pattern: /\b(bundesliga)\b/i, tag: "Bundesliga", type: "competition", href: "/leagues/bundesliga" },
  { pattern: /\b(ligue 1)\b/i, tag: "Ligue 1", type: "competition", href: "/leagues/ligue-1" },
  { pattern: /\b(champions league|ucl)\b/i, tag: "Champions League", type: "competition", href: "/leagues/champions-league" },

  // Top Clubs
  { pattern: /\b(real madrid|madrid|los blancos)\b/i, tag: "Real Madrid", type: "club", href: "/clubs/real-madrid" },
  { pattern: /\b(barcelona|barca|barça|blaugrana)\b/i, tag: "Barcelona", type: "club", href: "/clubs/barcelona" },
  { pattern: /\b(manchester city|man city|cityzens)\b/i, tag: "Manchester City", type: "club", href: "/clubs/manchester-city" },
  { pattern: /\b(arsenal|gunners)\b/i, tag: "Arsenal", type: "club", href: "/clubs/arsenal" },
  { pattern: /\b(liverpool|reds|anfield)\b/i, tag: "Liverpool", type: "club", href: "/clubs/liverpool" },
  { pattern: /\b(chelsea|blues|stamford bridge)\b/i, tag: "Chelsea", type: "club", href: "/clubs/chelsea" },
  { pattern: /\b(manchester united|man utd|red devils|old trafford)\b/i, tag: "Manchester United", type: "club", href: "/clubs/manchester-united" },
  { pattern: /\b(bayern munich|bayern|bavarians)\b/i, tag: "Bayern Munich", type: "club", href: "/clubs/bayern-munich" },
  { pattern: /\b(paris saint-germain|psg)\b/i, tag: "Paris Saint-Germain", type: "club", href: "/clubs/paris-saint-germain" },
  { pattern: /\b(juventus|juve|bianconeri)\b/i, tag: "Juventus", type: "club", href: "/clubs/juventus" },
  { pattern: /\b(inter milan|nerazzurri)\b/i, tag: "Inter", type: "club", href: "/clubs/inter" },
  { pattern: /\b(ac milan|milan|rossoneri)\b/i, tag: "AC Milan", type: "club", href: "/clubs/ac-milan" },
  { pattern: /\b(borussia dortmund|dortmund|bvb)\b/i, tag: "Borussia Dortmund", type: "club", href: "/clubs/borussia-dortmund" },
  { pattern: /\b(tottenham|spurs)\b/i, tag: "Tottenham Hotspur", type: "club", href: "/clubs/tottenham-hotspur" },
  { pattern: /\b(aston villa|villa)\b/i, tag: "Aston Villa", type: "club", href: "/clubs/aston-villa" },
  { pattern: /\b(atletico madrid|atlético madrid|atleti)\b/i, tag: "Atlético Madrid", type: "club", href: "/clubs/atletico-madrid" },
  { pattern: /\b(newcastle)\b/i, tag: "Newcastle United", type: "club", href: "/clubs/newcastle-united" },
  { pattern: /\b(leverkusen|bayer 04)\b/i, tag: "Bayer Leverkusen", type: "club", href: "/clubs/bayer-leverkusen" },

  // Top Players
  { pattern: /\b(erling haaland|haaland)\b/i, tag: "Erling Haaland", type: "player", href: "/players/erling-haaland-418560" },
  { pattern: /\b(lamine yamal|yamal)\b/i, tag: "Lamine Yamal", type: "player", href: "/players/lamine-yamal-1051588" },
  { pattern: /\b(kylian mbapp[eé]|mbapp[eé])\b/i, tag: "Kylian Mbappé", type: "player", href: "/players/kylian-mbappe-342229" },
  { pattern: /\b(vinicius junior|vinicius jr|vinicius)\b/i, tag: "Vinicius Junior", type: "player", href: "/players/vinicius-junior-371998" },
  { pattern: /\b(jude bellingham|bellingham)\b/i, tag: "Jude Bellingham", type: "player", href: "/players/jude-bellingham-581678" },
  { pattern: /\b(bukayo saka|saka)\b/i, tag: "Bukayo Saka", type: "player", href: "/players/bukayo-saka-433177" },
  { pattern: /\b(florian wirtz|wirtz)\b/i, tag: "Florian Wirtz", type: "player", href: "/players/florian-wirtz-598577" },
  { pattern: /\b(cole palmer|palmer)\b/i, tag: "Cole Palmer", type: "player", href: "/players/cole-palmer-568177" },
  { pattern: /\b(harry kane|kane)\b/i, tag: "Harry Kane", type: "player", href: "/players/harry-kane-132098" },
  { pattern: /\b(phil foden|foden)\b/i, tag: "Phil Foden", type: "player", href: "/players/phil-foden-406635" },
  { pattern: /\b(rodri)\b/i, tag: "Rodri", type: "player", href: "/players/rodri-357565" },
  { pattern: /\b(declan rice)\b/i, tag: "Declan Rice", type: "player", href: "/players/declan-rice-357662" },
  { pattern: /\b(mohamed salah|salah)\b/i, tag: "Mohamed Salah", type: "player", href: "/players/mohamed-salah-148455" },
  { pattern: /\b(jamal musiala|musiala)\b/i, tag: "Jamal Musiala", type: "player", href: "/players/jamal-musiala-580195" },
];

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fb-1",
    title: "European Transfer Window Review: Record valuations and commercial market trends",
    snippet: "Analyzing top European club financial movements, squad valuations, and high-profile contract extensions across Europe's top 5 leagues.",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    source: "Sky Sports",
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    url: "https://www.skysports.com/football/news",
    tags: ["Transfers", "Premier League", "LaLiga"],
    entityTags: [
      { name: "Transfers", type: "topic", href: "/transfers" },
      { name: "Premier League", type: "competition", href: "/leagues/premier-league" },
    ],
  },
  {
    id: "fb-2",
    title: "Lamine Yamal reaches €180M valuation milestone following dominant campaign",
    snippet: "Barcelona forward emerges as one of world football's most valuable players as proprietary algorithm factors in performance indicators and age curves.",
    imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80",
    source: "The Guardian",
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    url: "https://www.theguardian.com/football",
    tags: ["LaLiga", "Barcelona", "Lamine Yamal"],
    entityTags: [
      { name: "Barcelona", type: "club", href: "/clubs/barcelona" },
      { name: "Lamine Yamal", type: "player", href: "/players/lamine-yamal-1051588" },
      { name: "LaLiga", type: "competition", href: "/leagues/laliga" },
    ],
  },
  {
    id: "fb-3",
    title: "Manchester City and Arsenal square off in title race valuation duel",
    snippet: "Squad market values exceed €1 billion each as Premier League contenders prepare for decisive weekend fixture.",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    source: "Sky Sports",
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    url: "https://www.skysports.com/football",
    tags: ["Premier League", "Manchester City", "Arsenal"],
    entityTags: [
      { name: "Manchester City", type: "club", href: "/clubs/manchester-city" },
      { name: "Arsenal", type: "club", href: "/clubs/arsenal" },
      { name: "Premier League", type: "competition", href: "/leagues/premier-league" },
    ],
  },
  {
    id: "fb-4",
    title: "Real Madrid evaluate squad depth ahead of European campaign return",
    snippet: "Carlo Ancelotti manages player rotation and minutes allocation following intensive international schedule.",
    imageUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80",
    source: "The Independent",
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    url: "https://www.independent.co.uk/sport/football",
    tags: ["LaLiga", "Real Madrid", "Champions League"],
    entityTags: [
      { name: "Real Madrid", type: "club", href: "/clubs/real-madrid" },
      { name: "Champions League", type: "competition", href: "/leagues/champions-league" },
    ],
  },
  {
    id: "fb-5",
    title: "Bundesliga market values update: Young talents surge in German top flight",
    snippet: "German clubs record substantial growth in domestic squad valuations with standout performances across youth academies.",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    source: "The Guardian",
    publishedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    url: "https://www.theguardian.com/football",
    tags: ["Bundesliga", "Bayern Munich"],
    entityTags: [
      { name: "Bundesliga", type: "competition", href: "/leagues/bundesliga" },
      { name: "Bayern Munich", type: "club", href: "/clubs/bayern-munich" },
    ],
  },
];

/**
 * Clean HTML strings, decode entities, and strip CDATA.
 */
function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Truncate snippet to maximum ~160 characters without splitting words.
 */
function formatSnippet(text: string, maxLen = 160): string {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxLen) return cleaned;
  const truncated = cleaned.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 80 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

/**
 * Extract image URL from enclosure, media:content, or img tag in XML block.
 */
function extractImage(itemXml: string): string | null {
  // 1. Check media:content with url attribute
  const mediaMatches = Array.from(itemXml.matchAll(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/gi));
  if (mediaMatches.length > 0) {
    const best = mediaMatches[mediaMatches.length - 1][1];
    if (best) return best.replace(/&amp;/g, "&");
  }

  // 2. Check enclosure with url attribute
  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
  if (enclosureMatch && enclosureMatch[1]) {
    return enclosureMatch[1].replace(/&amp;/g, "&");
  }

  // 3. Check <img> tag inside description or content
  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1].replace(/&amp;/g, "&");
  }

  return null;
}

/**
 * Tag an article by scanning its title and snippet for known entities.
 */
function detectEntities(title: string, snippet: string): { tags: string[]; entityTags: NewsEntityTag[] } {
  const combined = `${title} ${snippet}`;
  const tagsSet = new Set<string>();
  const entityTags: NewsEntityTag[] = [];

  for (const entity of ENTITY_DICTIONARY) {
    if (entity.pattern.test(combined)) {
      if (!tagsSet.has(entity.tag)) {
        tagsSet.add(entity.tag);
        entityTags.push({
          name: entity.tag,
          type: entity.type,
          href: entity.href,
        });
      }
    }
  }

  // Default to Football if no specific league found
  if (tagsSet.size === 0) {
    tagsSet.add("Football");
  }

  return {
    tags: Array.from(tagsSet),
    entityTags,
  };
}

/**
 * Parse an individual RSS feed XML string into normalized NewsItem objects.
 */
function parseRssFeed(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    const title = cleanText(titleMatch ? titleMatch[1] : "");
    const url = cleanText(linkMatch ? linkMatch[1] : "");
    const rawDesc = descMatch ? descMatch[1] : "";
    const snippet = formatSnippet(rawDesc);
    const pubDateStr = pubDateMatch ? cleanText(pubDateMatch[1]) : "";

    if (!title || !url) continue;

    // Filter out non-football items that might leak in
    if (NON_FOOTBALL_PATTERN.test(title)) continue;

    let publishedAt = new Date().toISOString();
    if (pubDateStr) {
      const parsedTime = new Date(pubDateStr).getTime();
      if (!isNaN(parsedTime)) {
        publishedAt = new Date(parsedTime).toISOString();
      }
    }

    const imageUrl = extractImage(block);
    const { tags, entityTags } = detectEntities(title, snippet);

    const id = `news-${Math.abs(
      url.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    ).toString(36)}`;

    items.push({
      id,
      title,
      snippet,
      imageUrl,
      source: sourceName,
      publishedAt,
      url,
      tags,
      entityTags,
    });
  }

  return items;
}

/**
 * Normalize a headline title for strict deduplication.
 */
export function normalizeHeadline(title: string): string {
  return (title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^papers:\s*/i, "")
    .replace(/^paper talk:\s*/i, "")
    .replace(/^gossip:\s*/i, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Filter out generic/empty/meaningless headlines.
 */
function isMeaningfulHeadline(title: string): boolean {
  if (!title || title.trim().length < 10) return false;
  const lower = title.toLowerCase().trim();
  const genericTitles = [
    "latest news",
    "football news",
    "breaking news",
    "live updates",
    "match report",
    "highlights",
    "watch live",
  ];
  if (genericTitles.includes(lower)) return false;
  return true;
}

/**
 * Deduplicate news items by normalized title keywords and canonical URL,
 * balance sources by capping items per source, and tag/label roundups.
 */
export function deduplicateNews(items: NewsItem[], maxPerSource = 8): NewsItem[] {
  const seenTitles = new Set<string>();
  const seenUrls = new Set<string>();
  const sourceCounts: Record<string, number> = {};
  const deduped: NewsItem[] = [];

  for (const item of items) {
    if (!isMeaningfulHeadline(item.title)) continue;

    // Check per-source quota for regional balance
    const currentCount = sourceCounts[item.source] || 0;
    if (currentCount >= maxPerSource) continue;

    // Normalize URL (strip tracking params like utm_*)
    const cleanUrl = item.url.split("?")[0].toLowerCase();
    if (seenUrls.has(cleanUrl)) continue;

    // Normalize title tokens (first 6 substantive words)
    const normalized = normalizeHeadline(item.title);
    const sig = normalized.split(/\s+/).slice(0, 6).join(" ");

    if (sig.length >= 8 && seenTitles.has(sig)) continue;

    seenUrls.add(cleanUrl);
    if (sig.length >= 8) seenTitles.add(sig);
    sourceCounts[item.source] = currentCount + 1;

    // Label "Papers:" roundup articles explicitly
    let adjustedTitle = item.title;
    const isRoundup = /^(papers|paper talk|gossip|media watch):\s*/i.test(item.title);
    const tags = [...item.tags];
    if (isRoundup && !tags.includes("Press Roundup")) {
      tags.unshift("Press Roundup");
    }

    deduped.push({
      ...item,
      title: adjustedTitle,
      tags,
    });
  }

  return deduped;
}

/**
 * Fetch and parse a single RSS feed with timeout and Next.js ISR cache.
 */
async function fetchFeed(feed: { name: string; url: string }): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "a1score-news-aggregator/1.0 (+https://a1score.app)",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      next: { revalidate: 300 }, // Cache 5 minutes in Next.js / Cloudflare edge
    });

    clearTimeout(timeout);

    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssFeed(xml, feed.name);
  } catch {
    return [];
  }
}

/**
 * Primary news data fetching function:
 * Aggregates all syndicated RSS feeds, normalizes, deduplicates, and sorts newest first.
 */
export async function getNews(category?: string): Promise<NewsItem[]> {
  try {
    const feedResults = await Promise.all(RSS_FEEDS.map((f) => fetchFeed(f)));
    const allFetched = feedResults.flat();

    const merged = allFetched.length > 0 ? allFetched : FALLBACK_NEWS;
    const sorted = deduplicateNews(merged).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    if (!category || category.toLowerCase() === "all") {
      return sorted;
    }

    const normCat = category.toLowerCase().replace(/[\s\-_]+/g, "");
    return sorted.filter((item) =>
      item.tags.some((t) => t.toLowerCase().replace(/[\s\-_]+/g, "").includes(normCat))
    );
  } catch {
    return FALLBACK_NEWS;
  }
}

/**
 * Retrieve related news items for a specific player or club by matching tags.
 */
export async function getRelatedNews(tags: string[], limit = 3): Promise<NewsItem[]> {
  if (!tags || tags.length === 0) return [];

  const allNews = await getNews();
  const normalizedTargets = tags.map((t) => t.toLowerCase().replace(/[\s\-_]+/g, ""));

  const matched = allNews.filter((item) => {
    const itemTags = item.tags.map((t) => t.toLowerCase().replace(/[\s\-_]+/g, ""));
    const titleNorm = item.title.toLowerCase();
    return normalizedTargets.some(
      (target) => itemTags.includes(target) || titleNorm.includes(target)
    );
  });

  return matched.slice(0, limit);
}

/**
 * Format relative time (e.g., "2 hr. ago", "45 min. ago", "Yesterday").
 */
export function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (isNaN(diffMs) || !dateStr) return "Recent";
    if (diffMs < 0) return "Just now"; // recent within clock skew

    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 1) return "< 1 min. ago";
    if (minutes < 60) return `${minutes} min. ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr. ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recent";
  }
}
