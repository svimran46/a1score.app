import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/data/news";

export const runtime = "edge";
export const revalidate = 300; // 5-minute cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const items = await getNews(category);

    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch news", items: [] },
      { status: 500 }
    );
  }
}
