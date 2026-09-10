# Wantio

A personal wishlist: save product links or manual entries, organize them with tags, record purchases, and share a read-only list. Built with Next.js 16, React 19, Supabase and a Chrome extension.

Production: https://wantio.app

## Local development

Use Node.js 24 LTS.

```sh
npm ci
cp .env.local.example .env.local
# Fill in the public Supabase URL, anon key, and your application URL.
npm run dev
```

Google authentication is configured in Supabase. Allow `http://localhost:3000/auth/callback` for local development. For deployment, set `NEXT_PUBLIC_SITE_URL` to the production origin, update the Supabase Site URL and allow the `/auth/callback` redirect, including `?next=/auth/extension` for extension sign-in.

`OPENAI_API_KEY` is optional. Without it, product details come from page metadata and structured data. Some shops block extraction; all fields can be entered manually. There is no automatic background price tracking or price-alert service in this release.

## Database

The versioned files in `supabase/migrations/` are the source of truth. Do not run `schema.sql` alone against production; it is only the initial schema snapshot.

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The restoration migrations preserve existing profile IDs, import the later prototype's `items`, `labels`, and `price_history` into the current schema, and leave those source tables intact. Original archived items remain archived and can be restored from Settings. Public sharing starts disabled; enable it in Settings to create the new private-by-default sharing arrangement. Notes and account identifiers are excluded from shared lists.

Before applying to an existing database, back up its data and rehearse in a transaction:

```sh
node scripts/database-rehearsal.mjs /tmp/wantio-rehearsal.sql
supabase db query --linked --file /tmp/wantio-rehearsal.sql
```

The RLS rehearsal currently expects at least two existing profiles and the legacy `items` table. Run it only on the restoration database or a matching staging copy. Its final rollback removes all test changes.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run build:extension
npx playwright install chromium
npm run test:e2e
```

Browser tests cover public pages by default. Providing `TEST_SUPABASE_SERVICE_ROLE_KEY` enables a complete wishlist lifecycle using a temporary confirmed test account, deleted in `finally`. Use a dedicated staging database for routine development. Never expose this admin key to the browser or commit it. `TEST_BASE_URL` can point these tests at an existing deployment.

## Chrome extension

1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select `chrome-extension/`.
3. Open the extension and sign in to Wantio.
4. On a product page, review the extracted details and save.

Release 2 uses the production origin above. If you change the domain, update `background.js`, `popup.js`, and `manifest.json` together, plus Supabase redirect settings. `npm run build:extension` regenerates the shared price parser; do not hand-edit `chrome-extension/price.js`.

Tokens stay in the extension's local storage and are refreshed by the background worker. Reconnect the extension after changing the Supabase project.
