# a1score Push Notification Cron Worker

This Cloudflare Worker provides the scheduled cron trigger that invokes `POST https://a1score.app/api/notifications/cron` every 6 hours with a secure bearer token.

Cloudflare Pages cannot run cron triggers natively. This standalone Worker acts as the reliable cron scheduler.

## Prerequisites

1. Cloudflare account with access to the `a1score` zone / account.
2. Node.js 18+ and `wrangler` CLI (installed locally or via `npx wrangler`).

## Deployment Steps

### 1. Set the CRON_SECRET Secret

The cron secret authenticates the worker request against `a1score.app`.

Run from within the `workers/push-cron` directory:

```bash
cd workers/push-cron
npx wrangler secret put CRON_SECRET
```

When prompted, enter the exact high-entropy secret matching the `CRON_SECRET` configured in the Cloudflare Pages settings for `a1score`.

### 2. Deploy the Worker

Deploy to Cloudflare Workers:

```bash
npx wrangler deploy
```

The output will confirm deployment and display the cron trigger configuration:

```text
Uploaded a1score-push-cron
Current Triggers:
  crons:
    - 0 */6 * * *
```

### 3. Verify Deployment

To test triggering the cron workflow immediately without waiting 6 hours:

```bash
curl -X POST https://a1score-push-cron.<your-subdomain>.workers.dev/trigger \
  -H "Authorization: Bearer <YOUR_CRON_SECRET>"
```

Or test the cron route directly:

```bash
curl -i -X POST https://a1score.app/api/notifications/cron \
  -H "Authorization: Bearer <YOUR_CRON_SECRET>"
```

Expected response: HTTP 200 with `{ "success": true, ... }`.
