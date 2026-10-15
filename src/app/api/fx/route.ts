import { NextResponse } from "next/server";
import { parseEcbDailyXml } from "@/lib/currency";

export const runtime = "edge";

const ECB_DAILY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
// The ECB publishes once per working day (~16:00 CET); half a day is fresh enough.
const MAX_AGE_SECONDS = 43_200;

/** EUR → GBP/USD reference rates for display-currency conversion. */
export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const res = await fetch(ECB_DAILY_URL, {
      signal: controller.signal,
      next: { revalidate: MAX_AGE_SECONDS },
    } as RequestInit);
    if (!res.ok) throw new Error(`ECB responded ${res.status}`);
    const fx = parseEcbDailyXml(await res.text());
    if (!fx) throw new Error("Unrecognised ECB response");
    return NextResponse.json(
      { ...fx, source: "European Central Bank reference rates" },
      { headers: { "Cache-Control": `public, max-age=3600, s-maxage=${MAX_AGE_SECONDS}` } }
    );
  } catch (err) {
    console.warn("[fx] rates unavailable:", err instanceof Error ? err.message : err);
    // Clients keep showing euros when rates are unavailable.
    return NextResponse.json({ error: "rates_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  } finally {
    clearTimeout(timeout);
  }
}
