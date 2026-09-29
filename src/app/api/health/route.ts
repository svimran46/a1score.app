import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const now = new Date().toISOString();

  // Quick Supabase connectivity check
  let supabaseOk = false;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "HEAD",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        },
        signal: AbortSignal.timeout(3000),
      });
      supabaseOk = res.ok || res.status === 400; // 400 = table required, but connection works
    }
  } catch {
    supabaseOk = false;
  }

  const status = supabaseOk ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status,
      timestamp: now,
      version: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
      checks: {
        supabase: supabaseOk ? "ok" : "unreachable",
      },
    },
    {
      status: supabaseOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
