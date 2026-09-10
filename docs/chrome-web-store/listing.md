# Wantio 2.0.0 — existing listing update

Extension ID: `imblfhjhilgcemgfodeoiolcdibhceah`  
Existing listing: https://chromewebstore.google.com/detail/wantio/imblfhjhilgcemgfodeoiolcdibhceah  
Store version observed September 10, 2026: 1.0.0. This package is an update to that listing; do not create another extension.

## Listing copy

Name: Wantio

Summary: Save products to your personal wishlist. Choose a photo, edit the details, and keep your next finds together.

Description:

A little home for your next find.

Save products from the page you are browsing to your Wantio wishlist. Click Wantio, check the details, and save.

• Choose a product photo from the page or paste an image link.
• Edit the name and price right in the preview.
• Choose or create labels and add private notes in More details.
• Pick up where you left off with drafts kept on your device.
• Open your wishlist at wantio.app whenever you need it.

Sign in with your Google account to connect the extension. Product detection depends on the page; you can correct or enter details before saving. The extension reads a page when you click it, not in the background. Chrome’s internal pages and the Chrome Web Store cannot be read.

Website / support URL: https://wantio.app/extension  
Privacy policy: https://wantio.app/privacy  
Developer / support contact: saveli.design@gmail.com (same contact as the existing listing)  
Language: English  
Category: Shopping

## What changed

- New blue Wantio identity and neutral interface.
- Product preview with editable title and price, image selection, and optional details.
- Redesigned sign-in, connection, error, and saved states.
- Local drafts restored after the popup closes.
- Saving and token refresh handled in the background worker; recoverable network errors retain changes.
- Save confirmations and stable item IDs prevent duplicate items on retry.
- Updated installation help and privacy policy.

## Single purpose

Allow users to save and organize products from the current page in their personal Wantio wishlist.

## Permission justifications

- `activeTab`: temporarily access the page after the user clicks Wantio, to prepare product details.
- `scripting`: run bundled product metadata extraction on that page after the user invokes the extension.
- `storage`: keep account connection tokens and recent drafts/save confirmations locally.
- `https://wantio.app/*`: retrieve public connection settings, connect the account on `/auth/extension`, and save or explicitly look up product details through the Wantio API.
- `https://zfrdcuztrujsmrsnppes.supabase.co/*`: refresh authentication and retrieve and create the signed-in user's labels.

No history permission, persistent access to all shopping sites, remotely hosted code, advertising, or analytics SDK. All extension executable code is in the ZIP.

## Privacy practices to review in the dashboard

Declare Authentication information and Website content as in the existing listing. Also declare Personally identifiable information for the associated account email/name, and Web history for the user-selected product URLs stored as wishlist links (this is not background history collection). The exact applicable checkboxes should describe the integrated Wantio service as well as local extension storage. Product price is an item attribute; the extension does not collect payment cards or transaction credentials.

Use is limited to the extension's single purpose. Data is not sold or used for advertising, unrelated purposes, creditworthiness, or lending. Read the live policy and confirm these declarations in the dashboard before submission.

## Reviewer instructions

1. Install the uploaded package in Chrome.
2. Click Wantio and select Connect to Wantio. Sign in with a Google account on wantio.app in the same Chrome profile. No paid subscription is required.
3. Wait for the connected confirmation, open a public product page, and click Wantio.
4. Click the product name or price to edit. Click the image to choose another or provide a public image URL. Use @label to choose an existing label or create one.
5. Save to wishlist, then open wantio.app to see the item. Delete the test item when finished.
6. Drafts can be verified by editing the product name, closing the popup, and reopening it on the same page.

## Upload steps

Open the developer dashboard → existing Wantio item → Package → Upload new package. Upload `wantio-extension-2.0.0.zip`, update listing artwork/text and privacy disclosures, verify the privacy/support links, and submit for review. Do not change the item ID. Installed Store copies receive the update through Chrome once the update is approved and published.

The public manual download and the Store publication are separate. Uploading/preparing this bundle does not mean Google has approved or published it.
