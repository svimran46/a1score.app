# Deploying LiveScore to a VPS

Guide for hosting on your own server (Ubuntu/Debian assumed; adapt package
names otherwise). Two process managers are covered — pick **pm2 (Option A)**
or **systemd (Option B)**, not both.

## 0. Prerequisites

- A VPS with 1 vCPU / 1 GB RAM minimum (2 GB comfortable), Ubuntu 22.04+
- **A domain or subdomain pointing at the VPS.** A bare IP works for a quick
  test on `:3000`, but browsers want trusted HTTPS and Let's Encrypt needs a
  hostname. Either:
  - an A record on a domain you own (e.g. `live.a1score.app` → VPS IP), or
  - a free subdomain from [DuckDNS](https://www.duckdns.org)
    (e.g. `a1score.duckdns.org`)
- DNS record created **before** first Caddy start (it requests the certificate
  on startup)

## 1. Runtime + code

```bash
# Node.js 22 LTS (Next.js 16 requires >= 20.9)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
node -v   # v22.x

sudo adduser --system --group --home /opt/livescore livescore || true
sudo git clone https://github.com/svimran46/a1score.app.git /opt/livescore
sudo chown -R livescore:livescore /opt/livescore
cd /opt/livescore

# This repo is locked with Bun (bun.lock), so install with Bun — not npm ci
# (npm ci fails: there is no package-lock.json by design).
sudo npm install -g bun
bun install
```

> If `/opt/livescore` already exists from an earlier attempt, `git clone` fails
> with "destination path already exists" — just `cd /opt/livescore && git pull`.

## 2. Server-only environment

Create `.env.production` in the repo root (already git-ignored — never commit):

```bash
cat > .env.production <<'EOF'
API_FOOTBALL_KEY=your_api_football_key
API_FOOTBALL_CDN_URL=https://a1score-api.b-cdn.net
API_FOOTBALL_CDN_MEDIA_URL=https://a1score-media.b-cdn.net
EOF
chmod 600 .env.production
```

- `API_FOOTBALL_KEY` — server-only; the browser never sees it. In CDN mode it
  is actually unused at runtime (the Bunny edge rule injects the key); it is
  kept as the direct-mode fallback.
- The `API_FOOTBALL_CDN_*` values route upstream calls through your BunnyCDN
  pull zones (see `docs/CDN_SETUP.md`).
- Next.js loads `.env.production` automatically on `next`/standalone start.

## 3. Build (standalone output)

`next.config.ts` sets `output: "standalone"`, so the build emits a
self-contained server in `.next/standalone` — a bare Node binary can run it
without `node_modules`:

```bash
bun run build

# IMPORTANT: the standalone output does not include client assets by design —
# copy them in or the site will render unstyled:
cp -r .next/static .next/standalone/.next/
# If the repo ever gains a public/ directory, also:
# cp -r public .next/standalone/
```

Layout after build:

```
.next/standalone/server.js      ← the server (only this runs in production)
.next/standalone/.next/static/  ← client assets (copied above)
```

## 4. Keep it running — pm2 (Option A) or systemd (Option B)

### Option A: pm2

```bash
sudo npm i -g pm2
cd /opt/livescore
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup        # run the command it prints (as your sudo user)
```

### Option B: systemd

```bash
sudo cp deploy/livescore.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now livescore
systemctl status livescore
```

> If the repo is not at `/opt/livescore`, run
> `sudo systemctl edit livescore` and override `WorkingDirectory=`,
> `ReadWritePaths=`, and `User=`.

Both run `node .next/standalone/server.js` bound to **127.0.0.1:3000** —
loopback only, so nothing is exposed before Caddy fronts it.

## 5. Caddy — HTTPS reverse proxy

```bash
sudo apt install -y caddy
sudo ufw allow 80,443/tcp        # if ufw is active
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo sed -i 's/\$SITE_DOMAIN/live.example.com/' /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy obtains and renews the Let's Encrypt certificate automatically. Open
`https://your-hostname` — done.

### Testing without a domain (temporary)

The app binds to loopback by default, so `http://VPS_IP:3000` times out from
the outside until you do **all three** of these:

```bash
# 1. Listen publicly instead of loopback
#    systemd:  sudo systemctl edit livescore  →  add under [Service]:
#                  Environment=HOSTNAME=0.0.0.0
#              then: sudo systemctl restart livescore
#    pm2:      set env.HOSTNAME = "0.0.0.0" in deploy/ecosystem.config.js,
#              then: pm2 restart livescore

# 2. Open the OS firewall
sudo ufw allow 3000/tcp

# 3. Open the PROVIDER firewall too (very common gotcha) — Hetzner/DO/Vultr/
#    AWS have a Cloud Firewall / Security Group in their web panel; allow
#    TCP 3000 there as well
```

Then open `http://VPS_IP:3000`. This is unencrypted — close it again once
Caddy is up (`sudo ufw delete allow 3000/tcp` and revert HOSTNAME).

This is unencrypted and fine only for checking that the server runs. Do not
leave `:3000` open publicly; remove the rule once Caddy is up
(`sudo ufw delete allow 3000/tcp`).

## 6. Verify

```bash
curl -s http://127.0.0.1:3000/api/status | head -c 400
# expect "cdn":{"enabled":true,...}
curl -sI https://your-hostname | head -5
```

Then check in a browser: home page shows live fixtures; DevTools → Network
shows **no request to api-sports.io** from the browser (only your domain).

## 7. Updating

```bash
cd /opt/livescore
sudo -u livescore git pull
sudo -u livescore bun install
sudo -u livescore bun run build
sudo -u livescore cp -r .next/static .next/standalone/.next/
# pm2:    pm2 restart livescore
# systemd: sudo systemctl restart livescore
```

`.next/standalone` is regenerated by every build; nothing else to sync.
`next/image` optimization cache lives in `.next/cache` — a restart keeps it.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Caddy can't get a certificate | DNS A record must point at this VPS *and* ports 80/443 reachable from the internet |
| `ERR_TOO_MANY_REDIRECTS` | Two redirects fighting — make sure no old nginx certbot config is also active |
| 502 from Caddy | `systemctl status livescore` (or `pm2 logs livescore`) — app not listening on 127.0.0.1:3000 |
| Live scores show "error" card | `curl 127.0.0.1:3000/api/status` — check `upstreamOk`; if `false`, the API key/CDN zone is the problem, not the app |
| Standalone build missing files | Build on the VPS itself; do not copy `.next` from a different machine/OS |
| Images 400 in `/_next/image` | The hostname isn't allow-listed — set `API_FOOTBALL_CDN_MEDIA_URL` and rebuild (config is build-time) |
