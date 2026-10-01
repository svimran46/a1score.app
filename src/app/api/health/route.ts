import { NextRequest, NextResponse } from "next/server";
import { getXMasHeader } from "@/lib/fotmob/client";

export const runtime = "edge";

const FOTMOB_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://www.fotmob.com/",
};

export async function GET(req: NextRequest) {
  const now = new Date().toISOString();
  const searchParams = req.nextUrl.searchParams;

  // 1. Supabase connectivity check (accepts same env vars as src/lib/supabase.ts)
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  let supabaseOk = false;
  let supabaseProbeStatus: number | null = null;
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/League?select=id&limit=1`, {
        method: "GET",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        signal: AbortSignal.timeout(3000),
      });
      supabaseProbeStatus = res.status;
      supabaseOk = res.ok;
    } catch {
      supabaseOk = false;
    }
  }

  // 2. FotMob reachability check (fast probe with 1.5s timeout)
  // Optional / non-blocking: FotMob degradation NEVER fails the health check (remains 200)
  let fotmobOk = false;
  let fotmobLatencyMs: number | null = null;
  const skipFotmob = searchParams.get("fotmob") === "false";

  if (!skipFotmob) {
    const fotmobStart = Date.now();
    try {
      const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const path = `/api/data/matches?date=${dateFormatted}`;
      const xMas = getXMasHeader(path);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`https://www.fotmob.com${path}`, {
        method: "GET",
        headers: {
          ...FOTMOB_HEADERS,
          "x-mas": xMas,
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      fotmobLatencyMs = Date.now() - fotmobStart;
      fotmobOk = res.ok;
    } catch {
      fotmobLatencyMs = Date.now() - fotmobStart;
      fotmobOk = false;
    }
  }

  const isProd = process.env.NODE_ENV === "production";
  const healthy = supabaseAnonKey ? supabaseOk : !isProd;
  const httpStatus = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: healthy ? (fotmobOk || skipFotmob ? "healthy" : "degraded") : "unhealthy",
      timestamp: now,
      version: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
      checks: {
        supabase: supabaseOk ? "ok" : (supabaseAnonKey ? "unreachable" : "unconfigured"),
        fotmob: skipFotmob ? "skipped" : (fotmobOk ? "ok" : "degraded"),
      },
      supabase: {
        ok: supabaseOk,
        status: supabaseProbeStatus,
        keyConfigured: Boolean(supabaseAnonKey),
        keyLength: supabaseAnonKey.length,
      },
      fotmob: {
        ok: fotmobOk,
        latencyMs: fotmobLatencyMs,
      },
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}
