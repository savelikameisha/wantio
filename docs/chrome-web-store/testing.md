# Extension verification

Run `npm run build:extension`, `npm test`, and `npm run lint`.

`node scripts/test-extension-live.mjs` launches real Chromium with the unpacked extension, grants activeTab through the Chrome action, and runs the actual popup code and Chrome APIs. Requires Playwright Chromium and either `TEST_SUPABASE_SERVICE_ROLE_KEY` or `WANTIO_TEST_ENV_FILE` pointing to a private environment file with `SUPABASE_SERVICE_ROLE_KEY`. Never commit that file. The public Supabase configuration comes from `.env.local`.

The test creates a disposable account on the configured backend and removes it in finally. It checks the real first-party auth handoff, local metadata extraction, inline edits, image selection, draft restoration, offline retry, saved field values, duplicate prevention, and disconnected state. `EXTENSION_PATH` can point to an unpacked release ZIP to verify the distributed package. It does not exercise Google's interactive OAuth consent screen or Chrome Web Store's publication process.

Unit tests cover single-flight refresh, retaining credentials during a network failure, invalid refresh rejection, logout during refresh, retrying unauthorized requests, serialized draft storage, save receipts, expiration, and retention limits.

UI screenshots are saved to `test-results/extension/`. The lamp used in the fixture is an original SVG illustration, with fictional product details for reproducible screenshots.
