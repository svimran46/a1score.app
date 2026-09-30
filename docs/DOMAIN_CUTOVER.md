# Domain Cutover Runbook: a1score.app

This document provides the exact operational procedure for binding `a1score.app` as the primary production domain on Cloudflare Pages, enforcing environment variable alignment, configuring 301 redirects from `*.pages.dev`, and submitting the sitemap to Google Search Console.

---

## 1. Bind Custom Domain in Cloudflare Pages

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select your account and navigate to **Workers & Pages** > your project (`a1score` or equivalent).
3. Select the **Custom domains** tab.
4. Click **Set up a domain**.
5. Enter `a1score.app` (and optionally `www.a1score.app` as an alias).
6. Cloudflare will automatically provision:
   - SSL/TLS Universal Certificate (Edge Certificate).
   - DNS CNAME record pointing `a1score.app` to your `<project>.pages.dev` target.
7. Verify DNS propagation:
   ```bash
   dig +short a1score.app
   curl -I https://a1score.app
   ```

---

## 2. Configure Environment Variables (Build & Runtime)

Both build-time and runtime environments must have `SITE_URL` explicitly configured. Silent production fallbacks are strictly disabled in `src/lib/metadata.ts`.

1. In the Cloudflare Pages project settings, go to **Settings** > **Environment variables**.
2. Under **Production**:
   - Add variable: `SITE_URL`
   - Value: `https://a1score.app`
   - Add variable: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://a1score.app`
3. Under **Preview**:
   - Variables can remain unset or configured to preview domains; on `*.pages.dev`, the middleware and metadata resolver dynamically utilize the request host (`x-forwarded-host`) to ensure self-consistent preview URLs while preserving `X-Robots-Tag: noindex, nofollow`.
4. Trigger a production deployment or retry the latest commit to ensure the new environment variables are baked into static chunks and edge runtime workers.

---

## 3. Configure 301 Permanent Redirect Rule (`a1score.pages.dev` -> `a1score.app`)

To prevent duplicate content penalties and consolidate SEO equity onto `a1score.app`:

1. In the Cloudflare Dashboard, select the root zone for `a1score.app` or use **Redirect Rules** under **Rules** > **Overview**.
2. Click **Create rule** > **Redirect Rule** (or configure via Cloudflare Page Rules / Bulk Redirects).
3. **Rule Name**: `Redirect *.pages.dev to a1score.app`
4. **When incoming requests match**:
   - Custom filter expression:
     `(http.host eq "a1score.pages.dev")`
5. **Then redirect to**:
   - **Type**: Dynamic
   - **Expression**: `concat("https://a1score.app", http.request.uri.path)`
   - **Status code**: `301` (Permanent Redirect)
   - **Preserve query string**: Yes
6. Deploy the rule.
7. Verification command:
   ```bash
   curl -I https://a1score.pages.dev/matches
   ```
   **Expected Response:**
   ```http
   HTTP/2 301
   Location: https://a1score.app/matches
   ```

---

## 4. Google Search Console & Sitemap Submission

1. Log in to [Google Search Console](https://search.google.com/search-console).
2. Add a new **Domain property**: `a1score.app` (verifying via DNS TXT record in Cloudflare DNS).
3. Once verified, navigate to **Index** > **Sitemaps**.
4. In the "Add a new sitemap" input field, enter:
   ```text
   sitemap.xml
   ```
5. Click **Submit**.
6. Verify status:
   - Within 24-48 hours, ensure status reports **Success** and discovered URLs cover:
     - `/` (Home)
     - `/matches`
     - `/players`
     - `/clubs`
     - `/leagues`
     - `/values`
     - All canonical club, league, and player detail URLs.
7. Under **Removals** (if necessary), verify that any previous `*.pages.dev` indexed URLs are cleared or canonicalized to `https://a1score.app`.
