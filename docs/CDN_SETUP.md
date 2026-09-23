# Serving API-Football through BunnyCDN

This app supports [API-Football's official guide](https://www.api-football.com/documentation-v3#tag/CDN/Optimizing-Sports-Websites-with-BunnyCDN):
put a BunnyCDN pull zone in front of the API, let the CDN inject the API key at the edge,
and cache responses there. The app integrates with that setup — it does not replace it.

## Current status: fully provisioned ✅

Both pull zones exist and are live, configured exactly per the guide:

| Zone | Hostname | Origin | Edge rules |
|---|---|---|---|
| `a1score-api` (id 6673577) | `https://a1score-api.b-cdn.net` | `https://v3.football.api-sports.io` | key header + 60s edge cache + 60s browser cache |
| `a1score-media` (id 6673662) | `https://a1score-media.b-cdn.net` | `https://media.api-sports.io` | default zone caching |

Env vars are set in `.env.local` (and must be mirrored to production with
`freebuff-deploy env set` before deploying):

```
API_FOOTBALL_CDN_URL=https://a1score-api.b-cdn.net
API_FOOTBALL_CDN_MEDIA_URL=https://a1score-media.b-cdn.net
API_FOOTBALL_KEY=<still used only as direct-mode fallback>
```

Verified live: `curl https://a1score-api.b-cdn.net/fixtures?live=all` returns real
match data with `Cdn-Cache: HIT` on repeat requests, no key needed from the caller.

## Why (and what changes)

| | Direct (current default) | CDN mode |
|---|---|---|
| Server calls | `https://v3.football.api-sports.io` | `https://<your-zone>.b-cdn.net` |
| API key | sent by our server (`API_FOOTBALL_KEY`) | injected by the CDN edge rule — never sent by us |
| Caching | Next.js Data Cache (per-deployment) | Next Data Cache **+** BunnyCDN edge cache (per zone, global) |
| Media URLs | `https://media.api-sports.io/...` | rewritten to your media pull zone |

The browser never talks to api-sports.io in either mode — that constraint is unchanged.

## 1. Create the data pull zone

1. Log in to [BunnyCDN](https://bunny.net) → **CDN** → **Add Pull Zone**.
2. **Origin URL:** `https://v3.football.api-sports.io`
3. Choose a tier (Standard or High Volume), save, then **Skip Instructions**.

## 2. Key injection + edge caching (edge rules)

> Already done for both current zones via the Bunny API
> (`POST /pullzone/{id}/edgerules/addOrUpdate`, new Edge Script schema with
> `ActionType` 6/3/16). The steps below are for recreating it in the dashboard.

On the pull zone → **Edge Rules** → **Add New Rule**:

1. **Add Request Header**
   - Header Name: `x-apisports-key`
   - Header Value: your API-Football key
2. **Override Cache Time** — `60` seconds (tune per endpoint as the guide suggests:
   leagues/standings can be much longer, live fixtures short)
3. **Override Browser Cache Time** — same value
4. **Condition:** `Request Method` = `GET`
5. Save the rule.

## 3. Locking the zone (important caveat)

The guide's **Allowed referrers** security step applies to *browser/widget* usage —
it filters on the `Referer` header. This app calls the CDN **server-side** (Next.js
fetchers), and server fetches send no `Referer` header — enabling an allowed-referrers
lock would 403 our own traffic. Do **not** enable it for this architecture.

Equivalent protection here:

- Keep the zone hostname out of client code (it lives only in server env vars — the
  browser only ever sees our `/api/*` routes and image optimizer URLs).
- The app's per-IP rate limiter on `/api/*` stops third parties from proxying through
  your deployment.
- If the zone URL leaks and gets abused, Bunny's **Token Authentication** or IP
  allow-listing on the zone are the stronger options.

Also note Bunny's allowed-referrers check would likewise never see a Referer for
`next/image` optimizer requests, another reason to skip it.

## 4. Optional: media pull zone for logos/photos

Same flow, origin `https://media.api-sports.io/`, then set
`API_FOOTBALL_CDN_MEDIA_URL` (below). The app rewrites every logo/photo URL it maps
through this host, and extends the Next.js image allow-list with it automatically.

## 5. Point the app at the zone (env vars)

```bash
# CDN mode — all server→API traffic flows through your zone.
API_FOOTBALL_CDN_URL=https://my-url-to-call-api-sports.b-cdn.net

# Optional media zone — logo/photo URLs are rewritten through it.
API_FOOTBALL_CDN_MEDIA_URL=https://my-media-zone.b-cdn.net
```

- In CDN mode the app **stops sending** `API_FOOTBALL_KEY` upstream (the edge rule
  injects it — the guide explicitly blanks the key on the client side). Keep the key
  configured in your BunnyCDN edge rule, not the app.
- In direct mode (no `API_FOOTBALL_CDN_URL`), the app sends the key as before.
- Malformed/`http://` values are rejected and the app falls back to direct mode.

## 6. Verify

1. Open `https://<your-zone>.b-cdn.net/status` in a browser — you should see JSON
   without any key (proves the edge rule injects it).
2. Response headers should include `Cdn-Cache: HIT` (or `Expired` after the TTL) and
   `Cache-Control: public, max-age=60`.
3. Then check the app: `GET /api/status` on your deployment reports

```json
{
  "cdn": {
    "enabled": true,
    "dataBaseUrl": "https://<your-zone>.b-cdn.net/",
    "mediaBaseUrl": "https://<your-zone-media>.b-cdn.net/",
    "edgeCacheHits": 12,
    "edgeCacheMisses": 3
  }
}
```

`edgeCacheHits` climbing while `dailyCallCount` stays flat is the optimization working:
BunnyCDN absorbs repeat endpoint+parameter combinations globally, in front of the
Next.js Data Cache.

## Two cache layers, on purpose

The guide caches per endpoint+parameter at the edge; the app's Next.js Data Cache caches
per deployment with per-data-type windows. They compose: the Data Cache deduplicates
server-side traffic shape, and the CDN absorbs repeat traffic across deployments/regions.
Tune the edge-rule TTLs per endpoint family as the guide suggests (leagues: hours,
fixtures: 30–60s), keeping live data below ~60s.
