# a1score Health Monitor Worker

Independent, serverless Cloudflare Worker scheduled sentinel designed to probe `a1score`'s detailed health endpoint (`/api/health/detail`) every 15 minutes.

It detects upstream failures and schema drift from FotMob and Transfermarkt before users experience degradation.

---

## Capabilities

1. **Automated Scheduled Probing**: Executes every 15 minutes via Cloudflare Worker Cron Triggers (`*/15 * * * *`).
2. **Consecutive Failure Tracking**: Requires a component to remain degraded for **2 consecutive checks (30 minutes)** before alerting, preventing false alarms from momentary upstream jitter.
3. **Multi-Channel Alerts**: Posts formatted incident alerts and recovery notices directly to Discord webhooks and/or Telegram chat.
4. **Schema Drift Detection**: Alerts if upstream APIs change payload structure (detected via Zod runtime boundary validation).
5. **Recovery Notification**: Automatically sends a resolution notification once degraded systems return to `OPERATIONAL`.

---

## Configuration & Environment Variables

| Variable | Description | Required |
|---|---|---|
| `HEALTH_URL` | Base URL of the a1score deployment (default: `https://a1score.app`) | Optional |
| `HEALTH_SECRET` | Secret token matching `HEALTH_SECRET` or `CRON_SECRET` on a1score | **Required** |
| `DISCORD_WEBHOOK_URL` | Discord Channel Webhook URL for alerting | Optional* |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token from `@BotFather` | Optional* |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID to receive alerts | Optional* |

*\* At least one notification channel (`DISCORD_WEBHOOK_URL` or Telegram) should be configured.*

---

## Local Development & Testing

You can run and test the worker locally using Cloudflare Wrangler:

```bash
# 1. Navigate to worker directory
cd workers/health-monitor

# 2. Start local worker simulator
npx wrangler dev
```

### Manual Trigger Testing

When running locally (or deployed), you can hit the HTTP endpoints directly:

- `GET http://localhost:8787/run`: Triggers an immediate health probe check and returns the status JSON.
- `GET http://localhost:8787/state`: Inspects the current state of consecutive component failures and alert flags.

To test with mock secrets locally, create `.dev.vars`:

```env
HEALTH_URL="http://localhost:3000"
HEALTH_SECRET="dev-health-secret"
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

---

## Cloudflare Deployment

### Step 1: Login to Cloudflare Wrangler
```bash
npx wrangler login
```

### Step 2: Provision Cloudflare KV Namespace (Optional but Recommended)
To preserve consecutive failure counters across edge isolates:

```bash
npx wrangler kv:namespace create "HEALTH_STATE"
```

Copy the generated namespace ID and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "HEALTH_STATE"
id = "<YOUR_NAMESPACE_ID>"
```

### Step 3: Set Production Secrets
```bash
npx wrangler secret put HEALTH_SECRET
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

### Step 4: Deploy Worker
```bash
npx wrangler deploy
```

Once deployed, the cron schedule will automatically run every 15 minutes.
