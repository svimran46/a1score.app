import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/siteUrl";

export function middleware(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const isPagesDev = host.includes("pages.dev");

  if (isPagesDev) {
    // If custom domain is configured as canonical (e.g. https://a1score.app)
    // and this is the main production pages.dev domain (not a git preview branch),
    // 301 redirect GET/HEAD requests to the canonical domain.
    const isCustomDomainCanonical = !SITE_URL.includes("pages.dev") && !SITE_URL.includes("localhost");
    const isMainPagesDevHost = host === "a1score.pages.dev";
    const isGetOrHead = request.method === "GET" || request.method === "HEAD";

    if (isCustomDomainCanonical && isMainPagesDevHost && isGetOrHead) {
      const canonicalTarget = new URL(request.nextUrl.pathname + request.nextUrl.search, SITE_URL);
      return NextResponse.redirect(canonicalTarget, { status: 301 });
    }

    // For preview branches (e.g. branch-name.a1score.pages.dev), retain noindex
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
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
