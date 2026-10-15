# Accounts setup (Phase 6a)

Optional sign-in syncs follows and settings across devices. The code ships
dark until the steps below are done: without a real anon key at build time,
or before the tables exist, the site behaves exactly as before.

## 1. Database (required, before merging)

Run `supabase/migrations/20261015120000_user_accounts.sql` in the Supabase SQL
editor (or `supabase db push`). It is safe to re-run. It creates:

| Object | Purpose |
|---|---|
| `public.user_follows` | One row per followed player / club / league, per user |
| `public.user_settings` | Theme, currency, units, TV country per user |
| RLS policies "Own follows" / "Own settings" | Signed-in users read and write only their own rows; `anon` gets nothing |
| `limit_user_follows` trigger | Max 500 follows per account |
| `delete_my_account()` | Lets a signed-in user delete their own account (rows cascade) |

If the app is deployed before this runs, sign-in still works but the More card
shows "Couldn't sync".

## 2. Supabase Auth settings (dashboard)

**Authentication → URL Configuration**
- Site URL: `https://a1score.app`
- Redirect URLs: `https://a1score.app/auth/callback`, plus preview hosts if
  you test there (e.g. `https://*.a1score.pages.dev/auth/callback`).

**Authentication → Email Templates → Magic Link** — add the code so people
who open the email in another app or browser can still sign in:

```html
<h2>Sign in to a1score</h2>
<p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
<p>Or enter this code: <strong>{{ .Token }}</strong></p>
```

**Authentication → SMTP Settings** — Supabase's built-in sender is rate
limited (a few emails per hour) and meant for testing. Add your own SMTP
provider (Resend, Postmark, SES…) before announcing sign-in.

## 3. Build environment (Cloudflare Pages)

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set at **build** time (it is
  inlined). CI's placeholder key keeps sign-in hidden there on purpose.
- Optional Google sign-in: enable the Google provider in Supabase
  (Authentication → Providers) with your Google OAuth client, then set
  `NEXT_PUBLIC_AUTH_GOOGLE=1`. The button stays hidden until then.

## How sync behaves

- First sign-in on a device: device + account follows are merged (earliest
  "followed since" wins), settings already in the account win and the device
  fills gaps; the result is saved to the account.
- Later visits on that device: the account is the source of truth.
- While signed in: each follow / setting change is written within ~0.5 s.
- Sign out keeps the device's copy. Delete account (Settings → Account)
  removes the account and its rows; the device keeps its copy.
- The Supabase SDK and sync engine load only on the sign-in pages or when the
  device has a saved session, so anonymous visitors don't download them.
