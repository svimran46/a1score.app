# Cloudflare Edge Rate Limiting Recommendations

## Overview

`a1score.app` executes on the Cloudflare Pages Edge Runtime (`export const runtime = "edge"`). While the application includes in-memory rate limiting (`src/lib/rate-limit.ts`) to throttle rapid bursts against a single V8 isolate, memory is **per-isolate and not shared across Cloudflare's global edge network**.

To effectively guard against distributed abuse, scraping, and denial-of-service attempts targeting `/api/*` and the asset proxy `/img/asset/*`, configure Edge Rate Limiting Rules in the Cloudflare Dashboard.

---

## Recommended Cloudflare WAF Rate Limiting Rules

### Rule 1: API Route Protection (`/api/*`)

Prevents abusive polling, data scraping, and resource exhaustion against serverless endpoints.

- **Rule Name:** `Limit API Request Floods`
- **Field / Expression:**
  ```text
  (http.request.uri.path wildcard "/api/*")
  ```
- **Characteristics:** `IP` (`ip.src`)
- **Rate Limit Criteria:**
  - **Requests:** `60` requests
  - **Period:** `1 minute` (60 seconds)
- **Mitigation Action:** `Block` or `Managed Challenge`
- **Duration:** `60 seconds`
- **Custom Response (if Block selected):**
  - **Content-Type:** `application/json`
  - **Status Code:** `429 Too Many Requests`
  - **Body:**
    ```json
    { "error": "Too many requests. Please slow down.", "status": 429 }
    ```

---

### Rule 2: Image Asset Proxy Protection (`/img/asset/*`)

The `/img/asset/*` route proxies upstream CDN assets. Rate limiting prevents third parties from using your domain as a high-bandwidth proxy relay.

- **Rule Name:** `Limit Asset Proxy Abuse`
- **Field / Expression:**
  ```text
  (http.request.uri.path wildcard "/img/asset/*")
  ```
- **Characteristics:** `IP` (`ip.src`)
- **Rate Limit Criteria:**
  - **Requests:** `120` requests
  - **Period:** `1 minute` (60 seconds)
- **Mitigation Action:** `Managed Challenge` or `Block`
- **Duration:** `60 seconds`

---

### Rule 3: Missing Header / Suspicious Bot Challenge (Optional)

Mitigates headless scripts attempting to bypass application telemetry:

- **Rule Name:** `Challenge Unknown Automated Clients`
- **Field / Expression:**
  ```text
  (http.request.uri.path wildcard "/api/*" or http.request.uri.path wildcard "/img/asset/*") and (not cf.client.bot) and (not http.user_agent matches "^Mozilla")
  ```
- **Mitigation Action:** `Managed Challenge`

---

## Step-by-Step Dashboard Setup

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select your domain (`a1score.app` or zone).
3. Navigate to **Security &rarr; WAF &rarr; Rate limiting rules**.
4. Click **Create rule**.
5. Input the rule name, match expression, threshold counts, and action specified above.
6. Click **Deploy**.
