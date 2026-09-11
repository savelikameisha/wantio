# Internal design reference

`/internal/design` combines the brand reference and live component examples.
The page imports production controls, ProductCard, BottomSheet and ItemDetailSheet;
all demonstration data and callbacks are local to the page. No wishlist writes are
performed. Brand decisions and planned changes are explicitly distinguished.

## Owner-only access

Set `WANTIO_ADMIN_USER_ID` on the server to the owner's immutable Supabase user ID.
Do not use a NEXT_PUBLIC variable, email substring, client-side check, or editable
user metadata for authorization. The page calls Supabase `getUser()` and checks
that verified ID on every request. Missing configuration, invalid sessions and
other users fail closed. Both anonymous visitors and other signed-in users receive 404. The middleware
checks internal requests before streaming, including RSC requests; the page
rechecks authorization before rendering. The page is dynamically
rendered and carries noindex metadata. It is not linked from ordinary user menus.

## Verification

`npm test` includes denial cases for missing configuration, guests, other users
(including forged admin metadata) and failed session verification, plus owner access.
Build the app first (`npm run build`). For browser checks, run `WANTIO_TEST_ENV_FILE=/path/to/private.env node
scripts/test-design-library.mjs`. The script creates two disposable accounts,
starts a local app with only the first ID authorized, checks owner interactions
and guest/ordinary-user denial, and removes test accounts in finally. Never set a
test account as the production administrator.

The reference should evolve alongside changes to cards, navigation and dialogs.
It is not a reason to freeze the current UI or mark pending brand proposals approved.
