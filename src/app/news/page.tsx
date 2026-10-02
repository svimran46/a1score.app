import type { Metadata } from "next";
import { getNews } from "@/lib/data/news";
import { NewsDirectoryClient } from "@/components/news/NewsDirectoryClient";

import { constructMetadata } from "@/lib/metadata";

export const revalidate = 300; // Edge revalidation every 5 minutes
export const runtime = "edge";

export const metadata: Metadata = constructMetadata({
  title: "Football news | a1score",
  description:
    "Latest breaking football news, transfer rumors, and player market valuation intelligence across Europe's top leagues.",
  path: "/news",
});

export default async function NewsPage() {
  const initialNews = await getNews();

  return <NewsDirectoryClient initialNews={initialNews} />;
}
