export interface NewsEntityTag {
  name: string;
  type: "player" | "club" | "competition" | "topic";
  href?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  imageUrl?: string | null;
  source: string;
  publishedAt: string; // ISO string
  url: string;
  tags: string[]; // e.g. ["Premier League", "Manchester City", "transfers"]
  entityTags?: NewsEntityTag[];
}
