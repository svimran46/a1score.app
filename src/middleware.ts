import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/siteUrl";

export function middleware(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const isPagesDev = host.includes("pages.dev");

  if (isPagesDev) {
    // Retain noindex for non-production preview deployments
    const isMainPagesDevHost = host === "a1score.pages.dev";
    if (!isMainPagesDevHost) {
      const response = NextResponse.next();
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sw.js, manifest.webmanifest
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)",
  ],
};
