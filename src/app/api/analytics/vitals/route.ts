import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    if (!json || typeof json.name !== "string" || typeof json.value !== "number") {
      return new NextResponse(null, { status: 400 });
    }

    // In production, aggregate vitals (LCP, INP, CLS) can be logged or piped to Cloudflare Analytics Engine
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Web Vital] ${json.name}: ${json.value} (${json.rating || "unrated"}) - Path: ${json.path || "/"}`);
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}
