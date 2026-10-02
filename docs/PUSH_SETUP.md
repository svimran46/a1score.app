# a1score.app — Push Notification Production Setup & Runbook

This guide covers the deployment, configuration, and verification of Web Push notifications on Cloudflare Pages and Cloudflare Workers.

---

## 1. Overview & Architecture

- **Runtime:** Native Edge Runtime (`export const runtime = "edge"`).
- **Crypto & Standards:** Pure WebCrypto (`crypto.subtle`) implementing RFC 8292 (VAPID) and RFC 8291 (Message Encryption for Web Push via AES-128-GCM). Zero Node.js crypto dependencies.
- **Storage:** Cloudflare KV namespace `PUSH_SUBSCRIPTIONS_KV` for persistent, serverless edge storage. In production, silent in-memory fallback is disabled (returns HTTP 503 if KV is not bound).
- **Cron Trigger:** Standalone Cloudflare Worker in `workers/push-cron/` triggers `POST /api/notifications/cron` every 6 hours with a secure Bearer token (`CRON_SECRET`).
- **Privacy & PII Invariant:** Zero personal identifiable information (PII) is stored. Only the anonymous push endpoint, encryption keys (`p256dh`, `auth`), followed player IDs, threshold, and notification timestamps/values (for idempotency) are retained.

---

## 2. Generating VAPID Keys

To generate a new cryptographic P-256 key pair for VAPID:

```bash
npx web-push generate-vapid-keys
```

Example Output:
```text
=======================================

Public Key:
BBln8bWJGBqeIIldpfYmMB5MeFuwjHCf-gOLCbQx_MJnIrL6pzjbcMVNXmCRaxhd5CTA05kMTQP-rPz8IIdh6XI

Private Key:
1dMmvtr3Wo0qNXByM5YJMmeW_0wm1XvQfyjZl_uHXsE

=======================================
```

---

## 3. Cloudflare Configuration & Environment Variables

### A. Create Cloudflare KV Namespace (`PUSH_SUBSCRIPTIONS_KV`)

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) &rarr; **Workers & Pages** &rarr; **KV**.
2. Click **Create Namespace**.
3. Name it: `a1score-push-subscriptions`.
4. Go to **Workers & Pages** &rarr; **Pages** &rarr; Select your project (`a1score`).
5. Go to **Settings** &rarr; **Functions** &rarr; **KV namespace bindings**.
6. Click **Add binding**:
   - **Variable name:** `PUSH_SUBSCRIPTIONS_KV`
   - **KV namespace:** `a1score-push-subscriptions`
7. Save and re-deploy.

### B. Environment Variables for Cloudflare Pages (`a1score`)

Navigate to **Pages** &rarr; **a1score** &rarr; **Settings** &rarr; **Environment variables** &rarr; **Production**:

| Variable Name | Type | Value / Description |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Plain text / Env | Base64URL-encoded VAPID Public Key (accessible to client browser) |
| `VAPID_PUBLIC_KEY` | Plain text / Env | Same Base64URL-encoded VAPID Public Key |
| `VAPID_PRIVATE_KEY` | Secret (Encrypted) | 32-byte Base64URL-encoded VAPID Private Key |
| `VAPID_SUBJECT` | Plain text / Env | Contact URI, e.g. `mailto:admin@a1score.app` |
| `CRON_SECRET` | Secret (Encrypted) | High-entropy random secret (e.g. `openssl rand -hex 32`) |

### C. Deploy the Cron Worker (`workers/push-cron`)

Cloudflare Pages does not run scheduled cron events. A lightweight worker executes the cron trigger:

1. Navigate to `workers/push-cron/`:
   ```bash
   cd workers/push-cron
   ```
2. Set the `CRON_SECRET` in the worker:
   ```bash
   npx wrangler secret put CRON_SECRET
   ```
   *(Paste the exact value chosen for `CRON_SECRET` above)*
3. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```
4. Verify cron triggers in the Cloudflare dashboard under **Workers & Pages** &rarr; `a1score-push-cron` &rarr; **Triggers** (scheduled for `0 */6 * * *`).

---

## 4. Manual Device Verification Checklist

Because browser push services (Apple Push Notification service and Google FCM) require an active user interaction, service worker registration, and native OS permission modals, full end-to-end delivery must be verified on physical devices:

### Android (Chrome / Brave / Edge)
- [ ] 1. Open `https://a1score.app` on an Android phone.
- [ ] 2. Tap **Watchlist** in navigation, then tap **Turn on alerts** or **Get alerts**.
- [ ] 3. Ensure the browser displays the native OS permission prompt: "a1score.app wants to send you notifications".
- [ ] 4. Tap **Allow**.
- [ ] 5. Tap **Send test alert** in the Notification Settings card.
- [ ] 6. Confirm notification arrives in the system tray:
       - Header: `Value update: Lamine Yamal`
       - Body: `€150M to €180M (+20.0%)`
       - Icon / badge: `a1score` app icon.
- [ ] 7. Tap notification; verify it focuses or navigates to `/players/lamine-yamal-1051588`.

### iOS 16.4+ (iPhone / iPad)
- [ ] 1. Open `https://a1score.app` in Safari.
- [ ] 2. Confirm that when not installed, the UI shows the "iOS Web Push Setup" banner explaining:
       - *Tap Share in Safari and choose 'Add to Home Screen'*.
- [ ] 3. Tap **Share** &rarr; **Add to Home Screen**.
- [ ] 4. Launch the installed PWA from the iOS Home Screen (running in standalone mode).
- [ ] 5. Navigate to **Watchlist** &rarr; Tap **Get alerts**.
- [ ] 6. Confirm iOS permission dialog appears: "a1score Would Like to Send You Notifications".
- [ ] 7. Tap **Allow**.
- [ ] 8. Tap **Send test alert**.
- [ ] 9. Lock screen or switch apps; confirm the push banner arrives on iOS lock screen / Notification Center.
- [ ] 10. Tap notification; confirm the standalone app opens directly to the relevant player or watchlist.

### Permission Denied Check
- [ ] 1. In browser settings, set Notification permissions to **Blocked** / **Denied**.
- [ ] 2. Refresh `https://a1score.app/watchlist`.
- [ ] 3. Confirm that NO permission modal appears on load.
- [ ] 4. Confirm the settings card displays: `Blocked in browser` and displays helpful explanatory copy instructing how to unblock in browser/device settings without spamming prompts.

### Cron Execution Check
- [ ] 1. Run direct curl command with invalid secret:
       ```bash
       curl -i -X POST https://a1score.app/api/notifications/cron
       ```
       Confirm response is `401 Unauthorized`.
- [ ] 2. Run direct curl command with valid secret:
       ```bash
       curl -i -X POST https://a1score.app/api/notifications/cron \
         -H "Authorization: Bearer <YOUR_CRON_SECRET>"
       ```
       Confirm response is `200 OK` with JSON `{ "success": true, ... }`.
